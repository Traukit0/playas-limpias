import { useState, useCallback, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { MapBounds, MeasurementResult, DrawResult, ExportOptions } from '@/types/map'

export function useMapTools(map: maplibregl.Map | null) {
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [measurements, setMeasurements] = useState<MeasurementResult[]>([])
  const [drawings, setDrawings] = useState<DrawResult[]>([])
  const [isMeasuring, setIsMeasuring] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  
  const measurePoints = useRef<[number, number][]>([])
  const drawPoints = useRef<[number, number][]>([])
  const measureId = useRef<string>('')
  const drawId = useRef<string>('')

  // Función para calcular distancia entre dos puntos
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3 // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }, [])

  // Función para formatear distancia
  const formatDistance = useCallback((distance: number): string => {
    if (distance < 1000) {
      return `${Math.round(distance)} m`
    } else {
      return `${(distance / 1000).toFixed(2)} km`
    }
  }, [])

  // Función para calcular área de un polígono
  const calculatePolygonArea = useCallback((coordinates: number[][][]): number => {
    if (!coordinates || coordinates.length === 0) return 0
    
    const coords = coordinates[0]
    let area = 0
    
    for (let i = 0; i < coords.length; i++) {
      const j = (i + 1) % coords.length
      area += coords[i][0] * coords[j][1]
      area -= coords[j][0] * coords[i][1]
    }
    
    return Math.abs(area) / 2
  }, [])

  // Función para formatear área
  const formatArea = useCallback((area: number): string => {
    if (area < 10000) {
      return `${Math.round(area)} m²`
    } else {
      return `${(area / 10000).toFixed(2)} ha`
    }
  }, [])

  // Función para generar ID único
  const generateId = useCallback((): string => {
    return `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Función para activar herramienta de medición
  const startMeasuring = useCallback(() => {
    if (!map) return
    
    setActiveTool('measure')
    setIsMeasuring(true)
    measurePoints.current = []
    measureId.current = generateId()
    
    // Cambiar cursor
    map.getCanvas().style.cursor = 'crosshair'
    
    // Agregar listener para clicks
    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      const { lng, lat } = e.lngLat
      measurePoints.current.push([lng, lat])
      
      // Agregar marcador al mapa
      const marker = new maplibregl.Marker({
        color: '#3b82f6',
        draggable: false
      })
        .setLngLat([lng, lat])
        .addTo(map)
      
      // Si hay más de un punto, dibujar línea
      if (measurePoints.current.length > 1) {
        const sourceId = `measure-source-${measureId.current}`
        const layerId = `measure-layer-${measureId.current}`
        
        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: measurePoints.current
              }
            }
          })
          
          map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3b82f6',
              'line-width': 2
            }
          })
        } else {
          const source = map.getSource(sourceId) as maplibregl.GeoJSONSource
          source.setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: measurePoints.current
            }
          })
        }
        
        // Calcular y mostrar distancia
        const totalDistance = measurePoints.current.reduce((total, point, index) => {
          if (index === 0) return 0
          const prevPoint = measurePoints.current[index - 1]
          return total + calculateDistance(prevPoint[1], prevPoint[0], point[1], point[0])
        }, 0)
        
        // Agregar etiqueta de distancia
        const labelId = `measure-label-${measureId.current}`
        if (!map.getSource(labelId)) {
          map.addSource(labelId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {
                text: formatDistance(totalDistance)
              },
              geometry: {
                type: 'Point',
                coordinates: [lng, lat]
              }
            }
          })
          
          map.addLayer({
            id: labelId,
            type: 'symbol',
            source: labelId,
            layout: {
              'text-field': ['get', 'text'],
              'text-font': ['Open Sans Regular'],
              'text-size': 12,
              'text-offset': [0, -1.5],
              'text-anchor': 'top'
            },
            paint: {
              'text-color': '#1e40af',
              'text-halo-color': '#ffffff',
              'text-halo-width': 1
            }
          })
        }
      }
    }
    
    map.on('click', handleMapClick)
    
    // Guardar referencia para poder remover el listener
    map._measureClickHandler = handleMapClick
  }, [map, calculateDistance, formatDistance, generateId])

  // Función para detener medición
  const stopMeasuring = useCallback(() => {
    if (!map) return
    
    setActiveTool(null)
    setIsMeasuring(false)
    map.getCanvas().style.cursor = ''
    
    if (map._measureClickHandler) {
      map.off('click', map._measureClickHandler)
      delete map._measureClickHandler
    }
    
    // Guardar medición
    if (measurePoints.current.length > 1) {
      const totalDistance = measurePoints.current.reduce((total, point, index) => {
        if (index === 0) return 0
        const prevPoint = measurePoints.current[index - 1]
        return total + calculateDistance(prevPoint[1], prevPoint[0], point[1], point[0])
      }, 0)
      
      const measurement: MeasurementResult = {
        id: measureId.current,
        type: 'distance',
        value: totalDistance,
        formattedValue: formatDistance(totalDistance),
        coordinates: measurePoints.current,
        timestamp: new Date().toISOString()
      }
      
      setMeasurements(prev => [...prev, measurement])
    }
  }, [map, calculateDistance, formatDistance])

  // Función para activar herramienta de dibujo
  const startDrawing = useCallback(() => {
    if (!map) return
    
    setActiveTool('draw')
    setIsDrawing(true)
    drawPoints.current = []
    drawId.current = generateId()
    
    // Cambiar cursor
    map.getCanvas().style.cursor = 'crosshair'
    
    // Agregar listener para clicks
    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      const { lng, lat } = e.lngLat
      drawPoints.current.push([lng, lat])
      
      // Agregar marcador al mapa
      const marker = new maplibregl.Marker({
        color: '#10b981',
        draggable: false
      })
        .setLngLat([lng, lat])
        .addTo(map)
      
      // Si hay más de dos puntos, dibujar polígono
      if (drawPoints.current.length > 2) {
        const sourceId = `draw-source-${drawId.current}`
        const layerId = `draw-layer-${drawId.current}`
        
        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Polygon',
                coordinates: [drawPoints.current]
              }
            }
          })
          
          map.addLayer({
            id: layerId,
            type: 'fill',
            source: sourceId,
            paint: {
              'fill-color': '#10b981',
              'fill-opacity': 0.3
            }
          })
          
          map.addLayer({
            id: `${layerId}-outline`,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': '#10b981',
              'line-width': 2
            }
          })
        } else {
          const source = map.getSource(sourceId) as maplibregl.GeoJSONSource
          source.setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [drawPoints.current]
            }
          })
        }
      }
    }
    
    map.on('click', handleMapClick)
    
    // Guardar referencia para poder remover el listener
    map._drawClickHandler = handleMapClick
  }, [map, generateId])

  // Función para detener dibujo
  const stopDrawing = useCallback(() => {
    if (!map) return
    
    setActiveTool(null)
    setIsDrawing(false)
    map.getCanvas().style.cursor = ''
    
    if (map._drawClickHandler) {
      map.off('click', map._drawClickHandler)
      delete map._drawClickHandler
    }
    
    // Guardar dibujo
    if (drawPoints.current.length > 2) {
      const area = calculatePolygonArea([drawPoints.current])
      
      const drawing: DrawResult = {
        id: drawId.current,
        type: 'polygon',
        area: area,
        formattedArea: formatArea(area),
        coordinates: drawPoints.current,
        timestamp: new Date().toISOString()
      }
      
      setDrawings(prev => [...prev, drawing])
    }
  }, [map, calculatePolygonArea, formatArea])

  // Función para exportar mapa
  const exportMap = useCallback(async (options: ExportOptions = {}) => {
    if (!map) return null
    
    const { format = 'png', quality = 0.8, filename = 'mapa-playas-limpias' } = options
    
    try {
      // Esperar a que el mapa se renderice completamente
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const canvas = map.getCanvas()
      const dataURL = canvas.toDataURL(`image/${format}`, quality)
      
      // Crear enlace de descarga
      const link = document.createElement('a')
      link.download = `${filename}.${format}`
      link.href = dataURL
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      return dataURL
    } catch (error) {
      console.error('Error al exportar mapa:', error)
      return null
    }
  }, [map])

  // Función para limpiar todas las herramientas
  const clearTools = useCallback(() => {
    if (!map) return
    
    setActiveTool(null)
    setIsMeasuring(false)
    setIsDrawing(false)
    map.getCanvas().style.cursor = ''
    
    // Remover listeners
    if (map._measureClickHandler) {
      map.off('click', map._measureClickHandler)
      delete map._measureClickHandler
    }
    
    if (map._drawClickHandler) {
      map.off('click', map._drawClickHandler)
      delete map._drawClickHandler
    }
    
    // Limpiar capas de medición y dibujo
    const layers = map.getStyle().layers || []
    layers.forEach(layer => {
      if (layer.id.includes('measure-') || layer.id.includes('draw-')) {
        if (map.getLayer(layer.id)) {
          map.removeLayer(layer.id)
        }
        if (map.getSource(layer.id.replace('-layer-', '-source-'))) {
          map.removeSource(layer.id.replace('-layer-', '-source-'))
        }
      }
    })
    
    // Limpiar marcadores
    const markers = document.querySelectorAll('.maplibre-marker')
    markers.forEach(marker => marker.remove())
  }, [map])

  // Función para eliminar una medición específica
  const removeMeasurement = useCallback((id: string) => {
    setMeasurements(prev => prev.filter(m => m.id !== id))
  }, [])

  // Función para eliminar un dibujo específico
  const removeDrawing = useCallback((id: string) => {
    setDrawings(prev => prev.filter(d => d.id !== id))
  }, [])

  return {
    activeTool,
    measurements,
    drawings,
    isMeasuring,
    isDrawing,
    startMeasuring,
    stopMeasuring,
    startDrawing,
    stopDrawing,
    exportMap,
    clearTools,
    removeMeasurement,
    removeDrawing
  }
}

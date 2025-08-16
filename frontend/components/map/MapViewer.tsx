"use client"

import React, { useRef, useEffect, useState, useCallback } from 'react'
import Map, { 
  Source,
  Layer,
  Popup
} from 'react-map-gl'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MAP_CONFIG } from '@/lib/map-config'
import { LayerControl } from './LayerControl'
import { Toolbar } from './Toolbar'
import { Search } from './Search'
import { Legend } from './Legend'
import { MeasurementsPanel } from './MeasurementsPanel'
import { MapPopup } from './MapPopup'
import { MapStyleControl } from './MapStyleControl'
import { useMapData } from '@/hooks/useMapData'
import { useMapLayers } from '@/hooks/useMapLayers'
import { useMapTools } from '@/hooks/useMapTools'
import { useMapHover } from '@/hooks/useMapHover'

interface MapViewerProps {
  initialViewState?: {
    longitude: number
    latitude: number
    zoom: number
  }
  onMapLoad?: (map: maplibregl.Map) => void
}

export function MapViewer({ 
  initialViewState = {
    longitude: -73.447, // Centro exacto de los datos
    latitude: -42.52,
    zoom: 15
  }, 
  onMapLoad 
}: MapViewerProps) {
  const [currentMapStyle, setCurrentMapStyle] = useState(MAP_CONFIG.styles.satellite)
  const mapRef = useRef<any>(null)
  const [viewState, setViewState] = useState(initialViewState)
  const [popupInfo, setPopupInfo] = useState<any>(null)
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null)

  // Hooks personalizados
  const { layers, visibleLayers, addLayer, toggleLayer, updateLayerCount } = useMapLayers(mapRef.current)
  const { loadMapData, mapData, loading } = useMapData(updateLayerCount)
  const { handleMouseMove: handleHoverMove, handleMouseLeave: handleHoverLeave } = useMapHover(mapRef.current)
  const { 
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
  } = useMapTools(mapRef.current)

  // Cargar datos cuando cambie el viewState
  useEffect(() => {
    if (mapRef.current) {
      const bounds = mapRef.current.getBounds()
      loadMapData({
        bounds: [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth()
        ],
        zoom: Math.floor(viewState.zoom)
      })
    }
  }, [viewState, loadMapData])



  // Manejar carga del mapa
  const handleMapLoad = useCallback((event: any) => {
    const map = event.target
    mapRef.current = map
    if (onMapLoad) {
      onMapLoad(map)
    }
    
    // Configurar estilos y fuentes
    map.setStyle(currentMapStyle)
    
    // Agregar controles personalizados usando MapLibre directamente
    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.addControl(new maplibregl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true
    }), 'top-right')
    map.addControl(new maplibregl.FullscreenControl(), 'top-right')

    // Cargar datos iniciales después de que el mapa esté listo
    setTimeout(() => {
      const bounds = map.getBounds()
      loadMapData({
        bounds: [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth()
        ],
        zoom: Math.floor(viewState.zoom)
      })
    }, 100) // Pequeño delay para asegurar que el mapa esté completamente cargado
  }, [onMapLoad, currentMapStyle, loadMapData, viewState.zoom])

  // Manejar click en el mapa
  const handleMapClick = useCallback((event: any) => {
    console.log('Map clicked at:', event.lngLat)
    console.log('Features at click:', event.features)
    
    const features = event.features || []
    
    // Buscar la primera feature que sea de una capa interactiva
    const interactiveFeature = features.find((feature: any) => {
      const sourceId = feature.source
      console.log('Checking feature source:', sourceId)
      return sourceId === 'evidencias-source' || 
             sourceId === 'concesiones-source' || 
             sourceId === 'analisis-source'
    })
    
    if (interactiveFeature) {
      console.log('Interactive feature found:', interactiveFeature)
      setPopupInfo({
        longitude: event.lngLat.lng,
        latitude: event.lngLat.lat,
        feature: interactiveFeature
      })
    } else {
      console.log('No interactive feature found')
      setPopupInfo(null)
    }
  }, [])

  const handleMapStyleChange = useCallback((newStyleUrl: string) => {
    if (mapRef.current) {
      mapRef.current.setStyle(newStyleUrl)
      setCurrentMapStyle(newStyleUrl)
    }
  }, [])

  const handleLocationSelect = useCallback((coordinates: [number, number], bbox?: [number, number, number, number]) => {
    if (mapRef.current) {
      if (bbox) {
        // Si hay bbox, ajustar la vista para mostrar toda el área
        mapRef.current.fitBounds([
          [bbox[1], bbox[0]], // [lat, lng] para el suroeste
          [bbox[3], bbox[2]]  // [lat, lng] para el noreste
        ], { padding: 50 })
      } else {
        // Si solo hay coordenadas, centrar en el punto
        mapRef.current.flyTo({
          center: coordinates,
          zoom: 12,
          duration: 1000
        })
      }
    }
  }, [])

  // Manejar hover en el mapa
  const handleMapMouseMove = useCallback((event: any) => {
    handleHoverMove(event)
  }, [handleHoverMove])

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onLoad={handleMapLoad}
        onClick={handleMapClick}
        onMouseMove={handleMapMouseMove}
        onMouseLeave={handleHoverLeave}

        mapStyle={currentMapStyle}
        style={{ width: '100%', height: '100%' }}
        interactiveLayerIds={['evidencias-layer', 'concesiones-fill', 'concesiones-border', 'analisis-layer', 'analisis-border']}
      >
        {/* Fuentes de datos dinámicas */}
        
        {/* Análisis (capa base - se dibuja primero) */}
        {mapData.analisis && (
          <Source
            id="analisis-source"
            type="geojson"
            data={mapData.analisis}
          >
            <Layer
              id="analisis-layer"
              type="fill"
              paint={{
                'fill-color': MAP_CONFIG.layers.analisis.color,
                'fill-opacity': MAP_CONFIG.layers.analisis.fillOpacity
              }}
            />
            <Layer
              id="analisis-border"
              type="line"
              paint={{
                'line-color': MAP_CONFIG.layers.analisis.borderColor,
                'line-width': 1
              }}
            />
          </Source>
        )}

        {/* Concesiones (capa intermedia) */}
        {mapData.concesiones && (
          <Source
            id="concesiones-source"
            type="geojson"
            data={mapData.concesiones}
          >
            <Layer
              id="concesiones-fill"
              type="fill"
              paint={{
                'fill-color': [
                  'match',
                  ['get', 'tipo'],
                  'MOLUSCOS', MAP_CONFIG.layers.concesiones.tipos['MOLUSCOS'].color,
                  'SALMONES', MAP_CONFIG.layers.concesiones.tipos['SALMONES'].color,
                  'ABALONES o EQUINODERMOS', MAP_CONFIG.layers.concesiones.tipos['ABALONES o EQUINODERMOS'].color,
                  'ALGAS', MAP_CONFIG.layers.concesiones.tipos['ALGAS'].color,
                  MAP_CONFIG.layers.concesiones.color // Color por defecto
                ],
                'fill-opacity': [
                  'match',
                  ['get', 'tipo'],
                  'MOLUSCOS', MAP_CONFIG.layers.concesiones.tipos['MOLUSCOS'].fillOpacity,
                  'SALMONES', MAP_CONFIG.layers.concesiones.tipos['SALMONES'].fillOpacity,
                  'ABALONES o EQUINODERMOS', MAP_CONFIG.layers.concesiones.tipos['ABALONES o EQUINODERMOS'].fillOpacity,
                  'ALGAS', MAP_CONFIG.layers.concesiones.tipos['ALGAS'].fillOpacity,
                  MAP_CONFIG.layers.concesiones.fillOpacity // Opacidad por defecto
                ]
              }}
            />
            <Layer
              id="concesiones-border"
              type="line"
              paint={{
                'line-color': [
                  'match',
                  ['get', 'tipo'],
                  'MOLUSCOS', MAP_CONFIG.layers.concesiones.tipos['MOLUSCOS'].borderColor,
                  'SALMONES', MAP_CONFIG.layers.concesiones.tipos['SALMONES'].borderColor,
                  'ABALONES o EQUINODERMOS', MAP_CONFIG.layers.concesiones.tipos['ABALONES o EQUINODERMOS'].borderColor,
                  'ALGAS', MAP_CONFIG.layers.concesiones.tipos['ALGAS'].borderColor,
                  MAP_CONFIG.layers.concesiones.borderColor // Color por defecto
                ],
                'line-width': 1
              }}
            />
          </Source>
        )}

        {/* Evidencias (capa superior - se dibuja último) */}
        {mapData.evidencias && (
          <Source
            id="evidencias-source"
            type="geojson"
            data={mapData.evidencias}
          >
            <Layer
              id="evidencias-layer"
              type="circle"
              paint={{
                'circle-color': MAP_CONFIG.layers.evidencias.color,
                'circle-radius': 6,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#fff'
              }}
            />
          </Source>
        )}

        {/* Popup informativo */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            anchor="bottom"
            onClose={() => setPopupInfo(null)}
            closeOnClick={false}
            maxWidth="400px"
          >
            <MapPopup 
              popupInfo={popupInfo} 
              onClose={() => setPopupInfo(null)} 
            />
          </Popup>
        )}
      </Map>

      {/* Controles superpuestos */}
      <MapStyleControl 
        currentStyle={currentMapStyle}
        onStyleChange={handleMapStyleChange}
      />
      <LayerControl 
        layers={layers}
        visibleLayers={visibleLayers}
        onLayerToggle={toggleLayer}
      />
      <Toolbar 
        onMeasure={isMeasuring ? stopMeasuring : startMeasuring}
        onDraw={isDrawing ? stopDrawing : startDrawing}
        onExport={exportMap}
        onFilter={() => console.log('Filtrar')}
        onShare={() => console.log('Compartir')}
        onInfo={() => console.log('Información')}
        onClear={clearTools}
        activeTool={activeTool}
        isMeasuring={isMeasuring}
        isDrawing={isDrawing}
      />
      <Search 
        onSearch={(term: string) => console.log('Buscar:', term)}
        onFilter={(filters: any) => console.log('Filtrar:', filters)}
        onLocationSelect={handleLocationSelect}
      />
      <Legend layers={layers} />
      <MeasurementsPanel
        measurements={measurements}
        drawings={drawings}
        onRemoveMeasurement={removeMeasurement}
        onRemoveDrawing={removeDrawing}
      />
      
      {/* Indicador de carga */}
      {loading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg px-4 py-2 z-20">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Cargando datos...</span>
          </div>
        </div>
      )}
    </div>
  )
}

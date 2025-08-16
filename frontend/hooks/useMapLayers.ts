import { useState, useCallback, useEffect } from 'react'
import maplibregl from 'maplibre-gl'

interface Layer {
  id: string
  name: string
  visible: boolean
  type: 'evidencias' | 'concesiones' | 'analisis'
  color: string
  icon: string
  count?: number
}

export function useMapLayers(map: maplibregl.Map | null) {
  const [layers, setLayers] = useState<Layer[]>([
    {
      id: 'evidencias',
      name: 'Evidencias',
      visible: true,
      type: 'evidencias',
      color: '#4ECDC4',
      icon: '📍',
      count: 0
    },
    {
      id: 'concesiones',
      name: 'Concesiones',
      visible: true,
      type: 'concesiones',
      color: '#FFD93D',
      icon: '🏭',
      count: 0
    },
    {
      id: 'analisis',
      name: 'Análisis',
      visible: true,
      type: 'analisis',
      color: '#FF4444',
      icon: '📊',
      count: 0
    }
  ])

  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set(['evidencias', 'concesiones', 'analisis']))

  // Actualizar visibilidad de capas en el mapa
  const updateLayerVisibility = useCallback((layerId: string, visible: boolean) => {
    if (!map) return

    const layerIds = getLayerIds(layerId)
    
    layerIds.forEach(id => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none')
      }
    })
  }, [map])

  // Obtener IDs de capas relacionadas
  const getLayerIds = useCallback((layerId: string): string[] => {
    switch (layerId) {
      case 'evidencias':
        return ['evidencias-layer']
      case 'concesiones':
        return ['concesiones-fill', 'concesiones-border']
      case 'analisis':
        return ['analisis-layer', 'analisis-border']
      default:
        return [layerId]
    }
  }, [])

  // Alternar visibilidad de capa
  const toggleLayer = useCallback((layerId: string) => {
    setLayers(prev => 
      prev.map(layer => 
        layer.id === layerId 
          ? { ...layer, visible: !layer.visible }
          : layer
      )
    )

    setVisibleLayers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(layerId)) {
        newSet.delete(layerId)
        updateLayerVisibility(layerId, false)
      } else {
        newSet.add(layerId)
        updateLayerVisibility(layerId, true)
      }
      return newSet
    })
  }, [updateLayerVisibility])

  // Agregar nueva capa
  const addLayer = useCallback((layer: Layer) => {
    setLayers(prev => {
      const exists = prev.find(l => l.id === layer.id)
      if (exists) {
        return prev.map(l => l.id === layer.id ? layer : l)
      }
      return [...prev, layer]
    })

    if (layer.visible) {
      setVisibleLayers(prev => new Set([...prev, layer.id]))
    }
  }, [])

  // Remover capa
  const removeLayer = useCallback((layerId: string) => {
    setLayers(prev => prev.filter(layer => layer.id !== layerId))
    setVisibleLayers(prev => {
      const newSet = new Set(prev)
      newSet.delete(layerId)
      return newSet
    })
  }, [])

  // Actualizar conteo de elementos en capa
  const updateLayerCount = useCallback((layerId: string, count: number) => {
    setLayers(prev => 
      prev.map(layer => 
        layer.id === layerId 
          ? { ...layer, count }
          : layer
      )
    )
  }, [])

  // Obtener capa por ID
  const getLayer = useCallback((layerId: string) => {
    return layers.find(layer => layer.id === layerId)
  }, [layers])

  // Obtener capas visibles
  const getVisibleLayers = useCallback(() => {
    return layers.filter(layer => visibleLayers.has(layer.id))
  }, [layers, visibleLayers])

  // Obtener capas por tipo
  const getLayersByType = useCallback((type: string) => {
    return layers.filter(layer => layer.type === type)
  }, [layers])

  // Sincronizar visibilidad cuando cambie el mapa
  useEffect(() => {
    if (map) {
      layers.forEach(layer => {
        updateLayerVisibility(layer.id, layer.visible)
      })
    }
  }, [map, layers, updateLayerVisibility])

  return {
    layers,
    visibleLayers,
    toggleLayer,
    addLayer,
    removeLayer,
    updateLayerCount,
    getLayer,
    getVisibleLayers,
    getLayersByType
  }
}

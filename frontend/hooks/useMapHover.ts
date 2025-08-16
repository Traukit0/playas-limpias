import { useCallback } from 'react'
import maplibregl from 'maplibre-gl'

export function useMapHover(map: maplibregl.Map | null) {
  const handleMouseMove = useCallback((event: any) => {
    if (!map) return

    const features = map.queryRenderedFeatures(event.point)
    
    // Buscar features interactivas
    const interactiveFeature = features.find((feature: any) => {
      const sourceId = feature.source
      return sourceId === 'evidencias-source' || 
             sourceId === 'concesiones-source' || 
             sourceId === 'analisis-source'
    })

    // Solo cambiar el cursor, no aplicar efectos de hover complejos
    if (interactiveFeature) {
      map.getCanvas().style.cursor = 'pointer'
    } else {
      map.getCanvas().style.cursor = ''
    }
  }, [map])

  const handleMouseLeave = useCallback(() => {
    if (map) {
      map.getCanvas().style.cursor = ''
    }
  }, [map])

  return {
    handleMouseMove,
    handleMouseLeave
  }
}

import { useState, useCallback } from 'react'
import { API_URL } from '@/lib/api-config'

interface MapBounds {
  bounds: [number, number, number, number] // [west, south, east, north]
  zoom: number
}

interface MapData {
  denuncias?: any
  evidencias?: any
  concesiones?: any
  analisis?: any
}

interface MapDataState {
  mapData: MapData
  loading: boolean
  error: string | null
}

export function useMapData() {
  const [state, setState] = useState<MapDataState>({
    mapData: {},
    loading: false,
    error: null
  })

  const loadMapData = useCallback(async (params: MapBounds) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const { bounds, zoom } = params
      const boundsStr = bounds.join(',')
      
      // Cargar datos en paralelo
      const [denunciasRes, evidenciasRes, concesionesRes, analisisRes] = await Promise.allSettled([
        fetch(`${API_URL}/map/denuncias?bounds=${boundsStr}&zoom=${zoom}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }),
        fetch(`${API_URL}/map/evidencias?bounds=${boundsStr}&zoom=${zoom}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }),
        fetch(`${API_URL}/map/concesiones?bounds=${boundsStr}&zoom=${zoom}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }),
        fetch(`${API_URL}/map/analisis?bounds=${boundsStr}&zoom=${zoom}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        })
      ])

      const newMapData: MapData = {}

      // Procesar respuestas
      if (denunciasRes.status === 'fulfilled' && denunciasRes.value.ok) {
        newMapData.denuncias = await denunciasRes.value.json()
      }

      if (evidenciasRes.status === 'fulfilled' && evidenciasRes.value.ok) {
        newMapData.evidencias = await evidenciasRes.value.json()
      }

      if (concesionesRes.status === 'fulfilled' && concesionesRes.value.ok) {
        newMapData.concesiones = await concesionesRes.value.json()
      }

      if (analisisRes.status === 'fulfilled' && analisisRes.value.ok) {
        newMapData.analisis = await analisisRes.value.json()
      }

      setState({
        mapData: newMapData,
        loading: false,
        error: null
      })

    } catch (error) {
      console.error('Error loading map data:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Error al cargar los datos del mapa'
      }))
    }
  }, [])

  const refreshMapData = useCallback((params: MapBounds) => {
    loadMapData(params)
  }, [loadMapData])

  const clearMapData = useCallback(() => {
    setState({
      mapData: {},
      loading: false,
      error: null
    })
  }, [])

  return {
    ...state,
    loadMapData,
    refreshMapData,
    clearMapData
  }
}

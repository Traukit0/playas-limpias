import { useState, useCallback, useRef } from 'react'
import { API_URL } from '@/lib/api-config'
import { useAuth } from './use-auth'

interface MapBounds {
  bounds: [number, number, number, number] // [west, south, east, north]
  zoom: number
}

interface MapData {
  evidencias?: any
  concesiones?: any
  analisis?: any
}

interface MapDataState {
  mapData: MapData
  loading: boolean
  error: string | null
}

export function useMapData(onLayerCountUpdate?: (layerId: string, count: number) => void) {
  const { token } = useAuth()
  const [state, setState] = useState<MapDataState>({
    mapData: {},
    loading: false,
    error: null
  })
  
  // Cache simple para evitar llamadas duplicadas
  const cache = useRef<Map<string, { data: MapData; timestamp: number }>>(new Map())
  const CACHE_DURATION = 30000 // 30 segundos

  const loadMapData = useCallback(async (params: MapBounds) => {
    const { bounds, zoom } = params
    const boundsStr = bounds.join(',')
    const cacheKey = `${boundsStr}_${zoom}`
    
    // Verificar caché
    const cached = cache.current.get(cacheKey)
    const now = Date.now()
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('Usando datos en caché para:', cacheKey)
      setState({
        mapData: cached.data,
        loading: false,
        error: null
      })
      return
    }
    
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Verificar token de autenticación
      console.log('Token de autenticación:', token ? 'Presente' : 'Ausente')
      console.log('Cargando datos para bounds:', boundsStr, 'zoom:', zoom)
      
      if (!token) {
        console.error('No hay token de autenticación')
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'No hay token de autenticación'
        }))
        return
      }
      
      // Cargar datos en paralelo
      const [evidenciasRes, concesionesRes, analisisRes] = await Promise.allSettled([
        fetch(`${API_URL}/map/evidencias?bounds=${boundsStr}&zoom=${zoom}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch(`${API_URL}/map/concesiones?bounds=${boundsStr}&zoom=${zoom}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch(`${API_URL}/map/analisis?bounds=${boundsStr}&zoom=${zoom}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ])

      const newMapData: MapData = {}

      // Procesar respuestas
      if (evidenciasRes.status === 'fulfilled' && evidenciasRes.value.ok) {
        const evidenciasData = await evidenciasRes.value.json()
        newMapData.evidencias = evidenciasData
        const evidenciasCount = evidenciasData.features?.length || 0
        console.log('Evidencias cargadas:', evidenciasCount, 'features')
        onLayerCountUpdate?.('evidencias', evidenciasCount)
      } else {
        console.error('Error cargando evidencias:', evidenciasRes)
        onLayerCountUpdate?.('evidencias', 0)
      }

      if (concesionesRes.status === 'fulfilled' && concesionesRes.value.ok) {
        const concesionesData = await concesionesRes.value.json()
        newMapData.concesiones = concesionesData
        const concesionesCount = concesionesData.features?.length || 0
        console.log('Concesiones cargadas:', concesionesCount, 'features')
        onLayerCountUpdate?.('concesiones', concesionesCount)
      } else {
        console.error('Error cargando concesiones:', concesionesRes)
        onLayerCountUpdate?.('concesiones', 0)
      }

      if (analisisRes.status === 'fulfilled' && analisisRes.value.ok) {
        const analisisData = await analisisRes.value.json()
        newMapData.analisis = analisisData
        const analisisCount = analisisData.features?.length || 0
        console.log('Análisis cargados:', analisisCount, 'features')
        onLayerCountUpdate?.('analisis', analisisCount)
      } else {
        console.error('Error cargando análisis:', analisisRes)
        onLayerCountUpdate?.('analisis', 0)
      }

      // Guardar en caché
      cache.current.set(cacheKey, {
        data: newMapData,
        timestamp: now
      })
      
      // Limpiar caché antiguo (mantener solo los últimos 50 items)
      if (cache.current.size > 50) {
        const entries = Array.from(cache.current.entries())
        entries.sort((a, b) => b[1].timestamp - a[1].timestamp)
        const newCache = new Map(entries.slice(0, 50))
        cache.current = newCache
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
  }, [token])

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

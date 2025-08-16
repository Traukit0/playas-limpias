import { useState, useCallback } from 'react'
import { API_URL } from '@/lib/api-config'
import { useAuth } from './use-auth'

interface SearchResult {
  query: string
  analisis?: any[]
  denuncias: any[]
  concesiones: any[]
  reincidencias: any[]
  total_analisis?: number
  total_denuncias: number
  total_concesiones: number
  total_reincidencias: number
}

interface SearchState {
  results: SearchResult | null
  loading: boolean
  error: string | null
}

export function useSearch() {
  const { token } = useAuth()
  const [state, setState] = useState<SearchState>({
    results: null,
    loading: false,
    error: null
  })

  const search = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setState(prev => ({ ...prev, results: null, error: null }))
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await fetch(`${API_URL}/search/search?q=${encodeURIComponent(query.trim())}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`Error en búsqueda: ${response.status}`)
      }

      const results = await response.json()
      setState(prev => ({
        ...prev,
        results,
        loading: false,
        error: null
      }))

      console.log('Resultados de búsqueda:', results)
    } catch (error) {
      console.error('Error en búsqueda:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Error al realizar la búsqueda'
      }))
    }
  }, [token])

  const clearResults = useCallback(() => {
    setState({
      results: null,
      loading: false,
      error: null
    })
  }, [])

  return {
    ...state,
    search,
    clearResults
  }
}

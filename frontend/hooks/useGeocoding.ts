import { useState, useCallback } from 'react'

interface GeocodingResult {
  id: string
  name: string
  type: string
  coordinates: [number, number]
  bbox?: [number, number, number, number]
  properties?: {
    country?: string
    state?: string
    city?: string
    postcode?: string
  }
}

interface GeocodingOptions {
  limit?: number
  language?: string
  country?: string
  bbox?: [number, number, number, number]
}

export function useGeocoding() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<GeocodingResult[]>([])

  // Función para geocodificar una dirección
  const geocode = useCallback(async (query: string, options: GeocodingOptions = {}) => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Usar Nominatim (OpenStreetMap) para geocodificación gratuita
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        limit: (options.limit || 10).toString(),
        addressdetails: '1',
        countrycodes: options.country || 'cl', // Chile por defecto
        language: options.language || 'es'
      })

      if (options.bbox) {
        params.append('viewbox', options.bbox.join(','))
        params.append('bounded', '1')
      }

      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PlayasLimpias/1.0'
        }
      })

      if (!response.ok) {
        throw new Error('Error en la búsqueda geográfica')
      }

      const data = await response.json()

      const formattedResults: GeocodingResult[] = data.map((item: any, index: number) => ({
        id: `${item.place_id}_${index}`,
        name: item.display_name,
        type: item.type,
        coordinates: [parseFloat(item.lon), parseFloat(item.lat)],
        bbox: item.boundingbox ? [
          parseFloat(item.boundingbox[0]),
          parseFloat(item.boundingbox[1]),
          parseFloat(item.boundingbox[2]),
          parseFloat(item.boundingbox[3])
        ] : undefined,
        properties: {
          country: item.address?.country,
          state: item.address?.state,
          city: item.address?.city || item.address?.town,
          postcode: item.address?.postcode
        }
      }))

      setResults(formattedResults)
    } catch (err) {
      console.error('Error en geocodificación:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Función para geocodificación inversa (coordenadas a dirección)
  const reverseGeocode = useCallback(async (lat: number, lon: number) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&language=es`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'PlayasLimpias/1.0'
          }
        }
      )

      if (!response.ok) {
        throw new Error('Error en geocodificación inversa')
      }

      const data = await response.json()

      return {
        name: data.display_name,
        type: data.type,
        coordinates: [parseFloat(data.lon), parseFloat(data.lat)],
        properties: {
          country: data.address?.country,
          state: data.address?.state,
          city: data.address?.city || data.address?.town,
          postcode: data.address?.postcode
        }
      }
    } catch (err) {
      console.error('Error en geocodificación inversa:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Función para buscar lugares específicos en Chile
  const searchChilePlaces = useCallback(async (query: string) => {
    const chileOptions: GeocodingOptions = {
      limit: 15,
      country: 'cl',
      language: 'es',
      bbox: [-75.0, -56.0, -66.0, -17.0] // Bounding box aproximado de Chile
    }

    return await geocode(query, chileOptions)
  }, [geocode])

  // Función para buscar en la región de Los Lagos
  const searchLosLagosPlaces = useCallback(async (query: string) => {
    const losLagosOptions: GeocodingOptions = {
      limit: 10,
      country: 'cl',
      language: 'es',
      bbox: [-74.0, -43.0, -71.0, -40.0] // Bounding box aproximado de Los Lagos
    }

    return await geocode(query, losLagosOptions)
  }, [geocode])

  // Función para limpiar resultados
  const clearResults = useCallback(() => {
    setResults([])
    setError(null)
  }, [])

  return {
    loading,
    error,
    results,
    geocode,
    reverseGeocode,
    searchChilePlaces,
    searchLosLagosPlaces,
    clearResults
  }
}

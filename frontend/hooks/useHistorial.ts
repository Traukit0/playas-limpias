"use client"

import { useState, useEffect } from 'react'
import { useAuth } from './use-auth'

interface Denuncia {
  id_denuncia: number
  id_usuario: number
  id_estado: number
  fecha_inspeccion: string
  fecha_ingreso: string
  lugar: string | null
  observaciones: string | null
  estado?: string
  usuario?: {
    nombre: string
    email: string
  }
  total_evidencias?: number
  total_concesiones_afectadas?: number
}

interface HistorialData {
  denuncias: Denuncia[]
  loading: boolean
  error: string | null
  total: number
}

export function useHistorial(): HistorialData {
  const [denuncias, setDenuncias] = useState<Denuncia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { token } = useAuth()

  useEffect(() => {
    const fetchHistorial = async () => {
      if (!token) {
        setError('No hay token de autenticación')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const response = await fetch('http://localhost:8000/denuncias/historial', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        setDenuncias(data)
      } catch (err) {
        console.error('Error fetching historial:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchHistorial()
  }, [token])

  return {
    denuncias,
    loading,
    error,
    total: denuncias.length
  }
}

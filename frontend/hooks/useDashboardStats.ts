"use client"

import { useState, useEffect } from 'react'
import { useAuth } from './use-auth'

interface DashboardStats {
  total_denuncias: number
  denuncias_este_mes: number
  denuncias_pendientes: number
  denuncias_completadas: number
  ultimo_analisis: {
    id_analisis: number
    fecha_analisis: string
    lugar: string
    coordenadas: [number, number]
    concesiones_afectadas: number
  } | null
  actividad_mensual: Array<{
    mes: string
    total: number
  }>
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { token } = useAuth()

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) {
        setError('No hay token de autenticación')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const response = await fetch('http://localhost:8000/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        setStats(data)
      } catch (err) {
        console.error('Error fetching dashboard stats:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [token])

  return { stats, loading, error }
}

"use client"

import { useState, useEffect } from 'react'
import { useAuth } from './use-auth'

interface Reincidencia {
  titular: string
  centros_count: number
  denuncias_count: number
  centros_denunciados: string
  riesgo_level: 'alto' | 'medio' | 'bajo'
  ultima_denuncia?: string
  region?: string
  tipo_principal?: string
}

interface ReincidenciasData {
  reincidencias: Reincidencia[]
  loading: boolean
  error: string | null
  total: number
  estadisticas: {
    total_empresas: number
    total_centros: number
    total_denuncias: number
    promedio_denuncias_por_empresa: number
    empresas_alto_riesgo: number
    empresas_medio_riesgo: number
    empresas_bajo_riesgo: number
  }
}

export function useReincidencias(): ReincidenciasData {
  const [reincidencias, setReincidencias] = useState<Reincidencia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { token } = useAuth()

  useEffect(() => {
    const fetchReincidencias = async () => {
      if (!token) {
        setError('No hay token de autenticación')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const response = await fetch('http://localhost:8000/reincidencias/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        
        // El endpoint devuelve directamente la lista de reincidencias
        const reincidenciasData = Array.isArray(data) ? data : []
        
        // Procesar y enriquecer los datos con niveles de riesgo
        const reincidenciasProcesadas = reincidenciasData.map((item: any) => ({
          ...item,
          riesgo_level: calcularNivelRiesgo(item.denuncias_count, item.centros_count),
          ultima_denuncia: item.ultima_denuncia || null,
          region: item.region || 'No especificada',
          tipo_principal: item.tipo_principal || 'No especificado'
        }))

        setReincidencias(reincidenciasProcesadas)
      } catch (err) {
        console.error('Error fetching reincidencias:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchReincidencias()
  }, [token])

  // Calcular estadísticas
  const estadisticas = {
    total_empresas: reincidencias.length,
    total_centros: reincidencias.reduce((sum, item) => sum + item.centros_count, 0),
    total_denuncias: reincidencias.reduce((sum, item) => sum + item.denuncias_count, 0),
    promedio_denuncias_por_empresa: reincidencias.length > 0 
      ? Math.round((reincidencias.reduce((sum, item) => sum + item.denuncias_count, 0) / reincidencias.length) * 10) / 10
      : 0,
    empresas_alto_riesgo: reincidencias.filter(item => item.riesgo_level === 'alto').length,
    empresas_medio_riesgo: reincidencias.filter(item => item.riesgo_level === 'medio').length,
    empresas_bajo_riesgo: reincidencias.filter(item => item.riesgo_level === 'bajo').length,
  }

  return {
    reincidencias,
    loading,
    error,
    total: reincidencias.length,
    estadisticas
  }
}

// Función para calcular el nivel de riesgo basado en denuncias y centros
// Criterios de clasificación:
// - ALTO RIESGO: 5+ denuncias totales O ratio ≥2 (2+ denuncias por centro) O 4+ centros involucrados
// - MEDIO RIESGO: 3-4 denuncias totales O ratio ≥1 (1+ denuncias por centro) O 2-3 centros involucrados
// - BAJO RIESGO: 1-2 denuncias totales Y ratio <1 Y menos de 2 centros
function calcularNivelRiesgo(denunciasCount: number, centrosCount: number): 'alto' | 'medio' | 'bajo' {
  const ratio = denunciasCount / Math.max(centrosCount, 1)
  
  // Alto riesgo: muchas denuncias totales, alta densidad, o muchos centros involucrados
  if (denunciasCount >= 5 || ratio >= 2 || centrosCount >= 4) return 'alto'
  
  // Medio riesgo: denuncias moderadas, densidad moderada, o varios centros
  if (denunciasCount >= 3 || ratio >= 1 || centrosCount >= 2) return 'medio'
  
  // Bajo riesgo: pocas denuncias, baja densidad, y pocos centros
  return 'bajo'
}

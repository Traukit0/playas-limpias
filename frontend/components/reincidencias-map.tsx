"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, MapPin, Building2, FileText, Target, Shield, ZoomIn, ZoomOut } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface ReincidenciaMapProps {
  reincidencias: any[]
}

interface CentroCultivo {
  id_concesion: number
  nombre: string
  titular: string
  tipo: string
  region: string
  coordenadas: [number, number]
  denuncias_count: number
  riesgo_level: 'alto' | 'medio' | 'bajo'
}

export function ReincidenciasMap({ reincidencias }: ReincidenciaMapProps) {
  const [centrosCultivo, setCentrosCultivo] = useState<CentroCultivo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterRiesgo, setFilterRiesgo] = useState<string>("all")
  const [selectedEmpresa, setSelectedEmpresa] = useState<string | null>(null)
  const { token } = useAuth()

  useEffect(() => {
    const fetchCentrosCultivo = async () => {
      if (!token) return

      try {
        setLoading(true)
        const response = await fetch('http://localhost:8000/reincidencias/centros-cultivo', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        setCentrosCultivo(data.centros)
      } catch (err) {
        console.error('Error fetching centros de cultivo:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchCentrosCultivo()
  }, [token])

  const getRiesgoColor = (riesgo: string) => {
    switch (riesgo) {
      case 'alto': return 'text-red-600 bg-red-100 border-red-200'
      case 'medio': return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'bajo': return 'text-green-600 bg-green-100 border-green-200'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const getRiesgoIcon = (riesgo: string) => {
    switch (riesgo) {
      case 'alto': return <AlertTriangle className="h-4 w-4" />
      case 'medio': return <Target className="h-4 w-4" />
      case 'bajo': return <Shield className="h-4 w-4" />
      default: return <MapPin className="h-4 w-4" />
    }
  }

  const filteredCentros = centrosCultivo.filter(centro => {
    const matchesRiesgo = filterRiesgo === "all" || centro.riesgo_level === filterRiesgo
    const matchesEmpresa = !selectedEmpresa || centro.titular === selectedEmpresa
    return matchesRiesgo && matchesEmpresa
  })

  const empresasUnicas = Array.from(new Set(centrosCultivo.map(c => c.titular))).sort()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando mapa de reincidencias...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error al cargar el mapa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Mapa de Centros de Cultivo Reincidentes
        </CardTitle>
        <CardDescription>
          Visualización geográfica de centros de cultivo involucrados en denuncias
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Filtrar por riesgo:</span>
            <Select value={filterRiesgo} onValueChange={setFilterRiesgo}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los niveles</SelectItem>
                <SelectItem value="alto">Alto riesgo</SelectItem>
                <SelectItem value="medio">Medio riesgo</SelectItem>
                <SelectItem value="bajo">Bajo riesgo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Filtrar por empresa:</span>
            <Select value={selectedEmpresa || ""} onValueChange={(value) => setSelectedEmpresa(value === "" ? null : value)}>
              <SelectTrigger className="w-60">
                <SelectValue placeholder="Todas las empresas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las empresas</SelectItem>
                {empresasUnicas.map(empresa => (
                  <SelectItem key={empresa} value={empresa}>{empresa}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mapa simulado (placeholder) */}
        <div className="relative bg-gradient-to-br from-blue-50 to-green-50 border-2 border-dashed border-gray-300 rounded-lg h-96 mb-6">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Mapa Interactivo</p>
              <p className="text-gray-500 text-sm">Centros de cultivo: {filteredCentros.length}</p>
            </div>
          </div>
          
          {/* Puntos simulados en el mapa */}
          {filteredCentros.slice(0, 10).map((centro, index) => (
            <div
              key={centro.id_concesion}
              className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform"
              style={{
                left: `${20 + (index * 8)}%`,
                top: `${30 + (index * 6)}%`,
                backgroundColor: centro.riesgo_level === 'alto' ? '#ef4444' : 
                               centro.riesgo_level === 'medio' ? '#f59e0b' : '#10b981'
              }}
              title={`${centro.nombre} - ${centro.denuncias_count} denuncias`}
            />
          ))}
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-sm">Alto riesgo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <span className="text-sm">Medio riesgo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span className="text-sm">Bajo riesgo</span>
          </div>
        </div>

        {/* Lista de centros filtrados */}
        <div className="space-y-3">
          <h3 className="font-medium">Centros de Cultivo ({filteredCentros.length})</h3>
          <div className="grid gap-3 max-h-64 overflow-y-auto">
            {filteredCentros.map((centro) => (
              <div key={centro.id_concesion} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{centro.nombre}</div>
                    <div className="text-xs text-muted-foreground">{centro.titular}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getRiesgoColor(centro.riesgo_level)}>
                    <div className="flex items-center gap-1">
                      {getRiesgoIcon(centro.riesgo_level)}
                      {centro.riesgo_level.toUpperCase()}
                    </div>
                  </Badge>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3 text-red-600" />
                      <span className="font-bold text-red-600">{centro.denuncias_count}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{centro.region}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

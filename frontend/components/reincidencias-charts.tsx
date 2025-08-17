"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Target, Shield, TrendingUp, Building2, FileText } from "lucide-react"

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

interface ReincidenciasChartsProps {
  reincidencias: Reincidencia[]
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

export function ReincidenciasCharts({ reincidencias, estadisticas }: ReincidenciasChartsProps) {
  // Top 5 empresas con más denuncias
  const topEmpresas = reincidencias
    .sort((a, b) => b.denuncias_count - a.denuncias_count)
    .slice(0, 5)

  // Distribución por región
  const distribucionRegion = reincidencias.reduce((acc, item) => {
    const region = item.region || 'No especificada'
    acc[region] = (acc[region] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Distribución por tipo
  const distribucionTipo = reincidencias.reduce((acc, item) => {
    const tipo = item.tipo_principal || 'No especificado'
    acc[tipo] = (acc[tipo] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Calcular porcentajes para el gráfico de riesgo
  const total = estadisticas.empresas_alto_riesgo + estadisticas.empresas_medio_riesgo + estadisticas.empresas_bajo_riesgo
  const porcentajeAlto = total > 0 ? (estadisticas.empresas_alto_riesgo / total) * 100 : 0
  const porcentajeMedio = total > 0 ? (estadisticas.empresas_medio_riesgo / total) * 100 : 0
  const porcentajeBajo = total > 0 ? (estadisticas.empresas_bajo_riesgo / total) * 100 : 0

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Gráfico de distribución por riesgo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Distribución por Nivel de Riesgo
          </CardTitle>
          <CardDescription>
            Porcentaje de empresas por nivel de riesgo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Alto Riesgo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">Alto Riesgo</span>
                </div>
                <Badge variant="destructive">{estadisticas.empresas_alto_riesgo}</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${porcentajeAlto}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{porcentajeAlto.toFixed(1)}%</span>
            </div>

            {/* Medio Riesgo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">Medio Riesgo</span>
                </div>
                <Badge variant="secondary">{estadisticas.empresas_medio_riesgo}</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${porcentajeMedio}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{porcentajeMedio.toFixed(1)}%</span>
            </div>

            {/* Bajo Riesgo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Bajo Riesgo</span>
                </div>
                <Badge variant="outline">{estadisticas.empresas_bajo_riesgo}</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${porcentajeBajo}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{porcentajeBajo.toFixed(1)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top 5 empresas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Top 5 Empresas Reincidentes
          </CardTitle>
          <CardDescription>
            Empresas con mayor número de denuncias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topEmpresas.map((empresa, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{empresa.titular}</div>
                    <div className="text-xs text-muted-foreground">{empresa.region}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3 text-red-600" />
                    <span className="font-bold text-red-600">{empresa.denuncias_count}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {empresa.centros_count} centros
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Distribución por región */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-green-600" />
            Distribución por Región
          </CardTitle>
          <CardDescription>
            Número de empresas reincidentes por región
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(distribucionRegion)
              .sort(([,a], [,b]) => b - a)
              .map(([region, count]) => (
                <div key={region} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{region}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(count / estadisticas.total_empresas) * 100}%` }}
                      />
                    </div>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Distribución por tipo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            Distribución por Tipo
          </CardTitle>
          <CardDescription>
            Número de empresas por tipo de concesión
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(distribucionTipo)
              .sort(([,a], [,b]) => b - a)
              .map(([tipo, count]) => (
                <div key={tipo} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{tipo}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(count / estadisticas.total_empresas) * 100}%` }}
                      />
                    </div>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

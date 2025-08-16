"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react"

interface Denuncia {
  id_denuncia: number
  id_usuario: number
  id_estado: number
  fecha_inspeccion: string
  fecha_ingreso: string
  lugar: string | null
  observaciones: string | null
}

interface HistorialStatsProps {
  denuncias: Denuncia[]
}

export function HistorialStats({ denuncias }: HistorialStatsProps) {
  // Calcular estadísticas según los estados de la base de datos
  const total = denuncias.length
  const ingresadas = denuncias.filter(d => d.id_estado === 1).length
  const enProceso = denuncias.filter(d => d.id_estado === 2).length
  const terminadas = denuncias.filter(d => d.id_estado === 3).length

  // Calcular denuncias del último mes
  const unMesAtras = new Date()
  unMesAtras.setMonth(unMesAtras.getMonth() - 1)
  const denunciasUltimoMes = denuncias.filter(d => 
    new Date(d.fecha_ingreso) >= unMesAtras
  ).length

  const stats = [
    {
      title: "Total Denuncias",
      value: total,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Ingresadas",
      value: ingresadas,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    {
      title: "En Proceso",
      value: enProceso,
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "Terminadas",
      value: terminadas,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => {
        const IconComponent = stat.icon
        return (
          <Card key={stat.title} className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <IconComponent className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.title === "Total Denuncias" && (
                <p className="text-xs text-muted-foreground">
                  {denunciasUltimoMes} en el último mes
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

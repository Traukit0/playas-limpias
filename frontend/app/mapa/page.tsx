"use client"

import dynamic from "next/dynamic"
import { MapIcon, Download, Share2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// Importación dinámica para evitar problemas de SSR con MapLibre
const MapViewer = dynamic(() => import("@/components/map/MapViewer").then(mod => ({ default: mod.MapViewer })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Cargando visor cartográfico...</p>
      </div>
    </div>
  )
})

export default function MapaPage() {
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Visor Cartográfico
            </h1>
            <Badge variant="outline" className="flex items-center gap-1">
              <MapIcon className="h-3 w-3" />
              Playas Limpias
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Compartir
            </Button>
          </div>
        </div>
      </header>

      {/* Mapa Principal */}
      <div className="flex-1 relative">
        <MapViewer
          initialViewState={{
            longitude: -73.5,
            latitude: -42.5,
            zoom: 8
          }}
        />
      </div>
    </div>
  )
}
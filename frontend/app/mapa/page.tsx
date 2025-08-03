import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapFullView } from "@/components/map-full-view"

export const metadata: Metadata = {
  title: "Mapa de Inspecciones | Sistema de Inspecciones en Playas",
  description: "Visualización geográfica de las inspecciones realizadas",
}

export default function MapaPage() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-4 md:px-6">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Mapa de Inspecciones</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-4 md:p-6">
        <Card className="h-[calc(100vh-8rem)]">
          <CardHeader className="pb-2">
            <CardTitle>Visualización Geográfica</CardTitle>
            <CardDescription>Mapa interactivo con todas las inspecciones realizadas</CardDescription>
          </CardHeader>
          <CardContent className="h-[calc(100%-5rem)]">
            <MapFullView />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
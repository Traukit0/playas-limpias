import type { Metadata } from "next"
import Link from "next/link"
import { FileBarChart, Map, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Overview } from "@/components/overview"
import { RecentInspections } from "@/components/recent-inspections"
import { InspectionMap } from "@/components/inspection-map"

export const metadata: Metadata = {
  title: "Sistema de Inspecciones en Playas",
  description: "Panel de control para el sistema de inspecciones en playas",
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h1>
          </div>
          <Link href="/nueva-inspeccion">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Inspección
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 space-y-6 p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inspecciones</CardTitle>
              <FileBarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">127</div>
              <p className="text-xs text-muted-foreground">+5.2% respecto al mes anterior</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inspecciones este mes</CardTitle>
              <FileBarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23</div>
              <p className="text-xs text-muted-foreground">+12% respecto al mes anterior</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cumplimiento</CardTitle>
              <FileBarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87%</div>
              <p className="text-xs text-muted-foreground">+2.1% respecto al mes anterior</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Playas Inspeccionadas</CardTitle>
              <Map className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18</div>
              <p className="text-xs text-muted-foreground">+3 nuevas playas este mes</p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Inspecciones por Mes</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <Overview />
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Mapa de Inspecciones</CardTitle>
              <CardDescription>Vista general de las inspecciones recientes</CardDescription>
            </CardHeader>
            <CardContent>
              <InspectionMap />
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-1">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Inspecciones Recientes</CardTitle>
              <CardDescription>Últimas inspecciones realizadas en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentInspections />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

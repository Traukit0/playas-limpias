"use client"

import dynamic from "next/dynamic"

// Importación dinámica para evitar problemas de SSR con Leaflet
const InspectionWizard = dynamic(() => import("@/components/inspection-wizard").then(mod => ({ default: mod.InspectionWizard })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Cargando wizard de inspección...</p>
      </div>
    </div>
  )
})

export default function NuevaInspeccionPage() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-4 md:px-6">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Nueva Inspección</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-4 md:p-6">
        <InspectionWizard />
      </div>
    </div>
  )
}

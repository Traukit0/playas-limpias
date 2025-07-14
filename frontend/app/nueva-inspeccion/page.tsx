import type { Metadata } from "next"
import { InspectionWizard } from "@/components/inspection-wizard"

export const metadata: Metadata = {
  title: "Nueva Inspección | Sistema de Inspecciones en Playas",
  description: "Crear una nueva inspección de playa",
}

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

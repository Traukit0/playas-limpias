import type { Metadata } from "next"
import { RecentInspections } from "@/components/recent-inspections"
import { HistorialStats } from "@/components/historial-stats"

export const metadata: Metadata = {
  title: "Historial de Denuncias | Sistema de Inspecciones en Playas",
  description: "Historial completo de denuncias realizadas",
}

export default function HistorialPage() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-4 md:px-6">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Historial de Denuncias</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 space-y-6 p-4 md:p-6">
        <RecentInspections />
      </div>
    </div>
  )
}

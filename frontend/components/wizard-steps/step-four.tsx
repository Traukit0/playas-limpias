"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, ImageIcon, FileText, Play, CheckCircle } from "lucide-react"
import { AnalysisMap } from "@/components/analysis-map"
import type { InspectionData } from "@/components/inspection-wizard"

interface StepFourProps {
  data: InspectionData
  updateData: (data: Partial<InspectionData>) => void
  onNext: () => void
  onPrev: () => void
}

export function StepFour({ data, updateData, onNext, onPrev }: StepFourProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(data.analysisComplete)

  const handleAnalysis = () => {
    setIsAnalyzing(true)

    // Simular análisis
    setTimeout(() => {
      setIsAnalyzing(false)
      setAnalysisComplete(true)
      updateData({ analysisComplete: true })
    }, 3000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análisis de Datos</CardTitle>
        <CardDescription>Revise los datos ingresados y ejecute el análisis de la inspección</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumen de datos */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-primary" />
              <h4 className="font-medium">Información General</h4>
            </div>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Sector:</span> {data.sectorName}
              </p>
              <p>
                <span className="text-muted-foreground">Fecha:</span> {data.inspectionDate}
              </p>
              <p>
                <span className="text-muted-foreground">Inspector:</span> {data.inspector}
              </p>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h4 className="font-medium">Datos GPS</h4>
            </div>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Archivo:</span> {data.gpxFile?.name}
              </p>
              <p>
                <span className="text-muted-foreground">Waypoints:</span> {Math.floor(Math.random() * 50) + 10}
              </p>
              <Badge variant="outline" className="text-xs">
                GPX Válido
              </Badge>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              <h4 className="font-medium">Fotografías</h4>
            </div>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Total:</span> {data.photos.length} fotos
              </p>
              <p>
                <span className="text-muted-foreground">Tamaño:</span>{" "}
                {(data.photos.reduce((acc, photo) => acc + photo.size, 0) / 1024 / 1024).toFixed(1)} MB
              </p>
              <Badge variant="outline" className="text-xs">
                Listo para análisis
              </Badge>
            </div>
          </div>
        </div>

        {/* Mapa de análisis */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium">Mapa de Inspección</h4>
            {!analysisComplete && (
              <Button onClick={handleAnalysis} disabled={isAnalyzing}>
                {isAnalyzing ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Ejecutar Análisis
                  </>
                )}
              </Button>
            )}
            {analysisComplete && (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Análisis Completado
              </Badge>
            )}
          </div>

          <div className="rounded-lg border">
            <AnalysisMap
              sectorName={data.sectorName}
              waypoints={Math.floor(Math.random() * 50) + 10}
              photos={data.photos.length}
              isAnalyzing={isAnalyzing}
              analysisComplete={analysisComplete}
            />
          </div>
        </div>

        {/* Observaciones */}
        {data.observations && (
          <div className="rounded-lg border p-4">
            <h4 className="font-medium mb-2">Observaciones</h4>
            <p className="text-sm text-muted-foreground">{data.observations}</p>
          </div>
        )}

        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={onPrev}>
            Anterior
          </Button>
          <Button onClick={onNext} disabled={!analysisComplete}>
            Ver Resultados
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

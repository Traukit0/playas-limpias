"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Map, CheckCircle, AlertTriangle, Info } from "lucide-react"
import type { InspectionData } from "@/components/inspection-wizard"

interface StepFiveProps {
  data: InspectionData
  onPrev: () => void
}

export function StepFive({ data, onPrev }: StepFiveProps) {
  const handleDownloadPDF = () => {
    // Simular descarga de PDF
    const link = document.createElement("a")
    link.href = "#"
    link.download = `inspeccion_${data.sectorName.replace(/\s+/g, "_")}_${data.inspectionDate}.pdf`
    link.click()
  }

  const handleDownloadKMZ = () => {
    // Simular descarga de KMZ
    const link = document.createElement("a")
    link.href = "#"
    link.download = `inspeccion_${data.sectorName.replace(/\s+/g, "_")}_${data.inspectionDate}.kmz`
    link.click()
  }

  // Datos simulados del análisis
  const analysisResults = {
    totalArea: "2.3 km²",
    coveragePercentage: 87,
    anomaliesDetected: 3,
    qualityScore: 8.5,
    recommendations: [
      "Se recomienda inspección adicional en el sector norte",
      "Monitoreo continuo de la zona de erosión detectada",
      "Implementar medidas de protección en áreas vulnerables",
    ],
  }

  return (
    <div className="space-y-6">
      {/* Resultados del análisis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Análisis Completado
          </CardTitle>
          <CardDescription>Resultados de la inspección de {data.sectorName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Métricas principales */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold text-primary">{analysisResults.totalArea}</div>
              <div className="text-sm text-muted-foreground">Área Total</div>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{analysisResults.coveragePercentage}%</div>
              <div className="text-sm text-muted-foreground">Cobertura</div>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{analysisResults.anomaliesDetected}</div>
              <div className="text-sm text-muted-foreground">Anomalías</div>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{analysisResults.qualityScore}/10</div>
              <div className="text-sm text-muted-foreground">Calidad</div>
            </div>
          </div>

          {/* Resumen de datos procesados */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-muted p-4">
              <h4 className="font-medium mb-3">Datos Procesados</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Waypoints GPS:</span>
                  <span className="font-medium">{Math.floor(Math.random() * 50) + 10}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fotografías:</span>
                  <span className="font-medium">{data.photos.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha de análisis:</span>
                  <span className="font-medium">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Inspector:</span>
                  <span className="font-medium">{data.inspector}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <h4 className="font-medium mb-3">Estado del Análisis</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Procesamiento GPS completado</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Análisis fotográfico finalizado</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">3 anomalías detectadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Reporte generado exitosamente</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recomendaciones */}
          <div className="rounded-lg border p-4">
            <h4 className="font-medium mb-3">Recomendaciones</h4>
            <ul className="space-y-2">
              {analysisResults.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Descargas */}
      <Card>
        <CardHeader>
          <CardTitle>Archivos de Resultados</CardTitle>
          <CardDescription>Descargue los archivos generados del análisis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-red-600" />
                <div>
                  <p className="font-medium">Reporte de Inspección</p>
                  <p className="text-sm text-muted-foreground">Documento PDF completo</p>
                  <Badge variant="outline" className="mt-1 text-xs">
                    PDF • 2.3 MB
                  </Badge>
                </div>
              </div>
              <Button onClick={handleDownloadPDF}>
                <Download className="mr-2 h-4 w-4" />
                Descargar
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Map className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-medium">Datos Geoespaciales</p>
                  <p className="text-sm text-muted-foreground">Archivo KMZ para Google Earth</p>
                  <Badge variant="outline" className="mt-1 text-xs">
                    KMZ • 1.1 MB
                  </Badge>
                </div>
              </div>
              <Button onClick={handleDownloadKMZ}>
                <Download className="mr-2 h-4 w-4" />
                Descargar
              </Button>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <h4 className="font-medium mb-2">Información de los Archivos</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>• El archivo PDF contiene el reporte completo con análisis, fotografías y recomendaciones</p>
              <p>• El archivo KMZ incluye todos los waypoints GPS y puede visualizarse en Google Earth</p>
              <p>• Los archivos están disponibles por 30 días desde la fecha de generación</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones finales */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          Anterior
        </Button>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => (window.location.href = "/historial")}>
            Ver en Historial
          </Button>
          <Button onClick={() => (window.location.href = "/")}>Finalizar</Button>
        </div>
      </div>
    </div>
  )
}

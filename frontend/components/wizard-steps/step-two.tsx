"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, X, MapPin, FileText } from "lucide-react"
import type { InspectionData } from "@/components/inspection-wizard"

interface StepTwoProps {
  data: InspectionData
  updateData: (data: Partial<InspectionData>) => void
  onNext: () => void
  onPrev: () => void
}

export function StepTwo({ data, updateData, onNext, onPrev }: StepTwoProps) {
  const [file, setFile] = useState<File | null>(data.gpxFile)
  const [waypoints, setWaypoints] = useState<number>(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      updateData({ gpxFile: selectedFile })

      // Simular análisis del archivo GPX
      setTimeout(() => {
        setWaypoints(Math.floor(Math.random() * 50) + 10)
      }, 1000)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      setFile(droppedFile)
      updateData({ gpxFile: droppedFile })

      // Simular análisis del archivo GPX
      setTimeout(() => {
        setWaypoints(Math.floor(Math.random() * 50) + 10)
      }, 1000)
    }
  }

  const removeFile = () => {
    setFile(null)
    setWaypoints(0)
    updateData({ gpxFile: null })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Waypoints GPS</CardTitle>
        <CardDescription>Cargue el archivo GPX con los puntos de waypoints de la inspección</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!file ? (
          <div
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-12 text-center"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Arrastre y suelte su archivo GPX aquí</h3>
            <p className="text-sm text-muted-foreground mb-4">
              O haga clic para seleccionar un archivo desde su dispositivo
            </p>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              Seleccionar Archivo GPX
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".gpx" className="hidden" />
            <p className="text-xs text-muted-foreground mt-4">Formatos soportados: GPX (GPS Exchange Format)</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={removeFile}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {waypoints > 0 && (
              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h4 className="font-medium">Análisis del Archivo</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Waypoints detectados:</span>
                    <span className="ml-2 font-medium">{waypoints}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Estado:</span>
                    <span className="ml-2 font-medium text-green-600">Válido</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={onPrev}>
            Anterior
          </Button>
          <Button onClick={onNext} disabled={!file}>
            Siguiente
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

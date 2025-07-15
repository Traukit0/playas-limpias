"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, X, MapPin, FileText } from "lucide-react"
import type { InspectionData } from "@/components/inspection-wizard"

// TODO: Reemplazar por gestión de sesión/usuario en el futuro
const API_TOKEN = "testtoken123"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface StepTwoProps {
  data: InspectionData
  updateData: (data: Partial<InspectionData>) => void
  onNext: () => void
  onPrev: () => void
}

export function StepTwo({ data, updateData, onNext, onPrev }: StepTwoProps) {
  const [file, setFile] = useState<File | null>(data.gpxFile)
  const [waypoints, setWaypoints] = useState<number>(0)
  const [utcOffset, setUtcOffset] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      updateData({ gpxFile: selectedFile })
      setWaypoints(0)
      setUploaded(false)
      setSuccess(null)
      setError(null)
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
      setWaypoints(0)
      setUploaded(false)
      setSuccess(null)
      setError(null)
    }
  }

  const removeFile = () => {
    setFile(null)
    setWaypoints(0)
    setUploaded(false)
    setSuccess(null)
    setError(null)
    updateData({ gpxFile: null })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUpload = async () => {
    if (!file || utcOffset === null) return
    setUploading(true)
    setError(null)
    setSuccess(null)
    setUploaded(false)
    try {
      const formData = new FormData()
      formData.append("id_denuncia", String(data.id_denuncia))
      formData.append("utc_offset", String(utcOffset))
      formData.append("archivo_gpx", file)
      const uploadRes = await fetch(`${API_BASE_URL}/evidencias/upload_gpx`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_TOKEN}`
        },
        body: formData
      })
      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}))
        throw new Error(errData.detail || "Error al subir el archivo GPX")
      }
      setUploaded(true)
      setSuccess("Archivo GPX subido y procesado correctamente.")
    } catch (err: any) {
      setError(err.message || "Error inesperado")
    } finally {
      setUploading(false)
    }
  }

  const handleNext = async () => {
    if (!uploaded) return
    setLoading(true)
    setError(null)
    try {
      // Obtener evidencias asociadas a la denuncia
      const evidRes = await fetch(`${API_BASE_URL}/evidencias?id_denuncia=${data.id_denuncia}`, {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`
        }
      })
      if (!evidRes.ok) {
        throw new Error("Error al obtener evidencias")
      }
      const evidencias = await evidRes.json()
      const ids = evidencias.map((e: any) => e.id_evidencia)
      updateData({ id_evidencias: ids })
      setWaypoints(evidencias.length)
      onNext()
    } catch (err: any) {
      setError(err.message || "Error inesperado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Waypoints GPS</CardTitle>
        <CardDescription>Cargue el archivo GPX con los puntos de waypoints de la inspección</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-4">
          <label className="font-medium">Zona horaria (UTC offset):</label>
          <select
            className="border rounded px-3 py-2"
            value={utcOffset ?? ""}
            onChange={e => setUtcOffset(Number(e.target.value))}
          >
            <option value="" disabled>Seleccione un offset</option>
            <option value="-3">-3</option>
            <option value="-4">-4</option>
          </select>
        </div>
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
              <Button variant="ghost" size="icon" onClick={removeFile} disabled={uploading || loading}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={handleUpload}
              disabled={!file || utcOffset === null || uploading || uploaded}
              className="w-full"
            >
              {uploading ? "Subiendo..." : uploaded ? "Archivo Subido" : "Subir Archivo"}
            </Button>
            {uploaded && (
              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h4 className="font-medium">Archivo procesado</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Puede continuar al siguiente paso.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {success && <div className="text-green-600 text-sm">{success}</div>}
        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={onPrev} disabled={uploading || loading}>
            Anterior
          </Button>
          <Button onClick={handleNext} disabled={!uploaded || loading}>
            {loading ? "Procesando..." : "Siguiente"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

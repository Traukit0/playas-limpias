"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, X, Map } from "lucide-react"
import { Button } from "@/components/ui/button"

export function GpsTrackUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setPreview(true)
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
      setFile(e.dataTransfer.files[0])
      setPreview(true)
    }
  }

  const removeFile = () => {
    setFile(null)
    setPreview(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4">
      <div
        className="flex flex-col items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 p-6 text-center"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-medium">Arrastre y suelte archivo GPX, KML o KMZ</h3>
        <p className="mt-1 text-xs text-muted-foreground">O haga clic para seleccionar</p>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="mt-4" size="sm">
          Seleccionar Archivo
        </Button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".gpx,.kml,.kmz" className="hidden" />
      </div>

      {file && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Archivo cargado</h4>
            <Button variant="ghost" size="icon" onClick={removeFile} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="rounded-md border p-2">
            <div className="flex items-center gap-2">
              <Map className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">{file.name}</span>
            </div>
          </div>
          {preview && (
            <div className="mt-2 rounded-md border bg-muted p-2">
              <div className="h-[150px] w-full rounded bg-muted-foreground/10 flex items-center justify-center">
                <span className="text-xs text-muted-foreground">Vista previa del track</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

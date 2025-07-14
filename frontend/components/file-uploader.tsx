"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function FileUploader() {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...selectedFiles])

      // Generar previsualizaciones
      selectedFiles.forEach((file) => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader()
          reader.onload = (e) => {
            if (e.target?.result) {
              setPreviews((prev) => [...prev, e.target!.result as string])
            }
          }
          reader.readAsDataURL(file)
        }
      })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.dataTransfer.files) {
      const droppedFiles = Array.from(e.dataTransfer.files)
      setFiles((prev) => [...prev, ...droppedFiles])

      // Generar previsualizaciones
      droppedFiles.forEach((file) => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader()
          reader.onload = (e) => {
            if (e.target?.result) {
              setPreviews((prev) => [...prev, e.target!.result as string])
            }
          }
          reader.readAsDataURL(file)
        }
      })
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div
        className="flex flex-col items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 p-10 text-center"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Upload className="h-10 w-10 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-medium">Arrastre y suelte fotos aquí</h3>
        <p className="mt-1 text-xs text-muted-foreground">O haga clic para seleccionar archivos</p>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="mt-4">
          Seleccionar Archivos
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept="image/*"
          className="hidden"
        />
      </div>

      {previews.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Vista previa ({previews.length} archivos)</h4>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {previews.map((preview, index) => (
              <div key={index} className="group relative aspect-square overflow-hidden rounded-md border">
                <img
                  src={preview || "/placeholder.svg"}
                  alt={`Preview ${index}`}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => removeFile(index)}
                  className="absolute right-1 top-1 rounded-full bg-background/80 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

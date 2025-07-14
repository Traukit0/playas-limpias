"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, X, ImageIcon } from "lucide-react"
import type { InspectionData } from "@/components/inspection-wizard"

interface StepThreeProps {
  data: InspectionData
  updateData: (data: Partial<InspectionData>) => void
  onNext: () => void
  onPrev: () => void
}

export function StepThree({ data, updateData, onNext, onPrev }: StepThreeProps) {
  const [photos, setPhotos] = useState<File[]>(data.photos)
  const [previews, setPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      const newPhotos = [...photos, ...selectedFiles]
      setPhotos(newPhotos)
      updateData({ photos: newPhotos })

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
      const newPhotos = [...photos, ...droppedFiles]
      setPhotos(newPhotos)
      updateData({ photos: newPhotos })

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

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    const newPreviews = previews.filter((_, i) => i !== index)
    setPhotos(newPhotos)
    setPreviews(newPreviews)
    updateData({ photos: newPhotos })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fotografías de la Inspección</CardTitle>
        <CardDescription>Suba las fotografías tomadas durante la inspección</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <Upload className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium mb-2">Arrastre y suelte fotos aquí</h3>
          <p className="text-sm text-muted-foreground mb-4">O haga clic para seleccionar archivos</p>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <ImageIcon className="mr-2 h-4 w-4" />
            Seleccionar Fotos
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="image/*"
            className="hidden"
          />
          <p className="text-xs text-muted-foreground mt-3">Formatos soportados: JPG, PNG, HEIC, WebP</p>
        </div>

        {photos.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium">Fotos Cargadas ({photos.length})</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPhotos([])
                  setPreviews([])
                  updateData({ photos: [] })
                }}
              >
                Limpiar Todo
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {previews.map((preview, index) => (
                <div key={index} className="group relative aspect-square overflow-hidden rounded-lg border">
                  <img
                    src={preview || "/placeholder.svg"}
                    alt={`Foto ${index + 1}`}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute right-2 top-2 rounded-full bg-background/80 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 rounded bg-background/80 px-2 py-1 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100">
                    {photos[index]?.name.split(".")[0]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={onPrev}>
            Anterior
          </Button>
          <Button onClick={onNext} disabled={photos.length === 0}>
            Siguiente
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, X, ImageIcon } from "lucide-react"
import type { InspectionData } from "@/components/inspection-wizard"
import { API_TOKEN, API_BASE_URL } from "./step-one"

interface StepThreeProps {
  data: InspectionData
  updateData: (data: Partial<InspectionData>) => void
  onNext: () => void
  onPrev: () => void
}

export function StepThree({ data, updateData, onNext, onPrev }: StepThreeProps) {
  const [photos, setPhotos] = useState<File[]>(data.photos)
  const [previews, setPreviews] = useState<string[]>([])
  const [comments, setComments] = useState<string[]>(Array(data.photos.length).fill(""))
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Actualiza comentarios si cambia la cantidad de fotos
  React.useEffect(() => {
    setComments((prev) => {
      if (photos.length > prev.length) {
        return [...prev, ...Array(photos.length - prev.length).fill("")]
      } else if (photos.length < prev.length) {
        return prev.slice(0, photos.length)
      }
      return prev
    })
  }, [photos.length])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      const newPhotos = [...photos, ...selectedFiles].slice(0, data.id_evidencias?.length || Infinity)
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
      const newPhotos = [...photos, ...droppedFiles].slice(0, data.id_evidencias?.length || Infinity)
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
    const newComments = comments.filter((_, i) => i !== index)
    setPhotos(newPhotos)
    setPreviews(newPreviews)
    setComments(newComments)
    updateData({ photos: newPhotos })
  }

  const handleCommentChange = (index: number, value: string) => {
    setComments((prev) => prev.map((c, i) => (i === index ? value : c)))
  }

  const handleSubmit = async () => {
    setUploading(true)
    setError(null)
    setResult(null)
    try {
      if (!data.id_denuncia) throw new Error("Falta id_denuncia")
      if (!photos.length) throw new Error("Debe subir al menos una foto")
      if (photos.length > (data.id_evidencias?.length || 0)) throw new Error("No puede subir más fotos que puntos GPS")
      if (comments.some(c => !c.trim())) throw new Error("Debe ingresar un comentario para cada foto")
      const formData = new FormData()
      photos.forEach(photo => formData.append('archivos', photo))
      comments.forEach(comment => formData.append('descripciones', comment))
      const res = await fetch(`${API_BASE_URL}/evidencias/upload_fotos/${data.id_denuncia}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${API_TOKEN}` },
        body: formData
      })
      const resData = await res.json()
      setUploading(false)
      if (!res.ok) {
        setError(resData.detail || 'Error al subir fotos')
      } else {
        setResult(resData)
        // Avanzar automáticamente si no hay errores graves
        if (!resData.errores || resData.errores.length === 0) {
          onNext()
        }
      }
    } catch (err: any) {
      setUploading(false)
      setError(err.message || 'Error inesperado')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fotografías de la Inspección</CardTitle>
        <CardDescription>Suba las fotografías tomadas durante la inspección y agregue un comentario para cada una. Se asociarán automáticamente a los puntos GPS más cercanos en tiempo.</CardDescription>
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
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={photos.length >= (data.id_evidencias?.length || 0)}>
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
            disabled={photos.length >= (data.id_evidencias?.length || 0)}
          />
          <p className="text-xs text-muted-foreground mt-3">Formatos soportados: JPG, PNG, HEIC, WebP. Puede subir hasta {data.id_evidencias?.length || 0} fotos.</p>
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
                  setComments([])
                  updateData({ photos: [] })
                }}
              >
                Limpiar Todo
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {previews.map((preview, index) => (
                <div key={index} className="flex flex-col items-stretch bg-white rounded-xl border shadow-sm p-3 relative group transition-transform hover:scale-105">
                  <div className="relative w-full aspect-square overflow-hidden rounded-lg mb-2">
                    <img
                      src={preview || "/placeholder.svg"}
                      alt={`Foto ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute right-2 top-2 rounded-full bg-white/80 p-1 shadow hover:bg-red-100 transition-opacity opacity-0 group-hover:opacity-100"
                      title="Eliminar foto"
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                  <div className="text-xs text-center font-medium text-gray-700 mb-1 truncate">
                    {photos[index]?.name.split(".")[0]}
                  </div>
                  <textarea
                    className="resize-none rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring w-full min-h-[48px] bg-gray-50"
                    placeholder="Comentario..."
                    value={comments[index] || ""}
                    onChange={e => handleCommentChange(index, e.target.value)}
                    rows={2}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <div className="text-red-600 text-sm">{error}</div>}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded p-4 text-green-800 text-sm space-y-2">
            <div><b>Fotos procesadas:</b> {result.fotos_procesadas}</div>
            <div><b>Fotos asociadas:</b> {result.fotos_asociadas}</div>
            {result.errores && result.errores.length > 0 && (
              <div className="text-red-600"><b>Errores:</b> {result.errores.join(", ")}</div>
            )}
            {result.detalles && result.detalles.length > 0 && (
              <div>
                <b>Detalles:</b>
                <ul className="list-disc ml-6">
                  {result.detalles.map((d: any, i: number) => (
                    <li key={i}>
                      Archivo: {d.archivo}, Evidencia ID: {d.evidencia_id}, Timestamp: {d.timestamp_foto}, Ruta: {d.ruta}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={onPrev} disabled={uploading}>
            Anterior
          </Button>
          <Button onClick={handleSubmit} disabled={photos.length === 0 || comments.some(c => !c.trim()) || uploading}>
            {uploading ? "Subiendo..." : "Siguiente"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

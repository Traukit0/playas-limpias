"use client"

import React from "react"

import { useState, useRef } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, X, ImageIcon } from "lucide-react"
import type { InspectionData } from "@/components/inspection-wizard"
import { API_BASE_URL } from "./step-one"

interface StepThreeProps {
  data: InspectionData
  updateData: (data: Partial<InspectionData>) => void
  onNext: () => void
  onPrev: () => void
}

export function StepThree({ data, updateData, onNext, onPrev }: StepThreeProps) {
  const { token, isAuthenticated } = useAuth()
  
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
    const newComments = [...comments]
    newComments[index] = value
    setComments(newComments)
  }

  const handleSubmit = async () => {
    if (!isAuthenticated || !token) {
      setError("Debe iniciar sesión para continuar")
      return
    }
    
    if (photos.length === 0) {
      setError("Debe seleccionar al menos una foto")
      return
    }

    setUploading(true)
    setError(null)
    setResult(null)

    try {
      // Función para hacer fetch con mejor manejo de errores
      const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 10000) => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal
          })
          clearTimeout(timeoutId)
          return response
        } catch (error) {
          clearTimeout(timeoutId)
          throw error
        }
      }

      // Función para probar múltiples URLs de la API
      const tryApiUrls = async (endpoint: string, options: RequestInit) => {
        const urls = [
          'http://localhost:8000',
          'http://backend:8000',
          'http://host.docker.internal:8000'
        ]

        for (const baseUrl of urls) {
          try {
            console.log(`Probando URL para upload foto: ${baseUrl}${endpoint}`)
            const res = await fetchWithTimeout(`${baseUrl}${endpoint}`, options)

            if (res.ok) {
              console.log(`URL exitosa para upload foto: ${baseUrl}`)
              return res
            }
          } catch (error) {
            console.log(`URL falló para upload foto: ${baseUrl}`, error)
            continue
          }
        }

        throw new Error('No se pudo conectar a ninguna URL de la API')
      }

      // Preparar los datos para el endpoint correcto
      const formData = new FormData()
      
      // Agregar cada foto
      photos.forEach((photo) => {
        formData.append("archivos", photo)
      })
      
      // Agregar cada comentario como descripción
      comments.forEach((comment) => {
        formData.append("descripciones", comment || "")
      })

      const res = await tryApiUrls(`/evidencias/upload_fotos/${data.id_denuncia}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData,
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Error ${res.status}: ${res.statusText} - ${errorText}`)
      }

      const result = await res.json()
      setResult(result)
      onNext()
    } catch (e: any) {
      console.error('Error uploading photos:', e)
      if (e.name === 'AbortError') {
        setError("Timeout: El servidor no respondió en el tiempo esperado")
      } else if (e.message.includes('Failed to fetch')) {
        setError("Error de conectividad: No se puede conectar al servidor. Verifique que el backend esté ejecutándose.")
      } else {
        setError(e.message || "Error al subir las fotos")
      }
    } finally {
      setUploading(false)
    }
  }

  // Mostrar mensaje si no está autenticado
  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acceso Requerido</CardTitle>
          <CardDescription>Debe iniciar sesión para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Por favor, inicie sesión para continuar con la inspección.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subir Fotos</CardTitle>
        <CardDescription>
          Suba las fotos de la inspección con sus respectivos comentarios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              Arrastre y suelte las fotos aquí, o{" "}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-500"
              >
                seleccione archivos
              </button>
            </p>
            <p className="text-xs text-gray-500">
              Formatos soportados: JPG, PNG, GIF
            </p>
          </div>

          {photos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {photos.map((photo, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="relative">
                    <img
                      src={previews[index] || URL.createObjectURL(photo)}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-32 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Comentario para foto {index + 1}
                    </label>
                    <textarea
                      value={comments[index] || ""}
                      onChange={(e) => handleCommentChange(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Agregue un comentario para esta foto..."
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <ImageIcon className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800 font-medium">Error:</span>
              <span className="text-red-700 ml-2">{error}</span>
            </div>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <ImageIcon className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-800 font-medium">
                {result.length} foto(s) subida(s) exitosamente
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={onPrev} disabled={uploading}>
            Anterior
          </Button>
          <Button onClick={handleSubmit} disabled={photos.length === 0 || uploading}>
            {uploading ? "Subiendo..." : "Siguiente"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

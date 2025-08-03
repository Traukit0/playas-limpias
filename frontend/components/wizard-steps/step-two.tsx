"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, X, MapPin, FileText } from "lucide-react"
import type { InspectionData } from "@/components/inspection-wizard"
import { API_BASE_URL } from "./step-one"
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { LatLngBounds } from 'leaflet'
import L from 'leaflet'

// Configuración de iconos para Leaflet (asegura que los íconos se carguen desde /public)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/marker-icon-2x.png',
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
});

interface StepTwoProps {
  data: InspectionData
  updateData: (data: Partial<InspectionData>) => void
  onNext: () => void
  onPrev: () => void
}

export function StepTwo({ data, updateData, onNext, onPrev }: StepTwoProps) {
  const { token, isAuthenticated } = useAuth()
  
  const [file, setFile] = useState<File | null>(data.gpxFile)
  const [waypoints, setWaypoints] = useState<number>(0)
  const [utcOffset, setUtcOffset] = useState<number | null>(data.utcOffset || null)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [evidencias, setEvidencias] = useState<any[]>([])

  // Cargar evidencias cuando el componente se monta
  useEffect(() => {
    if (isAuthenticated && token && data.id_denuncia) {
      console.log('Componente montado, cargando evidencias existentes...')
      loadEvidencias()
    }
  }, [isAuthenticated, token, data.id_denuncia])

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
    if (!file || utcOffset === null || !isAuthenticated || !token) {
      setError("Debe iniciar sesión para continuar")
      return
    }
    
    setUploading(true)
    setError(null)
    setSuccess(null)
    setUploaded(false)
    try {
      const formData = new FormData()
      formData.append("id_denuncia", String(data.id_denuncia))
      formData.append("utc_offset", String(utcOffset))
      formData.append("archivo_gpx", file)

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
            console.log(`Probando URL para upload: ${baseUrl}${endpoint}`)
            const res = await fetchWithTimeout(`${baseUrl}${endpoint}`, options)

            if (res.ok) {
              console.log(`URL exitosa para upload: ${baseUrl}`)
              return res
            }
          } catch (error) {
            console.log(`URL falló para upload: ${baseUrl}`, error)
            continue
          }
        }

        throw new Error('No se pudo conectar a ninguna URL de la API')
      }

      const uploadRes = await tryApiUrls('/evidencias/upload_gpx', {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData,
      })

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text()
        throw new Error(`Error ${uploadRes.status}: ${uploadRes.statusText} - ${errorText}`)
      }

      const uploadData = await uploadRes.json()
      console.log('Upload exitoso - Respuesta completa:', uploadData)
      console.log('Upload exitoso - waypoints field:', uploadData.waypoints)
      console.log('Upload exitoso - tipo de waypoints:', typeof uploadData.waypoints)
      
      // Intentar obtener el número de waypoints de diferentes campos posibles
      const waypointsCount = uploadData.waypoints || uploadData.puntos || uploadData.count || 0
      console.log('Waypoints count calculado:', waypointsCount)
      
      setWaypoints(waypointsCount)
      setUploaded(true)
      setSuccess(`Archivo subido exitosamente. ${waypointsCount} waypoints procesados.`)
      
      // Cargar evidencias después del upload con un pequeño delay
      console.log('Esperando un momento para cargar evidencias...')
      setTimeout(async () => {
        console.log('Cargando evidencias después del upload...')
        await loadEvidencias()
      }, 1000)
    } catch (e: any) {
      console.error('Error uploading file:', e)
      if (e.name === 'AbortError') {
        setError("Timeout: El servidor no respondió en el tiempo esperado")
      } else if (e.message.includes('Failed to fetch')) {
        setError("Error de conectividad: No se puede conectar al servidor. Verifique que el backend esté ejecutándose.")
      } else {
        setError(e.message || "Error al subir el archivo")
      }
    } finally {
      setUploading(false)
    }
  }

  const loadEvidencias = async () => {
    if (!isAuthenticated || !token) {
      console.log('No autenticado o sin token, saltando carga de evidencias')
      return
    }
    
    console.log('Cargando evidencias para denuncia:', data.id_denuncia)
    
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
            console.log(`Probando URL para evidencias: ${baseUrl}${endpoint}`)
            const res = await fetchWithTimeout(`${baseUrl}${endpoint}`, options)

            if (res.ok) {
              console.log(`URL exitosa para evidencias: ${baseUrl}`)
              return res
            }
          } catch (error) {
            console.log(`URL falló para evidencias: ${baseUrl}`, error)
            continue
          }
        }

        throw new Error('No se pudo conectar a ninguna URL de la API')
      }

      const res = await tryApiUrls(`/evidencias/?id_denuncia=${data.id_denuncia}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`)
      }
      
      const evidenciasData = await res.json()
      console.log('Evidencias cargadas:', evidenciasData)
      setEvidencias(evidenciasData)
      
      // Actualizar el contador de waypoints basado en las evidencias cargadas
      if (evidenciasData.length > 0) {
        console.log('Actualizando waypoints count basado en evidencias:', evidenciasData.length)
        setWaypoints(evidenciasData.length)
        setSuccess(`Archivo subido exitosamente. ${evidenciasData.length} waypoints procesados.`)
      }
    } catch (error) {
      console.error('Error loading evidencias:', error)
      setEvidencias([])
    }
  }

  const handleNext = async () => {
    if (!isAuthenticated || !token) {
      setError("Debe iniciar sesión para continuar")
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      // Cargar evidencias antes de continuar
      await loadEvidencias()
      onNext()
    } catch (e: any) {
      console.error('Error in handleNext:', e)
      setError(e.message || "Error al continuar")
    } finally {
      setLoading(false)
    }
  }

  const getLatLngs = () : [number, number][] => {
    console.log('getLatLngs - Total evidencias:', evidencias.length)
    const filteredEvidencias = evidencias.filter((evidencia: any) => evidencia.coordenadas)
    console.log('getLatLngs - Evidencias con coordenadas:', filteredEvidencias.length)
    
    return filteredEvidencias.map((evidencia: any) => {
      const coords: [number, number] = [
        evidencia.coordenadas.coordinates[1],
        evidencia.coordenadas.coordinates[0]
      ]
      console.log('Coordenadas para evidencia', evidencia.id_evidencia, ':', coords)
      return coords
    })
  }

  function FitBounds({ points }: { points: [number, number][] }) {
    const map = useMap()
    if (points.length > 0) {
      const bounds = new LatLngBounds(points)
      map.fitBounds(bounds, { padding: [20, 20] })
    }
    return null
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
        <CardTitle>Waypoints GPS</CardTitle>
        <CardDescription>Cargue el archivo GPX con los puntos de waypoints de la inspección</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-4">
          <label className="font-medium">Zona horaria (UTC offset):</label>
          <select
            className="border rounded px-3 py-2"
            value={utcOffset ?? ""}
            onChange={e => {
              const value = Number(e.target.value)
              setUtcOffset(value)
              updateData({ utcOffset: value })
            }}
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
                     <span className="text-muted-foreground">Waypoints procesados: {waypoints}</span>
                   </div>
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
                 {evidencias.length > 0 && (
           <>
             <div className="font-semibold text-base mb-2">
               Previsualización de puntos cargados ({evidencias.length} puntos)
             </div>
            <div className="w-full h-[400px] my-4 rounded-lg overflow-hidden">
              <MapContainer
                style={{ width: "100%", height: "100%" }}
                center={getLatLngs()[0]}
                zoom={15}
                scrollWheelZoom={true}
                className="w-full h-full"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                <LayersControl position="topright">
                  <LayersControl.BaseLayer checked name="OpenStreetMap">
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; OpenStreetMap contributors"
                    />
                  </LayersControl.BaseLayer>
                  <LayersControl.BaseLayer name="Satélite (Esri)">
                    <TileLayer
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                      attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                    />
                  </LayersControl.BaseLayer>
                </LayersControl>
                <FitBounds points={getLatLngs()} />
                {getLatLngs().map((pos, idx) => (
                  <Marker key={idx} position={pos as [number, number]}>
                    <Popup>
                      Punto #{evidencias[idx].id_evidencia}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </>
        )}

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

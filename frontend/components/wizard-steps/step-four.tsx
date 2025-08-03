"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { MapPin, ImageIcon, FileText, Play, CheckCircle, User, AlertCircle, Info } from "lucide-react"
import { AnalysisMap } from "@/components/analysis-map"
import type { InspectionData } from "@/components/inspection-wizard"
import { API_BASE_URL } from "./step-one"
import { MapContainer, TileLayer, Marker, GeoJSON, Popup, useMap, Tooltip } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { useRef } from "react"
import L from "leaflet";

interface StepFourProps {
  data: InspectionData
  updateData: (data: Partial<InspectionData>) => void
  onNext: () => void
  onPrev: () => void
}

interface Usuario {
  id_usuario: number
  nombre: string
  email: string
}

interface EstadoDenuncia {
  id_estado: number
  estado: string
}

interface Evidencia {
  id_evidencia: number
  id_denuncia: number
  coordenadas: any
  fecha: string
  hora: string
  descripcion: string
  foto_url: string | null
}

interface Concesion {
  id_concesion: number
  titular: string
  tipo: string
  nombre: string
  region: string
  geom: any // GeoJSON
  codigo_centro: string
}

interface PreviewResponse {
  buffer_geom: any // GeoJSON
  resultados: {
    id_concesion: number
    interseccion_valida: boolean
    distancia_minima: number
  }[]
  distancia_buffer: number
}

// Componente auxiliar para ajustar el viewport del mapa
function FitBoundsToEvidencias({ evidencias }: { evidencias: Evidencia[] }) {
  const map = useMap()
  const hasFit = useRef(false)
  useEffect(() => {
    if (evidencias.length > 0) {
      const points = evidencias
        .map(ev =>
          ev.coordenadas && Array.isArray(ev.coordenadas.coordinates)
            ? [ev.coordenadas.coordinates[1], ev.coordenadas.coordinates[0]]
            : null
        )
        .filter(Boolean) as [number, number][]
      if (points.length > 0) {
        map.fitBounds(points, { padding: [40, 40] })
        hasFit.current = true
      }
    }
  }, [evidencias, map])
  return null
}

// Función para calcular el centroide de un polígono GeoJSON
function getPolygonCentroid(geojson: any): L.LatLng | null {
  const layer = L.geoJSON(geojson);
  let latlng: L.LatLng | null = null;
  layer.eachLayer(function (l: any) {
    if (l.getBounds) {
      latlng = l.getBounds().getCenter();
    }
  });
  return latlng;
}

function CustomPanes() {
  const map = useMap()
  useEffect(() => {
    // Crear paneles personalizados para el mapa
    const bufferPane = map.createPane('buffer')
    bufferPane.style.zIndex = '400'
    bufferPane.style.pointerEvents = 'none'
    
    const concesionPane = map.createPane('concesion')
    concesionPane.style.zIndex = '500'
    concesionPane.style.pointerEvents = 'auto'
  }, [map])
  return null
}

export function StepFour({ data, updateData, onNext, onPrev }: StepFourProps) {
  const { token, isAuthenticated } = useAuth()
  
  const [evidencias, setEvidencias] = useState<Evidencia[]>([])
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [estado, setEstado] = useState<EstadoDenuncia | null>(null)
  const [concesiones, setConcesiones] = useState<Concesion[]>([])
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null)
  const [bufferDistance, setBufferDistance] = useState<number>(100)
  const [loading, setLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysisExecuted, setAnalysisExecuted] = useState(false)

  useEffect(() => {
    if (isAuthenticated && token && data.id_denuncia) {
      cargarDatos()
    }
  }, [isAuthenticated, token, data.id_denuncia])

  const cargarDatos = async () => {
    if (!isAuthenticated || !token) return
    
    setLoading(true)
    setError(null)
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
            console.log(`Probando URL para datos: ${baseUrl}${endpoint}`)
            const res = await fetchWithTimeout(`${baseUrl}${endpoint}`, options)

            if (res.ok) {
              console.log(`URL exitosa para datos: ${baseUrl}`)
              return res
            }
          } catch (error) {
            console.log(`URL falló para datos: ${baseUrl}`, error)
            continue
          }
        }

        throw new Error('No se pudo conectar a ninguna URL de la API')
      }

      // Cargar evidencias
      const evidenciasRes = await tryApiUrls(`/evidencias/?id_denuncia=${data.id_denuncia}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (evidenciasRes.ok) {
        const evidenciasData = await evidenciasRes.json()
        setEvidencias(evidenciasData)
      }

      // Cargar usuario
      const usuarioRes = await tryApiUrls(`/usuarios/${data.id_usuario}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (usuarioRes.ok) {
        const usuarioData = await usuarioRes.json()
        setUsuario(usuarioData)
      }

      // Cargar estado
      const estadoRes = await tryApiUrls(`/estados_denuncia/${data.id_estado}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (estadoRes.ok) {
        const estadoData = await estadoRes.json()
        setEstado(estadoData)
      }

      // Cargar concesiones
      await cargarConcesiones()
    } catch (error) {
      console.error('Error cargando datos:', error)
      setError("Error al cargar los datos de la inspección")
    } finally {
      setLoading(false)
    }
  }

  const cargarConcesiones = async () => {
    if (!isAuthenticated || !token) return
    
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
            console.log(`Probando URL para concesiones: ${baseUrl}${endpoint}`)
            const res = await fetchWithTimeout(`${baseUrl}${endpoint}`, options)

            if (res.ok) {
              console.log(`URL exitosa para concesiones: ${baseUrl}`)
              return res
            }
          } catch (error) {
            console.log(`URL falló para concesiones: ${baseUrl}`, error)
            continue
          }
        }

        throw new Error('No se pudo conectar a ninguna URL de la API')
      }

      const concesionesRes = await tryApiUrls('/concesiones/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (concesionesRes.ok) {
        const concesionesData = await concesionesRes.json()
        setConcesiones(concesionesData)
      }
    } catch (error) {
      console.error('Error cargando concesiones:', error)
    }
  }

  const handlePreview = async () => {
    if (!isAuthenticated || !token) {
      setError("Debe iniciar sesión para continuar")
      return
    }
    
    setPreviewLoading(true)
    setError(null)
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
            console.log(`Probando URL para preview: ${baseUrl}${endpoint}`)
            const res = await fetchWithTimeout(`${baseUrl}${endpoint}`, options)

            if (res.ok) {
              console.log(`URL exitosa para preview: ${baseUrl}`)
              return res
            }
          } catch (error) {
            console.log(`URL falló para preview: ${baseUrl}`, error)
            continue
          }
        }

        throw new Error('No se pudo conectar a ninguna URL de la API')
      }

      const res = await tryApiUrls('/analisis/preview', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id_denuncia: data.id_denuncia,
          distancia_buffer: bufferDistance
        }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Error ${res.status}: ${res.statusText} - ${errorText}`)
      }

      const previewData = await res.json()
      setPreviewData(previewData)
    } catch (e: any) {
      console.error('Error en preview:', e)
      if (e.name === 'AbortError') {
        setError("Timeout: El servidor no respondió en el tiempo esperado")
      } else if (e.message.includes('Failed to fetch')) {
        setError("Error de conectividad: No se puede conectar al servidor. Verifique que el backend esté ejecutándose.")
      } else {
        setError(e.message || "Error al generar preview")
      }
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleAnalysisConfirmation = async () => {
    if (!isAuthenticated || !token) {
      setError("Debe iniciar sesión para continuar")
      return
    }
    
    setLoading(true)
    setError(null)
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
            console.log(`Probando URL para análisis: ${baseUrl}${endpoint}`)
            const res = await fetchWithTimeout(`${baseUrl}${endpoint}`, options)

            if (res.ok) {
              console.log(`URL exitosa para análisis: ${baseUrl}`)
              return res
            }
          } catch (error) {
            console.log(`URL falló para análisis: ${baseUrl}`, error)
            continue
          }
        }

        throw new Error('No se pudo conectar a ninguna URL de la API')
      }

      const res = await tryApiUrls('/analisis/ejecutar', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id_denuncia: data.id_denuncia,
          distancia_buffer: bufferDistance
        }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Error ${res.status}: ${res.statusText} - ${errorText}`)
      }

      const analysisResult = await res.json()
      setAnalysisExecuted(true)
      onNext()
    } catch (e: any) {
      console.error('Error en análisis:', e)
      if (e.name === 'AbortError') {
        setError("Timeout: El servidor no respondió en el tiempo esperado")
      } else if (e.message.includes('Failed to fetch')) {
        setError("Error de conectividad: No se puede conectar al servidor. Verifique que el backend esté ejecutándose.")
      } else {
        setError(e.message || "Error al ejecutar análisis")
      }
    } finally {
      setLoading(false)
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
        <CardTitle>Análisis de Concesiones</CardTitle>
        <CardDescription>
          Configure y ejecute el análisis de concesiones marítimas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumen de la inspección */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-lg">Resumen de la Inspección</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Inspector</p>
                <p className="font-medium">{usuario?.nombre || "Cargando..."}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Puntos GPS</p>
                <p className="font-medium">{evidencias.length} puntos</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Fotos</p>
                <p className="font-medium">{evidencias.filter(e => e.foto_url).length} fotos</p>
              </div>
            </div>
          </div>
          {estado && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">{estado.estado}</Badge>
            </div>
          )}
        </div>

        {/* Configuración del análisis */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Distancia del Buffer (metros)
            </label>
            <input
              type="number"
              value={bufferDistance}
              onChange={(e) => setBufferDistance(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="10"
              max="1000"
              step="10"
            />
            <p className="text-sm text-gray-500 mt-1">
              Radio alrededor de los puntos GPS para buscar concesiones
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handlePreview}
              disabled={previewLoading || loading}
              variant="outline"
            >
              {previewLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Generando Preview...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Generar Preview
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Mapa de análisis */}
        {evidencias.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Mapa de Análisis</h3>
            <div className="h-[400px] border rounded-lg overflow-hidden">
              <MapContainer
                style={{ height: "100%", width: "100%" }}
                center={[-42.8333, -73.2500]}
                zoom={10}
                scrollWheelZoom={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                <CustomPanes />
                <FitBoundsToEvidencias evidencias={evidencias} />
                
                {/* Evidencias */}
                {evidencias.map((evidencia) => {
                  if (!evidencia.coordenadas || !Array.isArray(evidencia.coordenadas.coordinates)) {
                    return null
                  }
                  const [lng, lat] = evidencia.coordenadas.coordinates
                  return (
                    <Marker key={evidencia.id_evidencia} position={[lat, lng]}>
                      <Popup>
                        <div className="text-sm">
                          <p><strong>Punto #{evidencia.id_evidencia}</strong></p>
                          <p>Fecha: {evidencia.fecha}</p>
                          <p>Hora: {evidencia.hora}</p>
                          {evidencia.descripcion && (
                            <p>Descripción: {evidencia.descripcion}</p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  )
                })}

                {/* Buffer del preview */}
                {previewData?.buffer_geom && (
                  <GeoJSON
                    data={previewData.buffer_geom}
                    style={{
                      color: "#3b82f6",
                      weight: 2,
                      fillColor: "#3b82f6",
                      fillOpacity: 0.2
                    }}
                    pane="buffer"
                  />
                )}

                {/* Concesiones */}
                {concesiones.map((concesion) => {
                  if (!concesion.geom) return null
                  
                  const centroid = getPolygonCentroid(concesion.geom)
                  if (!centroid) return null

                  const isIntersecting = previewData?.resultados?.some(
                    r => r.id_concesion === concesion.id_concesion && r.interseccion_valida
                  )

                  return (
                    <Marker key={concesion.id_concesion} position={centroid}>
                      <Popup>
                        <div className="text-sm">
                          <p><strong>{concesion.nombre}</strong></p>
                          <p>Titular: {concesion.titular}</p>
                          <p>Tipo: {concesion.tipo}</p>
                          <p>Región: {concesion.region}</p>
                          <p>Código: {concesion.codigo_centro}</p>
                          {isIntersecting && (
                            <p className="text-green-600 font-medium">
                              ✓ Intersección detectada
                            </p>
                          )}
                        </div>
                      </Popup>
                      <Tooltip>
                        {concesion.nombre} - {concesion.tipo}
                      </Tooltip>
                    </Marker>
                  )
                })}
              </MapContainer>
            </div>
          </div>
        )}

        {/* Resultados del preview */}
        {previewData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-blue-800">Resultados del Preview</h4>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-blue-700">
                <strong>Distancia del buffer:</strong> {previewData.distancia_buffer} metros
              </p>
              <p className="text-sm text-blue-700">
                <strong>Concesiones encontradas:</strong> {previewData.resultados.length}
              </p>
              <p className="text-sm text-blue-700">
                <strong>Concesiones con intersección:</strong>{" "}
                {previewData.resultados.filter(r => r.interseccion_valida).length}
              </p>
            </div>
          </div>
        )}

        {/* Errores */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800 font-medium">Error:</span>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Botones de navegación */}
        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={onPrev} disabled={loading}>
            Anterior
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                disabled={!previewData || loading || analysisExecuted}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Ejecutando Análisis...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Ejecutar Análisis
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Análisis</AlertDialogTitle>
                <AlertDialogDescription>
                  ¿Está seguro de que desea ejecutar el análisis con una distancia de buffer de {bufferDistance} metros?
                  Esta acción generará un reporte final y no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleAnalysisConfirmation}>
                  Ejecutar Análisis
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}

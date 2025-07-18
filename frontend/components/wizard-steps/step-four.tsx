"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { MapPin, ImageIcon, FileText, Play, CheckCircle, User, AlertCircle, Info } from "lucide-react"
import { AnalysisMap } from "@/components/analysis-map"
import type { InspectionData } from "@/components/inspection-wizard"
import { API_TOKEN, API_BASE_URL } from "./step-one"
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

// Componente auxiliar para crear panes personalizados
function CustomPanes() {
  const map = useMap();
  const panesCreated = useRef(false);
  React.useEffect(() => {
    if (!panesCreated.current) {
      if (!map.getPane('bufferPane')) {
        map.createPane('bufferPane');
        map.getPane('bufferPane')!.style.zIndex = '410';
      }
      if (!map.getPane('selectedPane')) {
        map.createPane('selectedPane');
        map.getPane('selectedPane')!.style.zIndex = '420';
      }
      panesCreated.current = true;
    }
  }, [map]);
  return null;
}

export function StepFour({ data, updateData, onNext, onPrev }: StepFourProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(data.analysisComplete)
  const [analysisExecuted, setAnalysisExecuted] = useState(false)
  
  // Estados para datos de usuario y estado
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [estado, setEstado] = useState<EstadoDenuncia | null>(null)
  const [evidencias, setEvidencias] = useState<Evidencia[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [errorData, setErrorData] = useState<string | null>(null)

  const [concesiones, setConcesiones] = useState<Concesion[]>([])
  const [loadingConcesiones, setLoadingConcesiones] = useState(true)
  const [errorConcesiones, setErrorConcesiones] = useState<string | null>(null)

  const [bufferInput, setBufferInput] = useState<number | undefined>(undefined)
  const [bufferPreview, setBufferPreview] = useState<number | undefined>(undefined)
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [errorPreview, setErrorPreview] = useState<string | null>(null)

  // Cargar datos de usuario, estado y evidencias cuando el componente se monta
  useEffect(() => {
    const cargarDatos = async () => {
      setLoadingData(true)
      setErrorData(null)
      
      try {
        // Cargar datos del usuario si existe id_usuario
        if (data.id_usuario) {
          const usuarioRes = await fetch(`${API_BASE_URL}/usuarios/?id_usuario=${data.id_usuario}`, {
            headers: { Authorization: `Bearer ${API_TOKEN}` }
          })
          
          if (usuarioRes.ok) {
            const usuarios = await usuarioRes.json()
            if (usuarios.length > 0) {
              setUsuario(usuarios[0])
            }
          } else {
            console.error('Error cargando usuario:', usuarioRes.status)
          }
        }

        // Cargar datos del estado si existe id_estado
        if (data.id_estado) {
          const estadoRes = await fetch(`${API_BASE_URL}/estados_denuncia/?id_estado=${data.id_estado}`, {
            headers: { Authorization: `Bearer ${API_TOKEN}` }
          })
          
          if (estadoRes.ok) {
            const estados = await estadoRes.json()
            if (estados.length > 0) {
              setEstado(estados[0])
            }
          } else {
            console.error('Error cargando estado:', estadoRes.status)
          }
        }

        // Cargar evidencias GPS si existe id_denuncia
        if (data.id_denuncia) {
          const evidenciasRes = await fetch(`${API_BASE_URL}/evidencias/?id_denuncia=${data.id_denuncia}`, {
            headers: { Authorization: `Bearer ${API_TOKEN}` }
          })
          
          if (evidenciasRes.ok) {
            const evidenciasData = await evidenciasRes.json()
            setEvidencias(evidenciasData)
          } else {
            console.error('Error cargando evidencias:', evidenciasRes.status)
          }
        }
      } catch (error) {
        console.error('Error al cargar datos:', error)
        setErrorData('Error al cargar información de la denuncia')
      } finally {
        setLoadingData(false)
      }
    }

    cargarDatos()
  }, [data.id_usuario, data.id_estado, data.id_denuncia])

  // Cargar concesiones al montar
  useEffect(() => {
    const cargarConcesiones = async () => {
      setLoadingConcesiones(true)
      setErrorConcesiones(null)
      try {
        const res = await fetch(`${API_BASE_URL}/concesiones`, {
          headers: { Authorization: `Bearer ${API_TOKEN}` }
        })
        if (!res.ok) throw new Error("Error al cargar concesiones")
        const data = await res.json()
        setConcesiones(data)
      } catch (err: any) {
        setErrorConcesiones(err.message || "Error inesperado")
      } finally {
        setLoadingConcesiones(false)
      }
    }
    cargarConcesiones()
  }, [])

  // Función para llamar a /analisis/preview
  const handlePreview = async () => {
    setLoadingPreview(true)
    setErrorPreview(null)
    try {
      const res = await fetch(`${API_BASE_URL}/analisis/preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify({
          id_denuncia: data.id_denuncia,
          distancia_buffer: bufferInput,
        }),
      })
      if (!res.ok) throw new Error("Error al obtener previsualización")
      const json = await res.json()
      setPreviewData({ ...json, distancia_buffer: bufferInput! })
      setBufferPreview(bufferInput)
    } catch (err: any) {
      setErrorPreview(err.message || "Error inesperado")
      setPreviewData(null)
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleAnalysisConfirmation = async () => {
    setIsAnalyzing(true)
    setAnalysisExecuted(true)

    try {
      // Ejecutar análisis real enviando datos a la base de datos
      const response = await fetch(`${API_BASE_URL}/analisis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify({
          id_denuncia: data.id_denuncia,
          distancia_buffer: bufferPreview || 0,
          metodo: "buffer_analysis",
          observaciones: data.observations || "Análisis automático generado desde la aplicación web"
        }),
      })

      if (!response.ok) {
        throw new Error(`Error en el análisis: ${response.status}`)
      }

      const analysisResult = await response.json()

      // Obtener información completa de las concesiones intersectadas
      const concesionesSeleccionadas = concesiones.filter(c => 
        analysisResult.resultados.some((r: any) => r.id_concesion === c.id_concesion)
      )

      // Guardar todos los resultados del análisis en los datos del wizard
      updateData({ 
        analysisResults: {
          id_analisis: analysisResult.id_analisis,
          fecha_analisis: analysisResult.fecha_analisis,
          buffer_distance: analysisResult.distancia_buffer,
          metodo: analysisResult.metodo,
          observaciones: analysisResult.observaciones,
          intersected_concessions: analysisResult.resultados,
          concessions_data: concesionesSeleccionadas,
          buffer_geom: analysisResult.buffer_geom
        }
      })

      setAnalysisComplete(true)
      updateData({ analysisComplete: true })

    } catch (error) {
      console.error('Error durante el análisis:', error)
      setErrorPreview(error instanceof Error ? error.message : 'Error inesperado durante el análisis')
      setIsAnalyzing(false)
      setAnalysisExecuted(false)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Calcular centro del mapa (usar primer evidencia si existe, si no fallback a [0,0])
  const centro: [number, number] =
    evidencias.length > 0 && evidencias[0].coordenadas && Array.isArray(evidencias[0].coordenadas.coordinates)
      ? [evidencias[0].coordenadas.coordinates[1], evidencias[0].coordenadas.coordinates[0]]
      : [-41.4689, -72.9411] // fallback: Puerto Montt

  // IDs de concesiones intersectadas
  const idsConcesionesIntersectadas = previewData?.resultados.map(r => r.id_concesion) || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análisis de Datos</CardTitle>
        <CardDescription>Revise los datos ingresados y ejecute el análisis de la inspección</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cartillas de información */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-primary" />
              <h4 className="font-medium">Información General</h4>
            </div>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Sector:</span> {data.sectorName}
              </p>
              <p>
                <span className="text-muted-foreground">Fecha:</span> {data.inspectionDate}
              </p>
              <p>
                <span className="text-muted-foreground">Inspector:</span>{" "}
                {loadingData ? (
                  <span className="text-muted-foreground">Cargando...</span>
                ) : usuario ? (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {usuario.nombre}
                  </span>
                ) : (
                  <span className="text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    No disponible
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">Estado:</span>
                {loadingData ? (
                  <span className="text-muted-foreground text-sm">Cargando...</span>
                ) : estado ? (
                  <Badge variant="outline" className="text-xs">
                    {estado.estado}
                  </Badge>
                ) : (
                  <span className="text-destructive flex items-center gap-1 text-sm">
                    <AlertCircle className="h-3 w-3" />
                    No disponible
                  </span>
                )}
              </div>
            </div>
            {errorData && (
              <div className="mt-2 text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errorData}
              </div>
            )}
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h4 className="font-medium">Datos GPS</h4>
            </div>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Archivo:</span> {data.gpxFile?.name}
              </p>
              <p>
                <span className="text-muted-foreground">Waypoints:</span>{" "}
                {loadingData ? (
                  <span className="text-muted-foreground">Cargando...</span>
                ) : evidencias.length > 0 ? (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {evidencias.length} puntos
                  </span>
                ) : (
                  <span className="text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    No disponible
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {loadingData ? "Verificando..." : evidencias.length > 0 ? "GPX Válido" : "Sin datos"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              <h4 className="font-medium">Fotografías</h4>
            </div>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Total:</span>{" "}
                {loadingData ? (
                  <span className="text-muted-foreground">Cargando...</span>
                ) : data.photos && data.photos.length > 0 ? (
                  <span className="flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" />
                    {data.photos.length} fotos
                  </span>
                ) : (
                  <span className="text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    No disponible
                  </span>
                )}
              </p>
              <p>
                <span className="text-muted-foreground">Tamaño:</span>{" "}
                {loadingData ? (
                  <span className="text-muted-foreground">Calculando...</span>
                ) : data.photos && data.photos.length > 0 ? (
                  <span>
                    {(data.photos.reduce((acc, photo) => acc + (photo.size || 0), 0) / 1024 / 1024).toFixed(1)} MB
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </p>
              <p>
                <span className="text-muted-foreground">Evidencias con fotos:</span>{" "}
                {loadingData ? (
                  <span className="text-muted-foreground">Verificando...</span>
                ) : evidencias.length > 0 ? (
                  <span>
                    {evidencias.filter(e => e.foto_url).length} de {evidencias.length}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {loadingData ? "Verificando..." : 
                   data.photos && data.photos.length > 0 ? "Listo para análisis" : 
                   "Sin fotografías"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Observaciones */}
        {data.observations && (
          <div className="rounded-lg border p-4">
            <h4 className="font-medium mb-2">Observaciones</h4>
            <p className="text-sm text-muted-foreground">{data.observations}</p>
          </div>
        )}

        {/* Input buffer */}
        <div className="flex items-center gap-2 mb-4">
          <label htmlFor="buffer-input" className="font-medium">Distancia de buffer (m):</label>
          <input
            id="buffer-input"
            type="number"
            min={100}
            max={5000}
            step={50}
            value={bufferInput === undefined ? '' : bufferInput}
            placeholder="Ej: 500"
            disabled={analysisExecuted}
            onChange={e => {
              const val = e.target.value === '' ? undefined : Number(e.target.value)
              setBufferInput(val)
            }}
            className="border rounded px-2 py-1 w-24 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <Button
            className="ml-2"
            onClick={handlePreview}
            disabled={
              loadingPreview ||
              bufferInput === undefined ||
              bufferInput < 100 ||
              bufferInput > 5000 ||
              !data.id_denuncia ||
              analysisExecuted
            }
          >
            {loadingPreview ? "Procesando..." : "Actualizar"}
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="default"
                className="ml-2"
                disabled={!previewData || analysisExecuted || isAnalyzing}
              >
                <Play className="h-4 w-4 mr-1" />
                {isAnalyzing ? "Analizando..." : "Ejecutar Análisis"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Análisis</AlertDialogTitle>
                <AlertDialogDescription>
                  ¿Está seguro de que desea ejecutar el análisis con una distancia de buffer de {bufferPreview}m? 
                  Esta acción procesará {idsConcesionesIntersectadas.length} concesiones intersectadas.
                  Una vez iniciado, no podrá modificar los parámetros.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleAnalysisConfirmation}>
                  Confirmar Análisis
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        {errorPreview && <div className="text-red-600 text-sm mb-2">{errorPreview}</div>}

        {/* Caja de instrucciones */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <h4 className="font-medium text-blue-900 mb-2">Instrucciones para el Análisis</h4>
              <ol className="list-decimal list-inside space-y-1 text-blue-800">
                <li>Ingrese la distancia de buffer deseada (entre 100 y 5000 metros)</li>
                <li>Presione "Actualizar" para ver la previsualización en el mapa</li>
                <li>Revise las concesiones intersectadas mostradas en rojo</li>
                <li>Cuando esté satisfecho con el buffer, presione "Ejecutar Análisis"</li>
                <li>Confirme la ejecución en el diálogo que aparecerá</li>
              </ol>
              {previewData && (
                <div className="mt-3 p-2 bg-blue-100 rounded">
                  <strong>Resumen actual:</strong> Buffer de {bufferPreview}m intersecta con {idsConcesionesIntersectadas.length} concesión(es)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mapa de análisis con react-leaflet */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium">Mapa de Inspección (Previsualización)</h4>
          <div className="rounded-lg border overflow-hidden">
            <MapContainer center={centro} zoom={15} style={{ height: 400, width: "100%" }}>
              <CustomPanes />
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <FitBoundsToEvidencias evidencias={evidencias} />
              {/* Evidencias */}
              {evidencias.map(ev =>
                ev.coordenadas && Array.isArray(ev.coordenadas.coordinates) ? (
                  <Marker
                    key={ev.id_evidencia}
                    position={[ev.coordenadas.coordinates[1], ev.coordenadas.coordinates[0]]}
                  >
                    <Popup>
                      Evidencia #{ev.id_evidencia}
                    </Popup>
                  </Marker>
                ) : null
              )}
              {/* Todas las concesiones (amarillo suave) */}
              {concesiones.map(c => (
                <GeoJSON
                  key={`all-${c.id_concesion}`}
                  data={c.geom}
                  style={{ color: "#FFD600", weight: 1, fillOpacity: 0.15 }}
                >
                  <Popup>
                    <div>
                      <div><b>Concesión:</b> {c.nombre}</div>
                      <div><b>Código Centro:</b> {c.codigo_centro}</div>
                      <div><b>Titular:</b> {c.titular}</div>
                      <div><b>Tipo:</b> {c.tipo}</div>
                      <div><b>Región:</b> {c.region}</div>
                    </div>
                  </Popup>
                </GeoJSON>
              ))}
              {/* Buffer (azul) en su propio pane */}
              {previewData?.buffer_geom && (
                <GeoJSON key={previewData.distancia_buffer} data={previewData.buffer_geom} style={{ color: "blue", weight: 2, fillOpacity: 0.2 }} pane="bufferPane" />
              )}
              {/* Concesiones seleccionadas (rojo) en su propio pane - SIEMPRE ENCIMA */}
              {previewData && concesiones.filter(c => idsConcesionesIntersectadas.includes(c.id_concesion)).map(c => {
                const centroide = getPolygonCentroid(c.geom);
                return (
                  <React.Fragment key={c.id_concesion}>
                    <GeoJSON
                      data={c.geom}
                      style={{ color: "red", weight: 2, fillOpacity: 0.3 }}
                      pane="selectedPane"
                    >
                      <Popup>
                        <div>
                          <div><b>Concesión:</b> {c.nombre}</div>
                          <div><b>Código Centro:</b> {c.codigo_centro}</div>
                          <div><b>Titular:</b> {c.titular}</div>
                          <div><b>Tipo:</b> {c.tipo}</div>
                          <div><b>Región:</b> {c.region}</div>
                        </div>
                      </Popup>
                    </GeoJSON>
                    {centroide && (
                      <Marker position={centroide} icon={L.divIcon({ className: 'invisible-marker' })}>
                        <Tooltip direction="center" permanent className="tooltip-centro">
                          <span>{c.codigo_centro}</span>
                        </Tooltip>
                      </Marker>
                    )}
                  </React.Fragment>
                );
              })}
            </MapContainer>
          </div>
        </div>

        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={onPrev}>
            Anterior
          </Button>
          <Button onClick={onNext} disabled={!analysisComplete}>
            {analysisComplete ? <CheckCircle className="h-4 w-4 mr-1" /> : null}
            Ver Resultados
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import React, { useState, useEffect, useRef } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, FileText, Map, CheckCircle, AlertTriangle, Info, MapPin, Calendar, User, Target, Eye, Loader2 } from "lucide-react"
import { MapContainer, TileLayer, Marker, GeoJSON, Popup, useMap, Tooltip } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import type { InspectionData } from "@/components/inspection-wizard"
import { API_BASE_URL } from "./step-one"

interface StepFiveProps {
  data: InspectionData
  onPrev: () => void
}

interface Usuario {
  id_usuario: number
  nombre: string
  email: string
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

// Componente auxiliar para ajustar el viewport del mapa
function FitBoundsToData({ analysisResults }: { analysisResults: any }) {
  const map = useMap()
  const hasFit = useRef(false)
  
  useEffect(() => {
    if (analysisResults?.buffer_geom && !hasFit.current) {
      try {
        const layer = L.geoJSON(analysisResults.buffer_geom)
        map.fitBounds(layer.getBounds(), { padding: [20, 20] })
        hasFit.current = true
      } catch (error) {
        console.error('Error ajustando bounds:', error)
      }
    }
  }, [analysisResults, map])
  
  return null
}

// Función para calcular el centroide de un polígono GeoJSON
function getPolygonCentroid(geojson: any): L.LatLng | null {
  try {
    const layer = L.geoJSON(geojson)
    let latlng: L.LatLng | null = null
    layer.eachLayer(function (l: any) {
      if (l.getBounds) {
        latlng = l.getBounds().getCenter()
      }
    })
    return latlng
  } catch (error) {
    console.error('Error calculando centroide:', error)
    return null
  }
}

// Componente auxiliar para crear panes personalizados
function CustomPanes() {
  const map = useMap()
  const panesCreated = useRef(false)
  
  React.useEffect(() => {
    if (!panesCreated.current) {
      if (!map.getPane('bufferPane')) {
        map.createPane('bufferPane')
        map.getPane('bufferPane')!.style.zIndex = '410'
      }
      if (!map.getPane('selectedPane')) {
        map.createPane('selectedPane')
        map.getPane('selectedPane')!.style.zIndex = '420'
      }
      panesCreated.current = true
    }
  }, [map])
  
  return null
}

export function StepFive({ data, onPrev }: StepFiveProps) {
  const { token, isAuthenticated } = useAuth()
  
  const [selectedConcession, setSelectedConcession] = useState<any>(null)
  
  // Estados para cargar datos adicionales
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [evidencias, setEvidencias] = useState<Evidencia[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [downloadingKMZ, setDownloadingKMZ] = useState(false)

  useEffect(() => {
    if (isAuthenticated && token) {
      cargarDatos()
    }
  }, [isAuthenticated, token])

  const cargarDatos = async () => {
    if (!isAuthenticated || !token) return
    
    setLoading(true)
    setError(null)
    try {
      // Cargar usuario
      const usuarioRes = await fetch(`${API_BASE_URL}/usuarios/${data.id_usuario}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (usuarioRes.ok) {
        const usuarioData = await usuarioRes.json()
        setUsuario(usuarioData)
      }

      // Cargar evidencias
      const evidenciasRes = await fetch(`${API_BASE_URL}/evidencias/?id_denuncia=${data.id_denuncia}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (evidenciasRes.ok) {
        const evidenciasData = await evidenciasRes.json()
        setEvidencias(evidenciasData)
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
      setError("Error al cargar los datos de la inspección")
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!isAuthenticated || !token) {
      setError("Debe iniciar sesión para continuar")
      return
    }
    
    setDownloadingPDF(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/analisis/generar_pdf/${data.id_denuncia}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Error ${res.status}: ${res.statusText} - ${errorText}`)
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inspeccion_${data.id_denuncia}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (e: any) {
      console.error('Error downloading PDF:', e)
      setError(e.message || "Error al descargar el PDF")
    } finally {
      setDownloadingPDF(false)
    }
  }

  const handleDownloadKMZ = async () => {
    if (!isAuthenticated || !token) {
      setError("Debe iniciar sesión para continuar")
      return
    }
    
    setDownloadingKMZ(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/analisis/generar_kmz/${data.id_denuncia}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Error ${res.status}: ${res.statusText} - ${errorText}`)
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inspeccion_${data.id_denuncia}.kmz`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (e: any) {
      console.error('Error downloading KMZ:', e)
      setError(e.message || "Error al descargar el KMZ")
    } finally {
      setDownloadingKMZ(false)
    }
  }

  const handleViewOnMap = (concession: any) => {
    setSelectedConcession(concession)
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
            Por favor, inicie sesión para ver los resultados de la inspección.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando resultados...</CardTitle>
          <CardDescription>Por favor espere mientras cargamos la información</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultados del Análisis</CardTitle>
        <CardDescription>
          Revise los resultados y descargue los reportes generados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumen de la inspección */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-600" />
            <span className="text-sm">
              <strong>Inspector:</strong> {usuario?.nombre}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-600" />
            <span className="text-sm">
              <strong>Puntos:</strong> {evidencias.length}
            </span>
          </div>
                     <div className="flex items-center gap-2">
             <Target className="h-4 w-4 text-gray-600" />
             <span className="text-sm">
               <strong>Buffer:</strong> 100m
             </span>
           </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-600">
              <strong>Análisis completado</strong>
            </span>
          </div>
        </div>

        {/* Botones de descarga */}
        <div className="flex gap-4">
          <Button
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
            className="flex-1"
          >
            {downloadingPDF ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Descargando PDF...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Descargar PDF
              </>
            )}
          </Button>
          
          <Button
            onClick={handleDownloadKMZ}
            disabled={downloadingKMZ}
            className="flex-1"
          >
            {downloadingKMZ ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Descargando KMZ...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Descargar KMZ
              </>
            )}
          </Button>
        </div>

        {/* Tabs para diferentes vistas */}
        <Tabs defaultValue="map" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="map">Mapa</TabsTrigger>
            <TabsTrigger value="details">Detalles</TabsTrigger>
          </TabsList>
          
          <TabsContent value="map" className="space-y-4">
            <div className="h-96 border border-gray-300 rounded-lg overflow-hidden">
              <MapContainer
                center={[-42.8333, -73.2500]}
                zoom={10}
                style={{ height: "100%", width: "100%" }}
              >
                <CustomPanes />
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {/* Evidencias */}
                {evidencias.map((evidencia) => (
                  <Marker
                    key={evidencia.id_evidencia}
                    position={[
                      evidencia.coordenadas.coordinates[1],
                      evidencia.coordenadas.coordinates[0]
                    ]}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p><strong>ID:</strong> {evidencia.id_evidencia}</p>
                        <p><strong>Fecha:</strong> {evidencia.fecha}</p>
                        <p><strong>Hora:</strong> {evidencia.hora}</p>
                        {evidencia.descripcion && (
                          <p><strong>Descripción:</strong> {evidencia.descripcion}</p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}

                                 {/* Buffer si existe */}
                 {/* Nota: Los datos del buffer se mostrarían aquí si estuvieran disponibles */}

                 <FitBoundsToData analysisResults={null} />
              </MapContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="details" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información de la Inspección</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sector:</label>
                  <p className="text-sm text-gray-600">{data.sectorName}</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha de Inspección:</label>
                  <p className="text-sm text-gray-600">{data.inspectionDate}</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Inspector:</label>
                  <p className="text-sm text-gray-600">{usuario?.nombre}</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Puntos GPS:</label>
                  <p className="text-sm text-gray-600">{evidencias.length}</p>
                </div>
              </div>

              {data.observations && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Observaciones:</label>
                  <p className="text-sm text-gray-600">{data.observations}</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {error && <div className="text-red-500">{error}</div>}

        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={onPrev}>
            Anterior
          </Button>
          <Button disabled>
            Finalizar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

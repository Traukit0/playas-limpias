"use client"

import React, { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, FileText, Map, CheckCircle, AlertTriangle, Info, MapPin, Calendar, User, Target, Eye } from "lucide-react"
import { MapContainer, TileLayer, Marker, GeoJSON, Popup, useMap, Tooltip } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import type { InspectionData } from "@/components/inspection-wizard"
import { API_TOKEN, API_BASE_URL } from "./step-one"

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
  const [selectedConcession, setSelectedConcession] = useState<any>(null)
  
  // Estados para cargar datos adicionales
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [evidencias, setEvidencias] = useState<Evidencia[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Datos del análisis
  const analysisResults = data.analysisResults
  const concesionesIntersectadas = analysisResults?.intersected_concessions || []
  const concesionesData = analysisResults?.concessions_data || []
  
  // Calcular métricas
  const puntosGPS = data.id_evidencias?.length || 0
  const titularesUnicos = [...new Set(concesionesData.map(c => c.titular))].length

  // Centro del mapa (fallback a Puerto Montt)
  const centro: [number, number] = [-41.4689, -72.9411]

  // Cargar datos de usuario y evidencias
  useEffect(() => {
    const cargarDatos = async () => {
      setLoadingData(true)
      
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
          }
        }
      } catch (error) {
        console.error('Error al cargar datos:', error)
      } finally {
        setLoadingData(false)
      }
    }

    cargarDatos()
  }, [data.id_usuario, data.id_denuncia])

  const handleDownloadPDF = () => {
    // TODO: Implementar descarga real de PDF
    console.log("Descargando PDF con ID análisis:", analysisResults?.id_analisis)
  }

  const handleDownloadKMZ = () => {
    // TODO: Implementar descarga real de KMZ
    console.log("Descargando KMZ con ID análisis:", analysisResults?.id_analisis)
  }

  const handleViewOnMap = (concession: any) => {
    setSelectedConcession(concession)
  }

  if (!analysisResults) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay resultados de análisis</h3>
            <p>Complete el análisis en el paso anterior para ver los resultados.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con información del análisis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Análisis Completado - ID #{analysisResults.id_analisis}
          </CardTitle>
          <CardDescription>
            Resultados de la inspección de {data.sectorName} - {data.inspectionDate}
          </CardDescription>
        </CardHeader>
      </Card>

             {/* Métricas principales */}
       <div className="grid gap-4 md:grid-cols-4">
         <Card>
           <CardContent className="p-6 text-center">
             <div className="text-3xl font-bold text-blue-600">{concesionesIntersectadas.length}</div>
             <div className="text-sm text-muted-foreground mt-1">Concesiones Intersectadas</div>
           </CardContent>
         </Card>
         
         <Card>
           <CardContent className="p-6 text-center">
             <div className="text-3xl font-bold text-green-600">{puntosGPS}</div>
             <div className="text-sm text-muted-foreground mt-1">Puntos GPS</div>
           </CardContent>
         </Card>
         
         <Card>
           <CardContent className="p-6 text-center">
             <div className="text-3xl font-bold text-orange-600">{analysisResults.buffer_distance}m</div>
             <div className="text-sm text-muted-foreground mt-1">Distancia Buffer</div>
           </CardContent>
         </Card>
         
         <Card>
           <CardContent className="p-6 text-center">
             <div className="text-3xl font-bold text-purple-600">{titularesUnicos}</div>
             <div className="text-sm text-muted-foreground mt-1">Titulares Afectados</div>
           </CardContent>
         </Card>
       </div>

      {/* Contenido principal con tabs */}
      <Tabs defaultValue="mapa" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mapa">Mapa de Resultados</TabsTrigger>
          <TabsTrigger value="concesiones">Concesiones Intersectadas</TabsTrigger>
          <TabsTrigger value="detalles">Detalles de Inspección</TabsTrigger>
        </TabsList>

        {/* Tab: Mapa de Resultados */}
        <TabsContent value="mapa">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5" />
                Mapa de Resultados del Análisis
              </CardTitle>
              <CardDescription>
                Visualización interactiva del buffer ({analysisResults.buffer_distance}m) y concesiones intersectadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <MapContainer center={centro} zoom={12} style={{ height: 500, width: "100%" }}>
                  <CustomPanes />
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <FitBoundsToData analysisResults={analysisResults} />
                  
                  {/* Evidencias GPS (puntos) */}
                  {evidencias.map(ev =>
                    ev.coordenadas && Array.isArray(ev.coordenadas.coordinates) ? (
                      <Marker
                        key={ev.id_evidencia}
                        position={[ev.coordenadas.coordinates[1], ev.coordenadas.coordinates[0]]}
                      >
                        <Popup>
                          <div>
                            <b>Evidencia #{ev.id_evidencia}</b><br/>
                            Fecha: {ev.fecha}<br/>
                            Hora: {ev.hora}<br/>
                            {ev.descripcion && <span>Descripción: {ev.descripcion}<br/></span>}
                            {ev.foto_url && <span>📷 Con fotografía</span>}
                          </div>
                        </Popup>
                      </Marker>
                    ) : null
                  )}
                  
                  {/* Buffer geometry */}
                  {analysisResults.buffer_geom && (
                    <GeoJSON 
                      data={analysisResults.buffer_geom} 
                      style={{ color: "blue", weight: 2, fillOpacity: 0.2 }} 
                      pane="bufferPane"
                    >
                      <Popup>
                        <div>
                          <b>Área de Buffer</b><br/>
                          Distancia: {analysisResults.buffer_distance}m<br/>
                          Método: {analysisResults.metodo}
                        </div>
                      </Popup>
                    </GeoJSON>
                  )}
                  
                  {/* Concesiones intersectadas */}
                  {concesionesData.map(concession => {
                    const centroide = getPolygonCentroid(concession.geom)
                    const resultado = concesionesIntersectadas.find(r => r.id_concesion === concession.id_concesion)
                    
                    return (
                      <React.Fragment key={concession.id_concesion}>
                        <GeoJSON
                          data={concession.geom}
                          style={{ 
                            color: resultado?.interseccion_valida ? "red" : "orange", 
                            weight: 2, 
                            fillOpacity: 0.3 
                          }}
                          pane="selectedPane"
                        >
                          <Popup>
                            <div>
                              <div><b>Concesión:</b> {concession.nombre}</div>
                              <div><b>Código Centro:</b> {concession.codigo_centro}</div>
                              <div><b>Titular:</b> {concession.titular}</div>
                              <div><b>Tipo:</b> {concession.tipo}</div>
                              <div><b>Región:</b> {concession.region}</div>
                              <div><b>Intersección Válida:</b> {resultado?.interseccion_valida ? 'Sí' : 'No'}</div>
                              <div><b>Distancia Mínima:</b> {resultado?.distancia_minima}m</div>
                            </div>
                          </Popup>
                        </GeoJSON>
                        
                        {centroide && (
                          <Marker position={centroide} icon={L.divIcon({ className: 'invisible-marker' })}>
                            <Tooltip direction="center" permanent className="tooltip-centro">
                              <span>{concession.codigo_centro}</span>
                            </Tooltip>
                          </Marker>
                        )}
                      </React.Fragment>
                    )
                  })}
                </MapContainer>
              </div>
              
                             {/* Leyenda del mapa */}
               <div className="mt-4 p-4 bg-muted rounded-lg">
                 <h4 className="font-medium mb-2">Leyenda</h4>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                   <div className="flex items-center gap-2">
                     <MapPin className="h-4 w-4 text-blue-600" />
                     <span>Puntos GPS ({evidencias.length})</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-4 h-4 border-2 border-blue-500 bg-blue-200 rounded"></div>
                     <span>Área de Buffer ({analysisResults.buffer_distance}m)</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-4 h-4 border-2 border-red-500 bg-red-300 rounded"></div>
                     <span>Intersección Válida</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-4 h-4 border-2 border-orange-500 bg-orange-300 rounded"></div>
                     <span>Intersección No Válida</span>
                   </div>
                 </div>
               </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Concesiones Intersectadas */}
        <TabsContent value="concesiones">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Concesiones Intersectadas ({concesionesIntersectadas.length})
              </CardTitle>
              <CardDescription>
                Detalle de todas las concesiones que intersectan con el área de buffer
              </CardDescription>
            </CardHeader>
            <CardContent>
              {concesionesIntersectadas.length > 0 ? (
                <div className="space-y-4">
                                       <Table>
                       <TableHeader>
                         <TableRow>
                           <TableHead>Código Centro</TableHead>
                           <TableHead>Nombre</TableHead>
                           <TableHead>Titular</TableHead>
                           <TableHead>Tipo</TableHead>
                           <TableHead>Región</TableHead>
                           <TableHead>Intersección</TableHead>
                           <TableHead>Acciones</TableHead>
                         </TableRow>
                       </TableHeader>
                    <TableBody>
                      {concesionesIntersectadas.map((resultado) => {
                        const concessionData = concesionesData.find(c => c.id_concesion === resultado.id_concesion)
                        return (
                          <TableRow key={resultado.id_concesion}>
                            <TableCell className="font-medium">
                              {concessionData?.codigo_centro || 'N/A'}
                            </TableCell>
                            <TableCell>{concessionData?.nombre || 'N/A'}</TableCell>
                            <TableCell>{concessionData?.titular || 'N/A'}</TableCell>
                            <TableCell>{concessionData?.tipo || 'N/A'}</TableCell>
                            <TableCell>{concessionData?.region || 'N/A'}</TableCell>
                                                         <TableCell>
                               <Badge variant={resultado.interseccion_valida ? "default" : "secondary"}>
                                 {resultado.interseccion_valida ? "Válida" : "No Válida"}
                               </Badge>
                             </TableCell>
                             <TableCell>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewOnMap(concessionData)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4" />
                  <p>No se encontraron concesiones intersectadas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Detalles de Inspección */}
        <TabsContent value="detalles">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Información general */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Información General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Sector:</span>
                    <span className="font-medium">{data.sectorName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Fecha de Inspección:</span>
                    <span className="font-medium">{data.inspectionDate}</span>
                  </div>
                                     <div className="flex items-center gap-2">
                     <User className="h-4 w-4 text-muted-foreground" />
                     <span className="text-muted-foreground">Inspector:</span>
                     <span className="font-medium">
                       {loadingData ? 'Cargando...' : usuario?.nombre || 'N/A'}
                     </span>
                   </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Fotografías:</span>
                    <span className="font-medium">{data.photos?.length || 0}</span>
                  </div>
                </div>
                
                {data.observations && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2 text-sm">Observaciones</h4>
                    <p className="text-sm text-muted-foreground">{data.observations}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Información técnica del análisis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Parámetros del Análisis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID del Análisis:</span>
                    <span className="font-medium">#{analysisResults.id_analisis}</span>
                  </div>
                                     <div className="flex justify-between">
                     <span className="text-muted-foreground">Fecha del Análisis:</span>
                     <span className="font-medium">
                       {analysisResults.fecha_analisis ? new Date(analysisResults.fecha_analisis).toLocaleString() : 'N/A'}
                     </span>
                   </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Método:</span>
                    <span className="font-medium">{analysisResults.metodo}</span>
                  </div>
                                     <div className="flex justify-between">
                     <span className="text-muted-foreground">Distancia Buffer:</span>
                     <span className="font-medium">{analysisResults.buffer_distance}m</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">Ajuste UTC:</span>
                     <span className="font-medium">
                       {data.utcOffset !== null && data.utcOffset !== undefined ? `UTC${data.utcOffset >= 0 ? '+' : ''}${data.utcOffset}` : 'N/A'}
                     </span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">Total Concesiones:</span>
                     <span className="font-medium">{concesionesIntersectadas.length}</span>
                   </div>
                                                        <div className="flex justify-between">
                     <span className="text-muted-foreground">Puntos GPS:</span>
                     <span className="font-medium">{puntosGPS}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">Titulares Afectados:</span>
                     <span className="font-medium">{titularesUnicos}</span>
                   </div>
                 </div>

                {/* Estado del análisis */}
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium text-sm">Estado del Proceso</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Análisis completado exitosamente</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Datos guardados en base de datos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Resultados listos para exportar</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Sección de descargas */}
      <Card>
        <CardHeader>
          <CardTitle>Archivos de Resultados</CardTitle>
          <CardDescription>Descargue los archivos generados del análisis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-red-600" />
                <div>
                  <p className="font-medium">Reporte de Inspección</p>
                  <p className="text-sm text-muted-foreground">Documento PDF completo</p>
                  <Badge variant="outline" className="mt-1 text-xs">
                    PDF • ID: {analysisResults.id_analisis}
                  </Badge>
                </div>
              </div>
              <Button onClick={handleDownloadPDF}>
                <Download className="mr-2 h-4 w-4" />
                Descargar
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Map className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-medium">Datos Geoespaciales</p>
                  <p className="text-sm text-muted-foreground">Archivo KMZ para Google Earth</p>
                  <Badge variant="outline" className="mt-1 text-xs">
                    KMZ • ID: {analysisResults.id_analisis}
                  </Badge>
                </div>
              </div>
              <Button onClick={handleDownloadKMZ}>
                <Download className="mr-2 h-4 w-4" />
                Descargar
              </Button>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <h4 className="font-medium mb-2">Información de los Archivos</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>• El archivo PDF contiene el reporte completo con análisis, mapa y concesiones intersectadas</p>
              <p>• El archivo KMZ incluye el buffer, concesiones y evidencias para visualizar en Google Earth</p>
              <p>• Los archivos contienen los datos del análisis ID #{analysisResults.id_analisis}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones finales */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          Anterior
        </Button>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => (window.location.href = "/historial")}>
            Ver en Historial
          </Button>
          <Button onClick={() => (window.location.href = "/")}>Finalizar</Button>
        </div>
      </div>
    </div>
  )
}

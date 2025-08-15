"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { use } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle, MapPin, Calendar, FileText, BarChart3, Download, ArrowLeft, Target, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { AspectRatio } from "@/components/ui/aspect-ratio"

interface DenunciaDetalle {
  id_denuncia: number
  id_usuario: number
  id_estado: number
  fecha_inspeccion: string
  fecha_ingreso: string
  lugar?: string
  observaciones?: string
  evidencias: Evidencia[]
  analisis: Analisis[]
  fotos: Foto[]
  total_evidencias: number
  total_analisis: number
  total_fotos: number
}

interface Evidencia {
  id_evidencia: number
  id_denuncia: number
  coordenadas: any
  fecha: string
  hora: string
  descripcion?: string
  foto_url?: string
}

interface Analisis {
  id_analisis: number
  id_denuncia: number
  fecha_analisis: string
  distancia_buffer: number
  metodo?: string
  observaciones?: string
  resultados: ResultadoAnalisis[]
  buffer_geom?: any
}

interface ResultadoAnalisis {
  id_concesion: number
  interseccion_valida: boolean
  distancia_minima?: number
  codigo_centro?: string
  nombre?: string
  titular?: string
  tipo?: string
  region?: string
}

interface Foto {
  id_evidencia: number
  foto_url: string
  descripcion?: string
  fecha: string
  hora: string
  coordenadas: { lat: number; lng: number }
}

interface Estado {
  id_estado: number
  estado: string
}

export default function DenunciaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { token, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const [denuncia, setDenuncia] = useState<DenunciaDetalle | null>(null)
  const [estados, setEstados] = useState<Estado[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showEstadoChange, setShowEstadoChange] = useState(false)
  const [nuevoEstado, setNuevoEstado] = useState<number | null>(null)
  const [observacionCambio, setObservacionCambio] = useState("")
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  
  // Usar React.use() para acceder a params en Next.js 15
  const resolvedParams = use(params)
  const denunciaId = resolvedParams.id

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.push("/auth/login")
      return
    }

    if (token && denunciaId) {
      cargarDatos()
    }
  }, [token, isAuthenticated, loading, router, denunciaId])

  const cargarDatos = async () => {
    if (!token || !denunciaId) return

    setLoadingData(true)
    setError(null)

    try {
      // Cargar detalles de la denuncia
      const denunciaResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/denuncias/${denunciaId}/detalles`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!denunciaResponse.ok) {
        throw new Error(`Error al cargar denuncia: ${denunciaResponse.statusText}`)
      }

      const denunciaData = await denunciaResponse.json()
      setDenuncia(denunciaData)

      // Cargar estados disponibles
      const estadosResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/estados_denuncia/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!estadosResponse.ok) {
        throw new Error(`Error al cargar estados: ${estadosResponse.statusText}`)
      }

      const estadosData = await estadosResponse.json()
      setEstados(estadosData)

    } catch (error) {
      console.error('Error al cargar datos:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setLoadingData(false)
    }
  }

  const obtenerNombreEstado = (idEstado: number) => {
    const estado = estados.find(e => e.id_estado === idEstado)
    return estado?.estado || 'Desconocido'
  }

  const cambiarEstado = async () => {
    if (!token || !denuncia || !nuevoEstado) return

    try {
      // Usar directamente lo que el usuario escribió en el campo de texto
      const observacionesFinales = observacionCambio.trim()

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/denuncias/${denuncia.id_denuncia}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          id_estado: nuevoEstado,
          observaciones: observacionesFinales 
        })
      })

      if (!response.ok) {
        throw new Error(`Error al cambiar estado: ${response.statusText}`)
      }

      // Recargar datos después del cambio
      await cargarDatos()
      
      // Mostrar mensaje de confirmación
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 3000) // Ocultar después de 3 segundos
      
      // Limpiar el formulario
      setShowEstadoChange(false)
      setNuevoEstado(null)
      setObservacionCambio("")

    } catch (error) {
      console.error('Error al cambiar estado:', error)
      setError(error instanceof Error ? error.message : 'Error al cambiar estado')
    }
  }

  const generarNombreArchivo = (tipo: 'pdf' | 'kmz') => {
    const lugar = denuncia?.lugar || 'Sin_Lugar'
    // Limpiar el nombre del lugar para que sea válido como nombre de archivo
    const lugarLimpio = lugar
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remover caracteres especiales
      .replace(/\s+/g, '_') // Reemplazar espacios con guiones bajos
      .trim()
    
    return `denuncia_${denuncia?.id_denuncia}_${lugarLimpio}_${tipo}.${tipo}`
  }

  const descargarReporte = async (tipo: 'pdf' | 'kmz') => {
    if (!token || !denuncia) return

    try {
      const analisisId = denuncia.analisis[0]?.id_analisis
      if (!analisisId) {
        setError('No hay análisis disponible para descargar')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analisis/${analisisId}/${tipo}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`Error al descargar ${tipo}: ${response.statusText}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = generarNombreArchivo(tipo)
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

    } catch (error) {
      console.error(`Error al descargar ${tipo}:`, error)
      setError(error instanceof Error ? error.message : `Error al descargar ${tipo}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/mis-denuncias')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Mis Denuncias
        </Button>
      </div>
    )
  }

  if (!denuncia) {
    return (
      <div className="p-6">
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Denuncia no encontrada</AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/mis-denuncias')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Mis Denuncias
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.push('/mis-denuncias')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Mis Denuncias
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Denuncia #{denuncia.id_denuncia}
            </h1>
            <p className="text-muted-foreground">
              Detalles completos de la inspección
            </p>
          </div>
          <Badge variant={
            obtenerNombreEstado(denuncia.id_estado).toLowerCase().includes('terminada')
              ? "secondary" 
              : "default"
          }>
            {obtenerNombreEstado(denuncia.id_estado)}
          </Badge>
        </div>
      </div>

      {/* Información General */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Información General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Fecha de Inspección:</span>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {new Date(denuncia.fecha_inspeccion).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
            
            <div>
              <span className="font-medium">Fecha de Ingreso:</span>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {new Date(denuncia.fecha_ingreso).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>

          {denuncia.lugar && (
            <div>
              <span className="font-medium">Lugar:</span>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{denuncia.lugar}</span>
              </div>
            </div>
          )}

          {denuncia.observaciones && (
            <div>
              <span className="font-medium">Observaciones:</span>
              <p className="text-muted-foreground mt-1">{denuncia.observaciones}</p>
            </div>
          )}

          {/* Acciones */}
          <Separator />
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowEstadoChange(!showEstadoChange)
                if (!showEstadoChange) {
                  // Inicializar con solo las observaciones originales (sin separadores)
                  const observacionesExistentes = denuncia.observaciones || ""
                  const observacionesOriginales = observacionesExistentes
                    .split('--- CAMBIO DE ESTADO ---')[0] // Tomar solo la parte antes del primer separador
                    .trim()
                  setObservacionCambio(observacionesOriginales)
                }
              }}
            >
              Cambiar Estado
            </Button>
            
            {denuncia.analisis.length > 0 && (
              <>
                <Button
                  variant="outline"
                  onClick={() => descargarReporte('pdf')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Descargar PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => descargarReporte('kmz')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Descargar KMZ
                </Button>
              </>
            )}
          </div>

          {/* Subsección para cambio de estado */}
          {showEstadoChange && (
            <div className="mt-4 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-4">Cambiar Estado de la Denuncia</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nuevo-estado">Nuevo Estado *</Label>
                  <Select 
                    value={nuevoEstado?.toString() || ""} 
                    onValueChange={(value) => setNuevoEstado(Number(value))}
                  >
                    <SelectTrigger id="nuevo-estado">
                      <SelectValue placeholder="Seleccionar nuevo estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {estados.map((estado) => (
                        <SelectItem key={estado.id_estado} value={estado.id_estado.toString()}>
                          {estado.estado}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="observacion-cambio">Observaciones (se combinarán con las originales) *</Label>
                  <Textarea
                    id="observacion-cambio"
                    placeholder="Las observaciones originales se muestran arriba. Puede editarlas y agregar nuevas observaciones..."
                    className="min-h-[120px]"
                    value={observacionCambio}
                    onChange={(e) => setObservacionCambio(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={cambiarEstado}
                    disabled={!nuevoEstado || !observacionCambio.trim()}
                  >
                    Confirmar Cambio
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEstadoChange(false)
                      setNuevoEstado(null)
                      setObservacionCambio("")
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Mensaje de confirmación */}
          {showSuccessMessage && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">¡Estado actualizado exitosamente!</span>
              </div>
              <p className="text-green-700 mt-1 text-sm">
                El estado de la denuncia ha sido cambiado y las observaciones han sido actualizadas.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs para diferentes secciones */}
      <Tabs defaultValue="evidencias" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="evidencias" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Evidencias ({denuncia.total_evidencias})
          </TabsTrigger>
          <TabsTrigger value="analisis" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Análisis ({denuncia.total_analisis})
          </TabsTrigger>
        </TabsList>

        {/* Tab Evidencias */}
        <TabsContent value="evidencias">
          <Card>
            <CardHeader>
              <CardTitle>Evidencias GPS</CardTitle>
              <CardDescription>
                Puntos georreferenciados registrados durante la inspección
              </CardDescription>
            </CardHeader>
            <CardContent>
              {denuncia.evidencias.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay evidencias registradas para esta denuncia.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {denuncia.evidencias.map((evidencia) => (
                    <Card key={evidencia.id_evidencia} className="overflow-hidden">
                      {/* Foto arriba */}
                      {evidencia.foto_url && (
                        <div className="w-full h-32">
                          <img
                            src={`${process.env.NEXT_PUBLIC_API_URL}${evidencia.foto_url}`}
                            alt="Evidencia"
                            className="object-cover w-full h-full rounded-t-lg cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setSelectedImage(evidencia.foto_url)}
                          />
                        </div>
                      )}
                      
                      {/* Datos abajo */}
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-lg">
                              Evidencia #{evidencia.id_evidencia}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {new Date(evidencia.fecha).toLocaleDateString('es-ES')}
                            </Badge>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Hora:</span> {evidencia.hora}
                            </p>
                            
                            {evidencia.descripcion && (
                              <p className="text-sm text-muted-foreground">
                                <span className="font-medium">Descripción:</span> {evidencia.descripcion}
                              </p>
                            )}
                            
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">Coordenadas:</span><br />
                              Lat: {evidencia.coordenadas.coordinates[1].toFixed(6)}<br />
                              Lng: {evidencia.coordenadas.coordinates[0].toFixed(6)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>



        {/* Tab Análisis */}
        <TabsContent value="analisis">
          <Card>
            <CardHeader>
              <CardTitle>Análisis Geoespacial</CardTitle>
              <CardDescription>
                Resultados de análisis de proximidad con concesiones acuícolas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {denuncia.analisis.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay análisis realizados para esta denuncia.
                </div>
              ) : (
                <div className="space-y-6">
                  {denuncia.analisis.map((analisis) => (
                    <Card key={analisis.id_analisis} className="p-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium">Análisis #{analisis.id_analisis}</h4>
                          <p className="text-sm text-muted-foreground">
                            Realizado el {new Date(analisis.fecha_analisis).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <span className="font-medium">Distancia de Buffer:</span>
                            <p className="text-sm text-muted-foreground">
                              {analisis.distancia_buffer} metros
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Método:</span>
                            <p className="text-sm text-muted-foreground">
                              {analisis.metodo || 'No especificado'}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Concesiones Encontradas:</span>
                            <p className="text-sm text-muted-foreground">
                              {analisis.resultados.length}
                            </p>
                          </div>
                        </div>

                        {analisis.observaciones && (
                          <div>
                            <span className="font-medium">Observaciones:</span>
                            <p className="text-sm text-muted-foreground mt-1">
                              {analisis.observaciones}
                            </p>
                          </div>
                        )}

                        {analisis.resultados.length > 0 && (
                          <div>
                            <span className="font-medium">Concesiones Intersectadas:</span>
                            <div className="mt-4">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Código Centro</TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Titular</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Región</TableHead>
                                    <TableHead>Intersección</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {analisis.resultados.map((resultado) => (
                                    <TableRow key={resultado.id_concesion}>
                                      <TableCell className="font-medium">
                                        {resultado.codigo_centro || 'N/A'}
                                      </TableCell>
                                      <TableCell>{resultado.nombre || 'N/A'}</TableCell>
                                      <TableCell>{resultado.titular || 'N/A'}</TableCell>
                                      <TableCell>{resultado.tipo || 'N/A'}</TableCell>
                                      <TableCell>{resultado.region || 'N/A'}</TableCell>
                                      <TableCell>
                                        <Badge variant={resultado.interseccion_valida ? "default" : "secondary"}>
                                          {resultado.interseccion_valida ? "Válida" : "No Válida"}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal para mostrar imagen en tamaño completo */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL}${selectedImage}`}
              alt="Evidencia en tamaño completo"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75 transition-opacity"
              onClick={() => setSelectedImage(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 
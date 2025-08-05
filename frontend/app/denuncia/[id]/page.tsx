"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { use } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, AlertCircle, MapPin, Calendar, FileText, Camera, BarChart3, Download, ArrowLeft } from "lucide-react"
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

  const cambiarEstado = async (nuevoEstado: number) => {
    if (!token || !denuncia) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/denuncias/${denuncia.id_denuncia}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id_estado: nuevoEstado })
      })

      if (!response.ok) {
        throw new Error(`Error al cambiar estado: ${response.statusText}`)
      }

      // Recargar datos después del cambio
      await cargarDatos()

    } catch (error) {
      console.error('Error al cambiar estado:', error)
      setError(error instanceof Error ? error.message : 'Error al cambiar estado')
    }
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
      a.download = `denuncia_${denuncia.id_denuncia}_${tipo}.${tipo}`
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
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
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
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
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
            {(obtenerNombreEstado(denuncia.id_estado).toLowerCase().includes('ingresada') || 
              obtenerNombreEstado(denuncia.id_estado).toLowerCase().includes('en proceso')) && (
              <Button
                variant="outline"
                onClick={() => cambiarEstado(3)} // ID 3 = "Terminada"
              >
                Marcar como Terminada
              </Button>
            )}
            
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
        </CardContent>
      </Card>

      {/* Tabs para diferentes secciones */}
      <Tabs defaultValue="evidencias" className="space-y-4">
        <TabsList>
          <TabsTrigger value="evidencias" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Evidencias ({denuncia.total_evidencias})
          </TabsTrigger>
          <TabsTrigger value="fotos" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Fotos ({denuncia.total_fotos})
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
                <div className="space-y-4">
                  {denuncia.evidencias.map((evidencia) => (
                    <Card key={evidencia.id_evidencia} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            Evidencia #{evidencia.id_evidencia}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(evidencia.fecha).toLocaleDateString('es-ES')} - {evidencia.hora}
                          </p>
                          {evidencia.descripcion && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {evidencia.descripcion}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Coordenadas: {evidencia.coordenadas.coordinates[1].toFixed(6)}, {evidencia.coordenadas.coordinates[0].toFixed(6)}
                          </p>
                        </div>
                        {evidencia.foto_url && (
                          <div className="w-16 h-16">
                            <AspectRatio ratio={1}>
                              <img
                                src={`${process.env.NEXT_PUBLIC_API_URL}${evidencia.foto_url}`}
                                alt="Evidencia"
                                className="rounded-md object-cover"
                              />
                            </AspectRatio>
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

        {/* Tab Fotos */}
        <TabsContent value="fotos">
          <Card>
            <CardHeader>
              <CardTitle>Fotografías</CardTitle>
              <CardDescription>
                Imágenes capturadas durante la inspección
              </CardDescription>
            </CardHeader>
            <CardContent>
              {denuncia.fotos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay fotografías registradas para esta denuncia.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {denuncia.fotos.map((foto) => (
                    <Card key={foto.id_evidencia} className="overflow-hidden">
                      <AspectRatio ratio={4/3}>
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_URL}${foto.foto_url}`}
                          alt={foto.descripcion || 'Foto de evidencia'}
                          className="object-cover w-full h-full"
                        />
                      </AspectRatio>
                      <CardContent className="p-4">
                        <p className="text-sm font-medium">
                          {new Date(foto.fecha).toLocaleDateString('es-ES')} - {foto.hora}
                        </p>
                        {foto.descripcion && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {foto.descripcion}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Coordenadas: {foto.coordenadas.lat.toFixed(6)}, {foto.coordenadas.lng.toFixed(6)}
                        </p>
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
                            <span className="font-medium">Resultados:</span>
                            <div className="mt-2 space-y-2">
                              {analisis.resultados.map((resultado, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                                  <span className="text-sm">
                                    Concesión #{resultado.id_concesion}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={resultado.interseccion_valida ? "default" : "secondary"}>
                                      {resultado.interseccion_valida ? "Intersecta" : "No intersecta"}
                                    </Badge>
                                    {resultado.distancia_minima && (
                                      <span className="text-xs text-muted-foreground">
                                        {resultado.distancia_minima.toFixed(2)}m
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
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
    </div>
  )
} 
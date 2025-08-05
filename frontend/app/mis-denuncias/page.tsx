"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Denuncia {
  id_denuncia: number
  id_usuario: number
  id_estado: number
  fecha_inspeccion: string
  fecha_ingreso: string
  lugar?: string
  observaciones?: string
}

interface Estado {
  id_estado: number
  estado: string
}

export default function MisDenunciasPage() {
  const { token, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const [denuncias, setDenuncias] = useState<Denuncia[]>([])
  const [estados, setEstados] = useState<Estado[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.push("/auth/login")
      return
    }

    if (token) {
      cargarDatos()
    }
  }, [token, isAuthenticated, loading, router])

  const cargarDatos = async () => {
    if (!token) return

    setLoadingData(true)
    setError(null)

    try {
      // Cargar denuncias del usuario
      const denunciasResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/denuncias/mis-denuncias`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!denunciasResponse.ok) {
        throw new Error(`Error al cargar denuncias: ${denunciasResponse.statusText}`)
      }

      const denunciasData = await denunciasResponse.json()
      setDenuncias(denunciasData)

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

  const cambiarEstado = async (idDenuncia: number, nuevoEstado: number) => {
    if (!token) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/denuncias/${idDenuncia}/estado`, {
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

  const obtenerNombreEstado = (idEstado: number) => {
    const estado = estados.find(e => e.id_estado === idEstado)
    return estado?.estado || 'Desconocido'
  }

  const denunciasFiltradas = filtroEstado === "todos" 
    ? denuncias 
    : denuncias.filter(d => {
        const estado = obtenerNombreEstado(d.id_estado)
        if (filtroEstado === "en_curso") {
          return estado.toLowerCase().includes('ingresada') || estado.toLowerCase().includes('en proceso')
        }
        if (filtroEstado === "terminadas") {
          return estado.toLowerCase().includes('terminada')
        }
        return true
      })

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

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mis Denuncias</h1>
        <p className="text-muted-foreground">
          Gestiona y da seguimiento a tus denuncias de inspección
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex gap-2">
        <Button
          variant={filtroEstado === "todos" ? "default" : "outline"}
          onClick={() => setFiltroEstado("todos")}
        >
          Todas ({denuncias.length})
        </Button>
        <Button
          variant={filtroEstado === "en_curso" ? "default" : "outline"}
          onClick={() => setFiltroEstado("en_curso")}
        >
          En Curso ({denuncias.filter(d => {
            const estado = obtenerNombreEstado(d.id_estado)
            return estado.toLowerCase().includes('ingresada') || estado.toLowerCase().includes('en proceso')
          }).length})
        </Button>
        <Button
          variant={filtroEstado === "terminadas" ? "default" : "outline"}
          onClick={() => setFiltroEstado("terminadas")}
        >
          Terminadas ({denuncias.filter(d => {
            const estado = obtenerNombreEstado(d.id_estado)
            return estado.toLowerCase().includes('terminada')
          }).length})
        </Button>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loadingData ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : denunciasFiltradas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay denuncias</h3>
            <p className="text-muted-foreground text-center">
              {filtroEstado === "todos" 
                ? "Aún no has creado ninguna denuncia de inspección."
                : `No hay denuncias ${filtroEstado === "en_curso" ? "en curso" : "terminadas"}.`
              }
            </p>
            <Button className="mt-4" onClick={() => router.push('/nueva-inspeccion')}>
              Crear Nueva Inspección
            </Button>
          </CardContent>
        </Card>
      ) : (
                 <div className="grid gap-4 max-w-4xl">
          {denunciasFiltradas.map((denuncia) => (
            <Card key={denuncia.id_denuncia}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Denuncia #{denuncia.id_denuncia}
                    </CardTitle>
                    <CardDescription>
                      Creada el {new Date(denuncia.fecha_ingreso).toLocaleDateString('es-ES')}
                    </CardDescription>
                  </div>
                                     <Badge variant={
                     obtenerNombreEstado(denuncia.id_estado).toLowerCase().includes('terminada')
                       ? "secondary" 
                       : "default"
                   }>
                     {obtenerNombreEstado(denuncia.id_estado)}
                   </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium">Fecha de Inspección:</span>
                    <span className="ml-2 text-muted-foreground">
                      {new Date(denuncia.fecha_inspeccion).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  
                  {denuncia.lugar && (
                    <div>
                      <span className="font-medium">Lugar:</span>
                      <span className="ml-2 text-muted-foreground">{denuncia.lugar}</span>
                    </div>
                  )}
                  
                  {denuncia.observaciones && (
                    <div>
                      <span className="font-medium">Observaciones:</span>
                      <span className="ml-2 text-muted-foreground">{denuncia.observaciones}</span>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/denuncia/${denuncia.id_denuncia}`)}
                    >
                      Ver Detalles
                    </Button>
                    
                                         {(obtenerNombreEstado(denuncia.id_estado).toLowerCase().includes('ingresada') || 
                       obtenerNombreEstado(denuncia.id_estado).toLowerCase().includes('en proceso')) && (
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => cambiarEstado(denuncia.id_denuncia, 3)} // ID 3 = "Terminada"
                       >
                         Marcar como Terminada
                       </Button>
                     )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 
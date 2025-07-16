"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, ImageIcon, FileText, Play, CheckCircle, User, AlertCircle } from "lucide-react"
import { AnalysisMap } from "@/components/analysis-map"
import type { InspectionData } from "@/components/inspection-wizard"
import { API_TOKEN, API_BASE_URL } from "./step-one"

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

export function StepFour({ data, updateData, onNext, onPrev }: StepFourProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(data.analysisComplete)
  
  // Estados para datos de usuario y estado
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [estado, setEstado] = useState<EstadoDenuncia | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [errorData, setErrorData] = useState<string | null>(null)

  // Cargar datos de usuario y estado cuando el componente se monta
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
      } catch (error) {
        console.error('Error al cargar datos:', error)
        setErrorData('Error al cargar información de la denuncia')
      } finally {
        setLoadingData(false)
      }
    }

    cargarDatos()
  }, [data.id_usuario, data.id_estado])

  const handleAnalysis = () => {
    setIsAnalyzing(true)

    // Simular análisis
    setTimeout(() => {
      setIsAnalyzing(false)
      setAnalysisComplete(true)
      updateData({ analysisComplete: true })
    }, 3000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análisis de Datos</CardTitle>
        <CardDescription>Revise los datos ingresados y ejecute el análisis de la inspección</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumen de datos */}
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
              <p>
                <span className="text-muted-foreground">Estado:</span>{" "}
                {loadingData ? (
                  <span className="text-muted-foreground">Cargando...</span>
                ) : estado ? (
                  <Badge variant="outline" className="text-xs">
                    {estado.estado}
                  </Badge>
                ) : (
                  <span className="text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    No disponible
                  </span>
                )}
              </p>
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
                <span className="text-muted-foreground">Waypoints:</span> {Math.floor(Math.random() * 50) + 10}
              </p>
              <Badge variant="outline" className="text-xs">
                GPX Válido
              </Badge>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              <h4 className="font-medium">Fotografías</h4>
            </div>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Total:</span> {data.photos.length} fotos
              </p>
              <p>
                <span className="text-muted-foreground">Tamaño:</span>{" "}
                {(data.photos.reduce((acc, photo) => acc + photo.size, 0) / 1024 / 1024).toFixed(1)} MB
              </p>
              <Badge variant="outline" className="text-xs">
                Listo para análisis
              </Badge>
            </div>
          </div>
        </div>

        {/* Mapa de análisis */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium">Mapa de Inspección</h4>
            {!analysisComplete && (
              <Button onClick={handleAnalysis} disabled={isAnalyzing}>
                {isAnalyzing ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Ejecutar Análisis
                  </>
                )}
              </Button>
            )}
            {analysisComplete && (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Análisis Completado
              </Badge>
            )}
          </div>

          <div className="rounded-lg border">
            <AnalysisMap
              sectorName={data.sectorName}
              waypoints={Math.floor(Math.random() * 50) + 10}
              photos={data.photos.length}
              isAnalyzing={isAnalyzing}
              analysisComplete={analysisComplete}
            />
          </div>
        </div>

        {/* Observaciones */}
        {data.observations && (
          <div className="rounded-lg border p-4">
            <h4 className="font-medium mb-2">Observaciones</h4>
            <p className="text-sm text-muted-foreground">{data.observations}</p>
          </div>
        )}

        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={onPrev}>
            Anterior
          </Button>
          <Button onClick={onNext} disabled={!analysisComplete}>
            Ver Resultados
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { InspectionData } from "@/components/inspection-wizard"

interface StepOneProps {
  data: InspectionData
  updateData: (data: Partial<InspectionData>) => void
  setInspectionData: (data: any) => void // Nuevo: para guardar id_denuncia
  onNext: () => void
}

// Función para detectar automáticamente la URL de la API
const detectApiUrl = () => {
  // Si está definida en las variables de entorno, usarla
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  
  // Lista de URLs a probar en orden de prioridad
  const urls = [
    'http://localhost:8000',      // Desarrollo local
    'http://backend:8000',        // Docker
    'http://host.docker.internal:8000' // Docker desde contenedor
  ]
  
  // Por defecto, usar la primera URL
  return urls[0]
}

export const API_BASE_URL = detectApiUrl()

export function StepOne({ data, updateData, setInspectionData, onNext }: StepOneProps) {
  const { token, isAuthenticated, loading: authLoading } = useAuth()
  
  const [formData, setFormData] = useState({
    sectorName: data.sectorName,
    inspectionDate: data.inspectionDate,
    id_usuario: data.id_usuario,
    id_estado: data.id_estado,
    observations: data.observations,
    fecha_ingreso: data.fecha_ingreso,
  })
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [estados, setEstados] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [dataLoading, setDataLoading] = useState(false)

  useEffect(() => {
    // Solo cargar datos si el usuario está autenticado y hay token
    if (!isAuthenticated || !token || authLoading) {
      console.log('Usuario no autenticado, sin token, o aún cargando:', { isAuthenticated, hasToken: !!token, authLoading })
      return
    }

    console.log('Cargando usuarios y estados con token:', token.substring(0, 20) + '...')
    console.log('API_BASE_URL:', API_BASE_URL)
    
    setDataLoading(true)
    setError("")
    
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
          console.log(`Probando URL: ${baseUrl}${endpoint}`)
          const res = await fetchWithTimeout(`${baseUrl}${endpoint}`, options)
          
          if (res.ok) {
            console.log(`URL exitosa: ${baseUrl}`)
            return res
          }
        } catch (error) {
          console.log(`URL falló: ${baseUrl}`, error)
          continue
        }
      }
      
      throw new Error('No se pudo conectar a ninguna URL de la API')
    }

    // Cargar usuarios
    const loadUsuarios = async () => {
      try {
        console.log('Intentando cargar usuarios...')
        const res = await tryApiUrls('/usuarios/', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        console.log('Respuesta usuarios:', res.status, res.statusText)
        
        const data = await res.json()
        console.log('Usuarios cargados exitosamente:', data)
        setUsuarios(data)
      } catch (error: any) {
        console.error('Error al cargar usuarios:', error)
        if (error.name === 'AbortError') {
          setError("Timeout: El servidor no respondió en el tiempo esperado")
        } else if (error.message.includes('Failed to fetch')) {
          setError("Error de conectividad: No se puede conectar al servidor. Verifique que el backend esté ejecutándose.")
        } else {
          setError(`Error al cargar usuarios: ${error.message}`)
        }
        setUsuarios([])
      }
    }

    // Cargar estados
    const loadEstados = async () => {
      try {
        console.log('Intentando cargar estados...')
        const res = await tryApiUrls('/estados_denuncia/', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        console.log('Respuesta estados:', res.status, res.statusText)
        
        const data = await res.json()
        console.log('Estados cargados exitosamente:', data)
        setEstados(data)
      } catch (error: any) {
        console.error('Error al cargar estados:', error)
        if (error.name === 'AbortError') {
          setError("Timeout: El servidor no respondió en el tiempo esperado")
        } else if (error.message.includes('Failed to fetch')) {
          setError("Error de conectividad: No se puede conectar al servidor. Verifique que el backend esté ejecutándose.")
        } else {
          setError(`Error al cargar estados: ${error.message}`)
        }
        setEstados([])
      }
    }

    // Cargar ambos datos en paralelo
    Promise.all([loadUsuarios(), loadEstados()])
      .finally(() => {
        setDataLoading(false)
      })
      .catch(error => {
        console.error('Error general en carga de datos:', error)
        setDataLoading(false)
      })

  }, [isAuthenticated, token, authLoading])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    updateData({ [field]: value })
  }

  const canProceed =
    formData.sectorName &&
    formData.inspectionDate &&
    formData.id_usuario &&
    formData.id_estado &&
    formData.observations !== undefined &&
    formData.fecha_ingreso

  const handleNext = async () => {
    if (!isAuthenticated || !token) {
      setError("Debe iniciar sesión para continuar")
      return
    }

    setLoading(true)
    setError("")
    try {
      const body = {
        id_usuario: formData.id_usuario,
        id_estado: formData.id_estado,
        fecha_inspeccion: new Date(formData.inspectionDate).toISOString(),
        fecha_ingreso: formData.fecha_ingreso,
        lugar: formData.sectorName,
        observaciones: formData.observations,
      }
      
      console.log('Enviando datos a la API:', body)
      
      // Usar la misma lógica de detección de URL
      const urls = [
        'http://localhost:8000',
        'http://backend:8000',
        'http://host.docker.internal:8000'
      ]
      
      let res: Response | null = null
      let lastError: any = null
      
      for (const baseUrl of urls) {
        try {
          console.log(`Probando URL para crear denuncia: ${baseUrl}/denuncias/`)
          res = await fetch(`${baseUrl}/denuncias/`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(body),
          })
          
          if (res.ok) {
            console.log(`URL exitosa para crear denuncia: ${baseUrl}`)
            break
          }
        } catch (error) {
          console.log(`URL falló para crear denuncia: ${baseUrl}`, error)
          lastError = error
          continue
        }
      }
      
      if (!res || !res.ok) {
        throw new Error(lastError?.message || 'No se pudo conectar a ninguna URL de la API')
      }
      
      console.log('Respuesta del servidor:', res.status, res.statusText)
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('Error response:', errorText)
        throw new Error(`Error ${res.status}: ${res.statusText} - ${errorText}`)
      }
      
      const dataRes = await res.json()
      console.log('Respuesta exitosa:', dataRes)
      
      setInspectionData((prev: any) => ({ ...prev, ...body, id_denuncia: dataRes.id_denuncia }))
      onNext()
    } catch (e: any) {
      console.error('Error completo:', e)
      setError(e.message || "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  // Mostrar loading mientras se verifica la autenticación
  if (authLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verificando autenticación...</CardTitle>
          <CardDescription>Por favor espere mientras verificamos su sesión</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Mostrar mensaje si no está autenticado
  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acceso Requerido</CardTitle>
          <CardDescription>Debe iniciar sesión para crear una nueva inspección</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Por favor, inicie sesión para continuar con la creación de la inspección.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información General</CardTitle>
        <CardDescription>Ingrese los datos básicos de la inspección</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mostrar estado de carga de datos */}
        {dataLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-blue-800">Cargando datos del servidor...</span>
            </div>
          </div>
        )}

        {/* Mostrar errores de conectividad */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <span className="text-red-800 font-medium">Error:</span>
              <span className="text-red-700">{error}</span>
            </div>
            <div className="mt-2 text-sm text-red-600">
              <p>• Verifique que el backend esté ejecutándose</p>
              <p>• Revise la consola del navegador para más detalles</p>
              <p>• URLs probadas: localhost:8000, backend:8000, host.docker.internal:8000</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sector-name">Nombre del Sector *</Label>
            <Input
              id="sector-name"
              placeholder="Ej: Playa Grande - Sector Norte"
              value={formData.sectorName}
              onChange={(e) => handleInputChange("sectorName", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inspection-date">Fecha de Inspección *</Label>
            <Input
              id="inspection-date"
              type="date"
              value={formData.inspectionDate}
              onChange={(e) => handleInputChange("inspectionDate", e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="id_usuario">Inspector Responsable *</Label>
                          <Select value={formData.id_usuario?.toString() || ""} onValueChange={(value) => handleInputChange("id_usuario", Number(value))}>
                <SelectTrigger id="id_usuario">
                  <SelectValue placeholder={dataLoading ? "Cargando..." : "Seleccionar inspector"} />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario.id_usuario} value={usuario.id_usuario.toString()}>
                      <div className="flex flex-col">
                        <span className="font-medium">{usuario.nombre}</span>
                        <span className="text-xs text-muted-foreground">{usuario.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {usuarios.length === 0 && !dataLoading && !error && (
                <p className="text-sm text-muted-foreground">No hay inspectores disponibles</p>
              )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="id_estado">Estado de Denuncia *</Label>
                          <Select value={formData.id_estado?.toString() || ""} onValueChange={(value) => handleInputChange("id_estado", Number(value))}>
                <SelectTrigger id="id_estado">
                  <SelectValue placeholder={dataLoading ? "Cargando..." : "Seleccionar estado"} />
                </SelectTrigger>
                <SelectContent>
                  {estados.map((estado) => (
                    <SelectItem key={estado.id_estado} value={estado.id_estado.toString()}>
                      {estado.estado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {estados.length === 0 && !dataLoading && !error && (
                <p className="text-sm text-muted-foreground">No hay estados disponibles</p>
              )}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fecha_ingreso">Fecha de Ingreso *</Label>
          <Input id="fecha_ingreso" value={formData.fecha_ingreso.slice(0, 10)} readOnly />
        </div>
        <div className="space-y-2">
          <Label htmlFor="observations">Observaciones Generales *</Label>
          <Textarea
            id="observations"
            placeholder="Ingrese observaciones generales sobre la inspección, condiciones climáticas, accesos, etc."
            className="min-h-[120px]"
            value={formData.observations}
            onChange={(e) => handleInputChange("observations", e.target.value)}
          />
        </div>

        <div className="flex justify-between pt-6">
          <Button variant="outline" disabled>
            Cancelar
          </Button>
          <Button onClick={handleNext} disabled={!canProceed || loading || dataLoading}>
            {loading ? "Guardando..." : "Siguiente"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

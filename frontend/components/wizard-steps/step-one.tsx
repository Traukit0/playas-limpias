"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { InspectionData } from "@/components/inspection-wizard"
import { useWizardAuth } from "@/lib/wizard-config"

interface StepOneProps {
  data: InspectionData
  updateData: (data: Partial<InspectionData>) => void
  setInspectionData: (data: any) => void // Nuevo: para guardar id_denuncia
  onNext: () => void
}

export function StepOne({ data, updateData, setInspectionData, onNext }: StepOneProps) {
  const { token, apiUrl, isAuthenticated } = useWizardAuth()
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
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState("")
  const [calendarOpen, setCalendarOpen] = useState(false)

  // Función optimizada para hacer fetch directo
  const fetchData = async (endpoint: string) => {
    const response = await fetch(`${apiUrl}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return await response.json()
  }

  useEffect(() => {
    // Cargar datos cuando el token esté disponible
    const cargarDatos = async () => {
      if (!token) return
      
      setLoadingData(true)
      setError("")
      
      try {
        // Cargar usuarios y estados en paralelo para mejor performance
        const [usuariosData, estadosData] = await Promise.all([
          fetchData('/usuarios/'),
          fetchData('/estados_denuncia/')
        ])
        
        setUsuarios(usuariosData)
        setEstados(estadosData)
      } catch (error) {
        console.error('Error al cargar datos:', error)
        setError(`Error al cargar datos: ${error instanceof Error ? error.message : 'Error desconocido'}`)
        setUsuarios([])
        setEstados([])
      } finally {
        setLoadingData(false)
      }
    }

    cargarDatos()
  }, [token, apiUrl]) // Dependencia en token y apiUrl para recargar cuando cambien

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    updateData({ [field]: value })
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      // Asegurar que la fecha se guarde correctamente sin problemas de zona horaria
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateString = `${year}-${month}-${day}`
      
      handleInputChange("inspectionDate", dateString)
      setCalendarOpen(false) // Cerrar el calendario después de seleccionar
    }
  }

  const canProceed =
    formData.sectorName &&
    formData.inspectionDate &&
    formData.id_usuario &&
    formData.id_estado &&
    formData.observations !== undefined &&
    formData.fecha_ingreso

  const handleNext = async () => {
    if (!token) {
      setError("No hay token de autenticación disponible")
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
      console.log('URL de la API:', `${apiUrl}/denuncias/`)
      
      const response = await fetch(`${apiUrl}/denuncias/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        throw new Error(`Error ${response.status}: ${response.statusText} - ${errorText}`)
      }
      
      const dataRes = await response.json()
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información General</CardTitle>
        <CardDescription>Ingrese los datos básicos de la inspección</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.inspectionDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.inspectionDate ? (
                    format(new Date(formData.inspectionDate + 'T00:00:00'), "PPP", { locale: es })
                  ) : (
                    <span>Seleccionar fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.inspectionDate ? new Date(formData.inspectionDate + 'T00:00:00') : undefined}
                  onSelect={handleDateChange}
                  disabled={(date) => {
                    // Obtener la fecha de hoy en la zona horaria local
                    const today = new Date()
                    const todayYear = today.getFullYear()
                    const todayMonth = today.getMonth()
                    const todayDay = today.getDate()
                    
                    // Comparar con la fecha seleccionada
                    const selectedYear = date.getFullYear()
                    const selectedMonth = date.getMonth()
                    const selectedDay = date.getDate()
                    
                    // Deshabilitar fechas futuras
                    if (selectedYear > todayYear) return true
                    if (selectedYear === todayYear && selectedMonth > todayMonth) return true
                    if (selectedYear === todayYear && selectedMonth === todayMonth && selectedDay > todayDay) return true
                    
                    return false
                  }}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Solo se permiten fechas hasta el día de hoy
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="id_usuario">Inspector Responsable *</Label>
            <Select 
              value={formData.id_usuario?.toString() || ""} 
              onValueChange={(value) => handleInputChange("id_usuario", Number(value))}
              disabled={loadingData}
            >
              <SelectTrigger id="id_usuario">
                <SelectValue placeholder={loadingData ? "Cargando..." : "Seleccionar inspector"} />
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="id_estado">Estado de Denuncia *</Label>
            <Select 
              value={formData.id_estado?.toString() || ""} 
              onValueChange={(value) => handleInputChange("id_estado", Number(value))}
              disabled={loadingData}
            >
              <SelectTrigger id="id_estado">
                <SelectValue placeholder={loadingData ? "Cargando..." : "Seleccionar estado"} />
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
        {error && <div className="text-red-500">{error}</div>}
        <div className="flex justify-between pt-6">
          <Button variant="outline" disabled>
            Cancelar
          </Button>
          <Button onClick={handleNext} disabled={!canProceed || loading || !isAuthenticated || loadingData}>
            {loading ? "Guardando..." : "Siguiente"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

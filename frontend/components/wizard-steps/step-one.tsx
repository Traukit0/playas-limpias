"use client"

import { useState, useEffect } from "react"
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

// TODO: Reemplazar por gestión de sesión/usuario en el futuro
const API_TOKEN = "testtoken123"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function StepOne({ data, updateData, setInspectionData, onNext }: StepOneProps) {
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

  useEffect(() => {
    // Cargar usuarios
    fetch(`${API_BASE_URL}/usuarios/`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` }
    })
      .then(res => {
        if (!res.ok) {
          console.error('Error cargando usuarios:', res.status, res.statusText)
          throw new Error(`Error ${res.status}: ${res.statusText}`)
        }
        return res.json()
      })
      .then(setUsuarios)
      .catch((error) => {
        console.error('Error al cargar usuarios:', error)
        setUsuarios([])
      })
    
    // Cargar estados
    fetch(`${API_BASE_URL}/estados_denuncia/`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` }
    })
      .then(res => {
        if (!res.ok) {
          console.error('Error cargando estados:', res.status, res.statusText)
          throw new Error(`Error ${res.status}: ${res.statusText}`)
        }
        return res.json()
      })
      .then(setEstados)
      .catch((error) => {
        console.error('Error al cargar estados:', error)
        setEstados([])
      })
  }, [])

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
      const res = await fetch("/denuncias/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_TOKEN}`
        },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Error al crear la inspección")
      const dataRes = await res.json()
      setInspectionData((prev: any) => ({ ...prev, ...body, id_denuncia: dataRes.id_denuncia }))
      onNext()
    } catch (e: any) {
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
                <SelectValue placeholder="Seleccionar inspector" />
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
            <Select value={formData.id_estado?.toString() || ""} onValueChange={(value) => handleInputChange("id_estado", Number(value))}>
              <SelectTrigger id="id_estado">
                <SelectValue placeholder="Seleccionar estado" />
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
          <Button onClick={handleNext} disabled={!canProceed || loading}>
            {loading ? "Guardando..." : "Siguiente"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
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
  onNext: () => void
}

const inspectors = [
  { id: "1", name: "Carlos Mendoza", email: "carlos.mendoza@ejemplo.com" },
  { id: "2", name: "María López", email: "maria.lopez@ejemplo.com" },
  { id: "3", name: "Juan Pérez", email: "juan.perez@ejemplo.com" },
  { id: "4", name: "Ana Gómez", email: "ana.gomez@ejemplo.com" },
  { id: "5", name: "Roberto Sánchez", email: "roberto.sanchez@ejemplo.com" },
]

export function StepOne({ data, updateData, onNext }: StepOneProps) {
  const [formData, setFormData] = useState({
    sectorName: data.sectorName,
    inspectionDate: data.inspectionDate,
    inspector: data.inspector,
    observations: data.observations,
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    updateData({ [field]: value })
  }

  const canProceed = formData.sectorName && formData.inspectionDate && formData.inspector

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

        <div className="space-y-2">
          <Label htmlFor="inspector">Inspector Responsable *</Label>
          <Select value={formData.inspector} onValueChange={(value) => handleInputChange("inspector", value)}>
            <SelectTrigger id="inspector">
              <SelectValue placeholder="Seleccionar inspector" />
            </SelectTrigger>
            <SelectContent>
              {inspectors.map((inspector) => (
                <SelectItem key={inspector.id} value={inspector.name}>
                  <div className="flex flex-col">
                    <span className="font-medium">{inspector.name}</span>
                    <span className="text-xs text-muted-foreground">{inspector.email}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="observations">Observaciones Generales</Label>
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
          <Button onClick={onNext} disabled={!canProceed}>
            Siguiente
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import { Eye, FileDown, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

const inspections = [
  {
    id: "INS-001",
    date: "2023-08-15",
    inspector: "Carlos Mendoza",
    location: "Playa Grande",
    type: "Rutinaria",
    status: "Completada",
  },
  {
    id: "INS-002",
    date: "2023-08-12",
    inspector: "María López",
    location: "Playa Azul",
    type: "Emergencia",
    status: "Completada",
  },
  {
    id: "INS-003",
    date: "2023-08-10",
    inspector: "Juan Pérez",
    location: "Playa del Sol",
    type: "Rutinaria",
    status: "Pendiente",
  },
  {
    id: "INS-004",
    date: "2023-08-05",
    inspector: "Ana Gómez",
    location: "Playa Dorada",
    type: "Seguimiento",
    status: "Completada",
  },
  {
    id: "INS-005",
    date: "2023-08-01",
    inspector: "Roberto Sánchez",
    location: "Playa Hermosa",
    type: "Rutinaria",
    status: "Completada",
  },
]

export function RecentInspections() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredInspections = inspections.filter(
    (inspection) =>
      inspection.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.inspector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input
            placeholder="Buscar inspección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9"
          />
          <Button size="sm" variant="ghost" className="h-9 px-2">
            <Search className="h-4 w-4" />
            <span className="sr-only">Buscar</span>
          </Button>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select defaultValue="all">
            <SelectTrigger className="h-9 w-full sm:w-[150px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="routine">Rutinaria</SelectItem>
              <SelectItem value="emergency">Emergencia</SelectItem>
              <SelectItem value="follow-up">Seguimiento</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="h-9 w-full sm:w-[150px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="completed">Completada</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Inspector</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInspections.map((inspection) => (
              <TableRow key={inspection.id}>
                <TableCell className="font-medium">{inspection.id}</TableCell>
                <TableCell>{inspection.date}</TableCell>
                <TableCell>{inspection.inspector}</TableCell>
                <TableCell>{inspection.location}</TableCell>
                <TableCell>{inspection.type}</TableCell>
                <TableCell>
                  <Badge variant={inspection.status === "Completada" ? "default" : "secondary"}>
                    {inspection.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Ver detalles</span>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <FileDown className="h-4 w-4" />
                    <span className="sr-only">Descargar</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, FileDown, Search, Loader2, AlertCircle, Download, FileText, MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useHistorial } from "@/hooks/useHistorial"
import { HistorialStats } from "@/components/historial-stats"

// Estados de denuncia para mapear IDs a nombres según la base de datos
const ESTADOS_DENUNCIA = {
  1: "Ingresada",
  2: "En proceso",
  3: "Terminada"
}

export function RecentInspections() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const { denuncias, loading, error, total } = useHistorial()

  const handleViewDenuncia = (idDenuncia: number) => {
    router.push(`/denuncia/${idDenuncia}`)
  }

  const handleExportHistorial = () => {
    const csvContent = [
      ['ID', 'Fecha Inspección', 'Fecha Ingreso', 'Lugar', 'Estado', 'Observaciones'],
      ...filteredDenuncias.map(denuncia => [
        denuncia.id_denuncia.toString(),
        new Date(denuncia.fecha_inspeccion).toLocaleDateString('es-CL'),
        new Date(denuncia.fecha_ingreso).toLocaleDateString('es-CL'),
        denuncia.lugar || 'Sin ubicación',
        ESTADOS_DENUNCIA[denuncia.id_estado as keyof typeof ESTADOS_DENUNCIA] || 'Desconocido',
        denuncia.observaciones || ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `historial_denuncias_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const generarNombreArchivo = (idDenuncia: number, lugar: string | null, tipo: 'pdf' | 'kmz') => {
    const lugarLimpio = (lugar || 'Sin_Lugar')
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remover caracteres especiales
      .replace(/\s+/g, '_') // Reemplazar espacios con guiones bajos
      .trim()
    
    return `denuncia_${idDenuncia}_${lugarLimpio}_${tipo}.${tipo}`
  }

  const descargarReporte = async (idDenuncia: number, lugar: string | null, tipo: 'pdf' | 'kmz') => {
    try {
      // Primero necesitamos obtener el análisis asociado a la denuncia
      const response = await fetch(`http://localhost:8000/denuncias/${idDenuncia}/detalles`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Error al obtener detalles de la denuncia: ${response.statusText}`)
      }

      const denunciaData = await response.json()
      const analisisId = denunciaData.analisis[0]?.id_analisis

      if (!analisisId) {
        console.error('No hay análisis disponible para descargar')
        return
      }

      // Ahora descargamos el archivo usando el endpoint correcto
      const downloadResponse = await fetch(`http://localhost:8000/analisis/${analisisId}/${tipo}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      if (!downloadResponse.ok) {
        throw new Error(`Error al descargar ${tipo}: ${downloadResponse.statusText}`)
      }

      const blob = await downloadResponse.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = generarNombreArchivo(idDenuncia, lugar, tipo)
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

    } catch (error) {
      console.error(`Error al descargar ${tipo}:`, error)
    }
  }

  const getStatusBadgeVariant = (statusId: number) => {
    switch (statusId) {
      case 1: return "secondary" // Ingresada
      case 2: return "default"   // En proceso
      case 3: return "default"   // Terminada
      default: return "secondary"
    }
  }

  const filteredDenuncias = denuncias.filter((denuncia) => {
    const matchesSearch = 
      (denuncia.lugar?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      denuncia.id_denuncia.toString().includes(searchTerm) ||
      denuncia.observaciones?.toLowerCase().includes(searchTerm.toLowerCase()) || false
    
    const matchesStatus = statusFilter === "all" || denuncia.id_estado.toString() === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Mostrar loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando historial...</span>
        </div>
      </div>
    )
  }

  // Mostrar error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error al cargar el historial: {error}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <HistorialStats denuncias={denuncias} />
      
      {/* Header con estadísticas */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Lista de Denuncias</h2>
          <p className="text-sm text-muted-foreground">
            Total: {total} denuncias • Mostrando: {filteredDenuncias.length}
          </p>
        </div>
        <Button 
          onClick={handleExportHistorial}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input
            placeholder="Buscar por lugar, ID o observaciones..."
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-full sm:w-[150px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
                          <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="1">Ingresada</SelectItem>
                <SelectItem value="2">En proceso</SelectItem>
                <SelectItem value="3">Terminada</SelectItem>
              </SelectContent>
          </Select>
        </div>
      </div>
      {/* Tabla de denuncias */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Fecha Inspección</TableHead>
              <TableHead>Fecha Ingreso</TableHead>
              <TableHead>Lugar</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Puntos GPS</TableHead>
              <TableHead>Concesiones</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDenuncias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  {searchTerm || statusFilter !== "all" 
                    ? "No se encontraron denuncias con los filtros aplicados" 
                    : "No hay denuncias registradas"}
                </TableCell>
              </TableRow>
            ) : (
                              filteredDenuncias.map((denuncia) => (
                  <TableRow key={denuncia.id_denuncia}>
                    <TableCell className="font-medium">
                      #{denuncia.id_denuncia}
                    </TableCell>
                    <TableCell>
                      {new Date(denuncia.fecha_inspeccion).toLocaleDateString('es-CL')}
                    </TableCell>
                    <TableCell>
                      {new Date(denuncia.fecha_ingreso).toLocaleDateString('es-CL')}
                    </TableCell>
                    <TableCell>
                      {denuncia.lugar || 'Sin ubicación'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{denuncia.usuario?.nombre || 'N/A'}</div>
                        <div className="text-muted-foreground">{denuncia.usuario?.email || 'N/A'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{denuncia.total_evidencias || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{denuncia.total_concesiones_afectadas || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(denuncia.id_estado)}>
                        {ESTADOS_DENUNCIA[denuncia.id_estado as keyof typeof ESTADOS_DENUNCIA] || 'Desconocido'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleViewDenuncia(denuncia.id_denuncia)}
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Ver detalles</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => descargarReporte(denuncia.id_denuncia, denuncia.lugar, 'pdf')}
                          title="Descargar PDF"
                        >
                          <FileText className="h-4 w-4" />
                          <span className="sr-only">Descargar PDF</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => descargarReporte(denuncia.id_denuncia, denuncia.lugar, 'kmz')}
                          title="Descargar KMZ"
                        >
                          <MapPin className="h-4 w-4" />
                          <span className="sr-only">Descargar KMZ</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

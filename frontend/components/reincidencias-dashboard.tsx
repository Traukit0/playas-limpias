"use client"

import { useState } from "react"
import { useReincidencias } from "@/hooks/useReincidencias"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReincidenciasCharts } from "@/components/reincidencias-charts"
import { 
  AlertTriangle, 
  Building2, 
  MapPin, 
  FileText, 
  TrendingUp, 
  Loader2, 
  AlertCircle,
  Search,
  Filter,
  BarChart3,
  Target,
  Shield,
  Clock,
  Calendar,
  ArrowLeft
} from "lucide-react"

export function ReincidenciasDashboard() {
  const { reincidencias, loading, error, estadisticas } = useReincidencias()
  const [searchTerm, setSearchTerm] = useState("")
  const [riesgoFilter, setRiesgoFilter] = useState("all")
  const [sortBy, setSortBy] = useState("denuncias_count")

  // Filtrar y ordenar reincidencias
  const filteredReincidencias = reincidencias
    .filter(item => {
      const matchesSearch = item.titular.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.centros_denunciados.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRiesgo = riesgoFilter === "all" || item.riesgo_level === riesgoFilter
      return matchesSearch && matchesRiesgo
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "denuncias_count":
          return b.denuncias_count - a.denuncias_count
        case "centros_count":
          return b.centros_count - a.centros_count
        case "titular":
          return a.titular.localeCompare(b.titular)
        case "riesgo":
          const riesgoOrder = { alto: 3, medio: 2, bajo: 1 }
          return riesgoOrder[b.riesgo_level] - riesgoOrder[a.riesgo_level]
        default:
          return 0
      }
    })

  const getRiesgoColor = (riesgo: string) => {
    switch (riesgo) {
      case 'alto': return 'bg-red-100 text-red-800 border-red-200'
      case 'medio': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'bajo': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRiesgoIcon = (riesgo: string) => {
    switch (riesgo) {
      case 'alto': return <AlertTriangle className="h-4 w-4" />
      case 'medio': return <Target className="h-4 w-4" />
      case 'bajo': return <Shield className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  // Mostrar loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando análisis de reincidencias...</span>
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
          Error al cargar el análisis de reincidencias: {error}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con descripción */}
      <div className="flex items-center justify-between">
        <div className="text-center space-y-2 flex-1">
          <h2 className="text-2xl font-bold">Análisis de Empresas Reincidentes</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Identificación y seguimiento de empresas cuyos centros de cultivo están involucrados en múltiples denuncias 
            a través de análisis geoespaciales. Este sistema permite detectar patrones de reincidencia y priorizar 
            acciones de fiscalización.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>

      {/* Estadísticas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{estadisticas.total_empresas}</div>
            <p className="text-xs text-muted-foreground">
              Empresas con denuncias
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Centros Afectados</CardTitle>
            <MapPin className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{estadisticas.total_centros}</div>
            <p className="text-xs text-muted-foreground">
              Centros de cultivo involucrados
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Denuncias</CardTitle>
            <FileText className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{estadisticas.total_denuncias}</div>
            <p className="text-xs text-muted-foreground">
              Denuncias registradas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{estadisticas.promedio_denuncias_por_empresa}</div>
            <p className="text-xs text-muted-foreground">
              Denuncias por empresa
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribución por nivel de riesgo */}
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Clasificación por Nivel de Riesgo</h3>
          <p className="text-sm text-muted-foreground">
            La clasificación se basa en el número total de denuncias y la densidad de denuncias por centro de cultivo
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-red-50 border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Alto Riesgo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-800">{estadisticas.empresas_alto_riesgo}</div>
              <p className="text-xs text-red-600">5+ denuncias, ratio ≥2, o 4+ centros</p>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-800 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Medio Riesgo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-800">{estadisticas.empresas_medio_riesgo}</div>
              <p className="text-xs text-yellow-600">3-4 denuncias, ratio ≥1, o 2-3 centros</p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Bajo Riesgo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800">{estadisticas.empresas_bajo_riesgo}</div>
              <p className="text-xs text-green-600">1-2 denuncias, ratio &lt;1, y &lt;2 centros</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por empresa o centro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={riesgoFilter} onValueChange={setRiesgoFilter}>
                <SelectTrigger className="h-9 w-full sm:w-[150px]">
                  <SelectValue placeholder="Nivel de riesgo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los niveles</SelectItem>
                  <SelectItem value="alto">Alto riesgo</SelectItem>
                  <SelectItem value="medio">Medio riesgo</SelectItem>
                  <SelectItem value="bajo">Bajo riesgo</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-9 w-full sm:w-[150px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="denuncias_count">Más denuncias</SelectItem>
                  <SelectItem value="centros_count">Más centros</SelectItem>
                  <SelectItem value="riesgo">Nivel de riesgo</SelectItem>
                  <SelectItem value="titular">Nombre empresa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs para diferentes vistas */}
      <Tabs defaultValue="tabla" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tabla" className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            Vista Tabla
          </TabsTrigger>
          <TabsTrigger value="tarjetas" className="flex items-center gap-2">
            <Card className="h-4 w-4" />
            Vista Tarjetas
          </TabsTrigger>
          <TabsTrigger value="graficos" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Gráficos
          </TabsTrigger>
        </TabsList>

        {/* Vista Tabla */}
        <TabsContent value="tabla">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Empresas Reincidentes</CardTitle>
                <CardDescription>
                  Mostrando {filteredReincidencias.length} de {reincidencias.length} empresas
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Nivel de Riesgo</TableHead>
                      <TableHead>Centros</TableHead>
                      <TableHead>Denuncias</TableHead>
                      <TableHead>Códigos de Centros</TableHead>
                      <TableHead>Última Denuncia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReincidencias.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No se encontraron empresas con los filtros aplicados
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReincidencias.map((item, index) => (
                        <TableRow key={index} className="hover:bg-muted/50">
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.titular}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.region} • {item.tipo_principal}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRiesgoColor(item.riesgo_level)}>
                              <div className="flex items-center gap-1">
                                {getRiesgoIcon(item.riesgo_level)}
                                {item.riesgo_level.toUpperCase()}
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">{item.centros_count}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">{item.denuncias_count}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate text-sm text-muted-foreground">
                              {item.centros_denunciados}
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.ultima_denuncia ? (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(item.ultima_denuncia).toLocaleDateString('es-CL')}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vista Tarjetas */}
        <TabsContent value="tarjetas">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredReincidencias.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No se encontraron empresas con los filtros aplicados
              </div>
            ) : (
              filteredReincidencias.map((item, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{item.titular}</CardTitle>
                      <Badge className={getRiesgoColor(item.riesgo_level)}>
                        {getRiesgoIcon(item.riesgo_level)}
                      </Badge>
                    </div>
                    <CardDescription>
                      {item.region} • {item.tipo_principal}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{item.centros_count}</div>
                        <div className="text-xs text-muted-foreground">Centros</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{item.denuncias_count}</div>
                        <div className="text-xs text-muted-foreground">Denuncias</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Códigos de Centros:</div>
                      <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                        {item.centros_denunciados}
                      </div>
                    </div>

                    {item.ultima_denuncia && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Última: {new Date(item.ultima_denuncia).toLocaleDateString('es-CL')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Vista Gráficos */}
        <TabsContent value="graficos">
          <ReincidenciasCharts reincidencias={reincidencias} estadisticas={estadisticas} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

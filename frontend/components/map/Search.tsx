"use client"

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Search as SearchIcon, X, Filter, MapPin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { useGeocoding } from '@/hooks/useGeocoding'

interface SearchFilters {
  dateRange: {
    start: string
    end: string
  } | null
  region: string
  status: string
  type: string
}

interface SearchProps {
  onSearch: (term: string) => void
  onFilter: (filters: SearchFilters) => void
  onLocationSelect?: (coordinates: [number, number], bbox?: [number, number, number, number]) => void
}

export function Search({ onSearch, onFilter, onLocationSelect }: SearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({
    dateRange: null,
    region: '',
    status: '',
    type: ''
  })
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [showGeocodingResults, setShowGeocodingResults] = useState(false)
  
  const { loading: geocodingLoading, results: geocodingResults, searchLosLagosPlaces, clearResults } = useGeocoding()
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  // Búsqueda con geocodificación automática
  const handleSearchInput = useCallback((value: string) => {
    setSearchTerm(value)
    setShowGeocodingResults(true)
    
    // Limpiar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // Búsqueda con delay para evitar demasiadas peticiones
    if (value.trim().length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        searchLosLagosPlaces(value.trim())
      }, 500)
    } else {
      clearResults()
    }
  }, [searchLosLagosPlaces, clearResults])

  const handleSearch = useCallback(() => {
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim())
      setShowGeocodingResults(false)
    }
  }, [searchTerm, onSearch])

  const handleLocationSelect = useCallback((coordinates: [number, number], bbox?: [number, number, number, number]) => {
    onLocationSelect?.(coordinates, bbox)
    setShowGeocodingResults(false)
    setSearchTerm('')
    clearResults()
  }, [onLocationSelect, clearResults])

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const handleFilterChange = useCallback((key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    
    // Actualizar filtros activos
    const newActiveFilters: string[] = []
    if (newFilters.dateRange) newActiveFilters.push('Fecha')
    if (newFilters.region) newActiveFilters.push('Región')
    if (newFilters.status) newActiveFilters.push('Estado')
    if (newFilters.type) newActiveFilters.push('Tipo')
    
    setActiveFilters(newActiveFilters)
    onFilter(newFilters)
  }, [filters, onFilter])

  const clearFilters = useCallback(() => {
    setFilters({
      dateRange: null,
      region: '',
      status: '',
      type: ''
    })
    setActiveFilters([])
    onFilter({
      dateRange: null,
      region: '',
      status: '',
      type: ''
    })
  }, [onFilter])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }, [handleSearch])

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 z-10 min-w-96">
      <div className="flex space-x-2">
        {/* Búsqueda principal */}
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por lugar, denuncia, concesión..."
            value={searchTerm}
            onChange={(e) => handleSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10 pr-4"
          />
          
          {/* Resultados de geocodificación */}
          {showGeocodingResults && (geocodingResults.length > 0 || geocodingLoading) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              {geocodingLoading ? (
                <div className="p-4 text-center">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Buscando lugares...</p>
                </div>
              ) : (
                <div className="py-2">
                  {geocodingResults.map((result) => (
                    <Card key={result.id} className="m-2 border-0 shadow-none hover:bg-gray-50 cursor-pointer">
                      <CardContent className="p-3" onClick={() => handleLocationSelect(result.coordinates, result.bbox)}>
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {result.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {result.properties?.city && `${result.properties.city}, `}
                              {result.properties?.state && `${result.properties.state}, `}
                              {result.properties?.country}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Botón de búsqueda */}
        <Button onClick={handleSearch} className="px-4">
          Buscar
        </Button>
        
        {/* Filtros */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {activeFilters.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Filtros</h4>
                {activeFilters.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Limpiar
                  </Button>
                )}
              </div>
              
              {/* Rango de fechas */}
              <div className="space-y-2">
                <Label>Rango de fechas</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={filters.dateRange?.start || ''}
                    onChange={(e) => handleFilterChange('dateRange', {
                      ...filters.dateRange,
                      start: e.target.value
                    })}
                    placeholder="Desde"
                  />
                  <Input
                    type="date"
                    value={filters.dateRange?.end || ''}
                    onChange={(e) => handleFilterChange('dateRange', {
                      ...filters.dateRange,
                      end: e.target.value
                    })}
                    placeholder="Hasta"
                  />
                </div>
              </div>
              
              {/* Región */}
              <div className="space-y-2">
                <Label>Región</Label>
                <Select
                  value={filters.region}
                  onValueChange={(value) => handleFilterChange('region', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar región" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="los-lagos">Los Lagos</SelectItem>
                    <SelectItem value="chiloe">Chiloé</SelectItem>
                    <SelectItem value="osorno">Osorno</SelectItem>
                    <SelectItem value="llanquihue">Llanquihue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Estado */}
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en-proceso">En Proceso</SelectItem>
                    <SelectItem value="completado">Completado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Tipo */}
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={filters.type}
                  onValueChange={(value) => handleFilterChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="denuncia">Denuncia</SelectItem>
                    <SelectItem value="evidencia">Evidencia</SelectItem>
                    <SelectItem value="concesion">Concesión</SelectItem>
                    <SelectItem value="analisis">Análisis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Filtros activos */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {activeFilters.map(filter => (
            <Badge key={filter} variant="outline" className="text-xs">
              {filter}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Search as SearchIcon, X, Building2, FileText, AlertTriangle, BarChart3 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSearch } from '@/hooks/useSearch'

interface SearchProps {
  onSearch: (term: string) => void
  onFilter: (filters: any) => void
  onLocationSelect: (coordinates: [number, number], bbox?: [number, number, number, number]) => void
}

export function Search({ onSearch, onFilter, onLocationSelect }: SearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  
  const { 
    search, 
    clearResults,
    results, 
    loading, 
    error 
  } = useSearch()

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = () => {
    if (searchTerm.trim()) {
      search(searchTerm.trim())
      setIsOpen(true)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleResultSelect = (result: any) => {
    if (result.geometry) {
      // Si es una concesión o análisis con geometría, centrar el mapa
      try {
        const geom = JSON.parse(result.geometry)
        if (geom.coordinates && geom.coordinates[0] && geom.coordinates[0][0]) {
          const coords = geom.coordinates[0][0]
          const center = coords.reduce(
            (acc: [number, number], coord: [number, number]) => [
              acc[0] + coord[0],
              acc[1] + coord[1]
            ],
            [0, 0]
          ).map((val: number) => val / coords.length)
          
          onLocationSelect(center as [number, number])
        }
      } catch (e) {
        console.error('Error parsing geometry:', e)
      }
    }
  }

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20" ref={searchRef}>
      <div className="relative">
        <div className="flex items-center space-x-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border-2 border-gray-200 hover:border-blue-400 transition-all duration-200 p-2">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Buscar centro de cultivo, titular, lugar de denuncia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="border-0 bg-transparent focus:ring-0 focus:border-0 text-gray-700 placeholder-gray-500 font-medium"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  clearResults()
                  setIsOpen(false)
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
              >
                <X className="h-3 w-3 text-gray-500" />
              </Button>
            )}
          </div>
          
          <Button
            onClick={handleSearch}
            disabled={loading || !searchTerm.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-md shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Buscando...</span>
              </div>
            ) : (
              <span>Buscar</span>
            )}
          </Button>
        </div>

        {/* Resultados de búsqueda */}
        {isOpen && results && (
          <Card className="absolute top-full mt-3 w-[500px] max-h-96 overflow-y-auto bg-white/95 backdrop-blur-sm shadow-xl border-2 border-gray-200 rounded-lg">
            <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
                <SearchIcon className="h-5 w-5 text-blue-600" />
                Resultados para "{results.query}"
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-4">
              {/* Análisis */}
              {results.analisis && results.analisis.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                    Análisis ({results.total_analisis})
                  </h4>
                  {results.analisis.map((analisis, index) => (
                    <div 
                      key={index} 
                      className="p-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 rounded-lg cursor-pointer border-l-4 border-purple-500 mb-3 shadow-sm hover:shadow-md transition-all duration-200"
                      onClick={() => handleResultSelect(analisis)}
                    >
                      <p className="font-bold text-sm text-gray-800 mb-1">📊 Análisis #{analisis.id_analisis}</p>
                      <p className="text-xs text-gray-600 mb-2">
                        <span className="font-semibold">Lugar:</span> {analisis.lugar}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                        <p><span className="font-semibold">Método:</span> {analisis.metodo}</p>
                        <p><span className="font-semibold">Buffer:</span> {analisis.distancia_buffer}m</p>
                      </div>
                      {analisis.fecha_analisis && (
                        <p className="text-xs text-gray-600 mb-2">
                          <span className="font-semibold">Fecha:</span> {new Date(analisis.fecha_analisis).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Denuncias */}
              {results.denuncias.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-red-600" />
                    Denuncias ({results.total_denuncias})
                  </h4>
                  {results.denuncias.map((denuncia, index) => (
                    <div key={index} className="p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border-l-4 border-red-500 mb-3 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <p className="font-bold text-sm text-gray-800 mb-1">{denuncia.lugar}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                        <p><span className="font-semibold">Fecha:</span> {new Date(denuncia.fecha_inspeccion).toLocaleDateString()}</p>
                        <p><span className="font-semibold">Estado:</span> {denuncia.estado}</p>
                      </div>
                      <p className="text-xs text-gray-500 bg-white/50 p-2 rounded border">
                        <span className="font-semibold">{denuncia.evidencias_count}</span> evidencias, <span className="font-semibold">{denuncia.concesiones_afectadas_count}</span> centros afectados
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reincidencias */}
              {results.reincidencias.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    Reincidencias ({results.total_reincidencias})
                  </h4>
                  {results.reincidencias.map((reincidencia, index) => (
                    <div key={index} className="p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border-l-4 border-orange-500 mb-3 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <p className="font-bold text-sm text-gray-800 mb-1">{reincidencia.titular}</p>
                      <p className="text-xs text-gray-600 mb-2">
                        <span className="font-semibold">{reincidencia.centros_count}</span> centros, <span className="font-semibold">{reincidencia.denuncias_count}</span> denuncias
                      </p>
                      <p className="text-xs text-gray-500 bg-white/50 p-2 rounded border">
                        <span className="font-semibold">Centros:</span> {reincidencia.centros_denunciados}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Concesiones */}
              {results.concesiones.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    Centros de Cultivo ({results.total_concesiones})
                  </h4>
                                     {results.concesiones.map((concesion, index) => (
                     <div 
                       key={index} 
                       className="p-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-lg cursor-pointer border-l-4 border-blue-500 mb-3 shadow-sm hover:shadow-md transition-all duration-200"
                       onClick={() => handleResultSelect(concesion)}
                     >
                       <p className="font-bold text-sm text-gray-800 mb-1">{concesion.nombre || `Centro ${concesion.codigo_centro}`}</p>
                       <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                         <p><span className="font-semibold">Código:</span> {concesion.codigo_centro}</p>
                         <p><span className="font-semibold">Tipo:</span> {concesion.tipo}</p>
                       </div>
                       <p className="text-xs text-gray-600 mb-2"><span className="font-semibold">Titular:</span> {concesion.titular}</p>
                       {concesion.denuncias_count > 0 && (
                         <Badge variant="destructive" className="text-xs px-2 py-1 font-semibold">
                           {concesion.denuncias_count} denuncia(s)
                         </Badge>
                       )}
                     </div>
                   ))}
                </div>
              )}

              {/* Denuncias */}
              {results.denuncias.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-red-600" />
                    Denuncias ({results.total_denuncias})
                  </h4>
                                     {results.denuncias.map((denuncia, index) => (
                     <div key={index} className="p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border-l-4 border-red-500 mb-3 shadow-sm hover:shadow-md transition-shadow duration-200">
                       <p className="font-bold text-sm text-gray-800 mb-1">{denuncia.lugar}</p>
                       <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                         <p><span className="font-semibold">Fecha:</span> {new Date(denuncia.fecha_inspeccion).toLocaleDateString()}</p>
                         <p><span className="font-semibold">Estado:</span> {denuncia.estado}</p>
                       </div>
                       <p className="text-xs text-gray-500 bg-white/50 p-2 rounded border">
                         <span className="font-semibold">{denuncia.evidencias_count}</span> evidencias, <span className="font-semibold">{denuncia.concesiones_afectadas_count}</span> centros afectados
                       </p>
                     </div>
                   ))}
                </div>
              )}

                             {(!results.analisis || results.total_analisis === 0) && results.total_concesiones === 0 && results.total_denuncias === 0 && results.total_reincidencias === 0 && (
                 <div className="text-center py-8 text-gray-500">
                   <div className="flex flex-col items-center space-y-2">
                     <SearchIcon className="h-12 w-12 text-gray-300" />
                     <p className="font-medium text-gray-600">No se encontraron resultados</p>
                     <p className="text-sm text-gray-400">Intenta con otros términos de búsqueda</p>
                   </div>
                 </div>
               )}
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card className="absolute top-full mt-2 w-80 bg-red-50 border-red-200">
            <CardContent className="p-2">
              <p className="text-sm text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

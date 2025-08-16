"use client"

import React, { useState } from 'react'
import { ChevronUp, ChevronDown, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'

interface Layer {
  id: string
  name: string
  type: 'evidencias' | 'concesiones' | 'analisis'
  color: string
  icon: string
  description?: string
  count?: number
}

interface LegendProps {
  layers: Layer[]
}

export function Legend({ layers }: LegendProps) {
  const [isOpen, setIsOpen] = useState(true)

  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'evidencias':
        return '📍'
      case 'concesiones':
        return '🏭'
      case 'analisis':
        return '📊'
      default:
        return '🗺️'
    }
  }

  const getLayerDescription = (type: string) => {
    switch (type) {
      case 'evidencias':
        return 'Evidencias fotográficas con coordenadas GPS'
      case 'concesiones':
        return 'Áreas de concesiones acuícolas'
      case 'analisis':
        return 'Análisis geoespaciales realizados'
      default:
        return 'Capa de información geográfica'
    }
  }

  const getLayerColor = (type: string) => {
    switch (type) {
      case 'evidencias':
        return '#4ECDC4'
      case 'concesiones':
        return '#FFD93D'
      case 'analisis':
        return '#6C5CE7'
      default:
        return '#666'
    }
  }

  const getLayerStyle = (type: string) => {
    switch (type) {
      case 'evidencias':
        return 'circle'
      case 'concesiones':
        return 'polygon'
      case 'analisis':
        return 'polygon'
      default:
        return 'circle'
    }
  }

  return (
    <div className="absolute bottom-20 left-4 bg-white rounded-lg shadow-lg p-4 z-10 max-w-xs">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <div className="flex items-center space-x-2">
              <Info className="h-4 w-4" />
              <span className="font-semibold">Leyenda</span>
            </div>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-3 space-y-3">
          {layers.map(layer => (
            <div key={layer.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getLayerIcon(layer.type)}</span>
                  <span className="text-sm font-medium">{layer.name}</span>
                </div>
                {layer.count !== undefined && (
                  <Badge variant="secondary" className="text-xs">
                    {layer.count}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Símbolo visual */}
                <div className="flex items-center justify-center w-6 h-6">
                  {getLayerStyle(layer.type) === 'circle' ? (
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: getLayerColor(layer.type) }}
                    />
                  ) : (
                    <div 
                      className="w-4 h-4 border-2 border-white shadow-sm"
                      style={{ 
                        backgroundColor: getLayerColor(layer.type),
                        opacity: 0.7
                      }}
                    />
                  )}
                </div>
                
                {/* Descripción */}
                <span className="text-xs text-gray-600 flex-1">
                  {getLayerDescription(layer.type)}
                </span>
              </div>
              
              {/* Información adicional */}
              {layer.description && (
                <p className="text-xs text-gray-500 pl-8">
                  {layer.description}
                </p>
              )}
            </div>
          ))}
          
          {layers.length === 0 && (
            <div className="text-center text-gray-500 text-sm py-4">
              No hay capas para mostrar en la leyenda
            </div>
          )}
          
          {/* Tipos de concesiones */}
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500 font-medium mb-2">
              Tipos de Concesiones:
            </p>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 border border-white shadow-sm" style={{ backgroundColor: '#FF6B6B' }}></div>
                <span className="text-xs text-gray-600">Moluscos</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 border border-white shadow-sm" style={{ backgroundColor: '#4ECDC4' }}></div>
                <span className="text-xs text-gray-600">Salmones</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 border border-white shadow-sm" style={{ backgroundColor: '#FFD93D' }}></div>
                <span className="text-xs text-gray-600">Abalones o Equinodermos</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 border border-white shadow-sm" style={{ backgroundColor: '#6C5CE7' }}></div>
                <span className="text-xs text-gray-600">Algas</span>
              </div>
            </div>
          </div>

          {/* Información general */}
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              <strong>Tipos de símbolos:</strong>
            </p>
            <div className="mt-1 space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-xs text-gray-600">Puntos (evidencias)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 opacity-70"></div>
                <span className="text-xs text-gray-600">Áreas (concesiones, análisis)</span>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

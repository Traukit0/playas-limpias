"use client"

import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Eye, EyeOff, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'

interface Layer {
  id: string
  name: string
  visible: boolean
  type: 'evidencias' | 'concesiones' | 'analisis'
  color: string
  icon: string
  count?: number
}

interface LayerControlProps {
  layers: Layer[]
  visibleLayers: Set<string>
  onLayerToggle: (layerId: string) => void
}

export function LayerControl({ layers, visibleLayers, onLayerToggle }: LayerControlProps) {
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

  const getLayerColor = (type: string) => {
    switch (type) {
      case 'evidencias':
        return '#4ECDC4'
      case 'concesiones':
        return '#8FBC8F' // Color representativo de concesiones (verde musgo)
      case 'analisis':
        return '#FF4444'
      default:
        return '#666'
    }
  }

  return (
    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-10 max-w-xs">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span className="font-semibold">Capas</span>
            </div>
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-3 space-y-2">
          {layers.map(layer => (
            <div key={layer.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
              <div className="flex items-center space-x-2 flex-1">
                <button
                  onClick={() => onLayerToggle(layer.id)}
                  className="flex items-center space-x-2 text-left flex-1"
                >
                  {visibleLayers.has(layer.id) ? (
                    <Eye className="h-4 w-4 text-blue-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-lg">{getLayerIcon(layer.type)}</span>
                  <span className="text-sm font-medium">{layer.name}</span>
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                {layer.count !== undefined && (
                  <Badge variant="secondary" className="text-xs">
                    {layer.count}
                  </Badge>
                )}
                <div 
                  className="w-3 h-3 rounded-full border border-gray-300"
                  style={{ backgroundColor: getLayerColor(layer.type) }}
                />
              </div>
            </div>
          ))}
          
          {layers.length === 0 && (
            <div className="text-center text-gray-500 text-sm py-4">
              No hay capas disponibles
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

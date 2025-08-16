"use client"

import React, { useState } from 'react'
import { Layers, Map, Satellite, Mountain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { MAP_CONFIG } from '@/lib/map-config'

interface MapStyle {
  id: string
  name: string
  url: string
  icon: React.ReactNode
  description: string
}

interface MapStyleControlProps {
  currentStyle: string
  onStyleChange: (styleUrl: string) => void
}

const MAP_STYLES: MapStyle[] = [
  {
    id: 'satellite',
    name: 'Satelite',
    url: MAP_CONFIG.styles.satellite,
    icon: <Satellite className="h-5 w-5" />,
    description: 'Imagenes satelitales'
  },
  {
    id: 'streets',
    name: 'Mapa Claro',
    url: MAP_CONFIG.styles.streets,
    icon: <Map className="h-5 w-5" />,
    description: 'Mapa de calles con etiquetas'
  },
  {
    id: 'topographic',
    name: 'Topografico',
    url: MAP_CONFIG.styles.topographic,
    icon: <Mountain className="h-5 w-5" />,
    description: 'Mapa topografico con relieve'
  },
  {
    id: 'openstreetmap',
    name: 'OpenStreetMap',
    url: MAP_CONFIG.styles.openstreetmap,
    icon: <Layers className="h-5 w-5" />,
    description: 'Mapa de OpenStreetMap'
  }
]

export function MapStyleControl({ currentStyle, onStyleChange }: MapStyleControlProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const currentStyleData = MAP_STYLES.find(style => style.url === currentStyle) || MAP_STYLES[0]

  const handleStyleSelect = (style: MapStyle) => {
    onStyleChange(style.url)
    setIsOpen(false)
  }

  return (
    <div className="absolute bottom-12 right-4 z-20">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="default"
            className="bg-white/95 backdrop-blur-sm border-2 border-gray-300 shadow-xl hover:bg-white font-semibold text-gray-800 px-4 py-2"
          >
            <div className="flex items-center space-x-3">
              {currentStyleData.icon}
              <span className="text-base font-semibold">Cambiar Mapa</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="start" className="w-56">
          <div className="px-2 py-1.5 text-xs font-medium text-gray-500 border-b border-gray-100">
            Estilo de Mapa
          </div>
          
          {MAP_STYLES.map((style) => (
            <DropdownMenuItem
              key={style.id}
              onClick={() => handleStyleSelect(style)}
              className="flex items-center space-x-3 px-3 py-2 cursor-pointer"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded bg-gray-100">
                {style.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">
                  {style.name}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {style.description}
                </div>
              </div>
              {style.url === currentStyle && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

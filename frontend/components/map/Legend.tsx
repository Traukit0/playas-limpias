"use client"

import React, { useState } from 'react'
import { ChevronUp, ChevronDown, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'

interface LegendProps {
  layers: any[]
}

export function Legend({ layers }: LegendProps) {
  const [isOpen, setIsOpen] = useState(true)

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
                <div className="w-3 h-3 bg-purple-500 opacity-70"></div>
                <span className="text-xs text-gray-600">Análisis</span>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

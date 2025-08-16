"use client"

import React, { useState } from 'react'
import { 
  Ruler, 
  Pencil, 
  Download, 
  Layers, 
  MapPin, 
  Info,
  Share2,
  Filter,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

interface ToolbarProps {
  onMeasure: () => void
  onDraw: () => void
  onExport: (options?: { format: string; quality: number; filename: string }) => void
  onFilter?: () => void
  onShare?: () => void
  onInfo?: () => void
  onClear?: () => void
  activeTool?: string | null
  isMeasuring?: boolean
  isDrawing?: boolean
}

export function Toolbar({ 
  onMeasure, 
  onDraw, 
  onExport, 
  onFilter, 
  onShare, 
  onInfo,
  onClear,
  activeTool: externalActiveTool,
  isMeasuring,
  isDrawing
}: ToolbarProps) {
  const [internalActiveTool, setInternalActiveTool] = useState<string | null>(null)
  const [exportOptions, setExportOptions] = useState({
    format: 'png',
    quality: 0.8,
    filename: 'mapa-playas-limpias'
  })

  const activeTool = externalActiveTool || internalActiveTool

  const tools = [
    {
      id: 'measure',
      icon: Ruler,
      label: 'Medir distancia',
      action: onMeasure,
      color: 'text-blue-600'
    },
    {
      id: 'draw',
      icon: Pencil,
      label: 'Dibujar área',
      action: onDraw,
      color: 'text-green-600'
    },
    {
      id: 'export',
      icon: Download,
      label: 'Exportar vista',
      action: () => onExport(exportOptions),
      color: 'text-purple-600'
    },
    {
      id: 'filter',
      icon: Filter,
      label: 'Filtros',
      action: onFilter,
      color: 'text-orange-600'
    },
    {
      id: 'share',
      icon: Share2,
      label: 'Compartir',
      action: onShare,
      color: 'text-indigo-600'
    },
    {
      id: 'info',
      icon: Info,
      label: 'Información',
      action: onInfo,
      color: 'text-gray-600'
    }
  ]

  const handleToolClick = (toolId: string, action: () => void) => {
    setInternalActiveTool(activeTool === toolId ? null : toolId)
    action()
  }

  const handleClearTools = () => {
    onClear?.()
    setInternalActiveTool(null)
  }

  return (
    <div className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white rounded-lg shadow-lg p-2 z-10">
      <TooltipProvider>
        <div className="flex flex-col space-y-1">
          {tools.map(tool => (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool === tool.id ? "default" : "ghost"}
                  size="sm"
                  className={`p-2 h-10 w-10 ${activeTool === tool.id ? 'bg-blue-100 text-blue-600' : ''}`}
                  onClick={() => handleToolClick(tool.id, tool.action)}
                  disabled={activeTool && activeTool !== tool.id && (isMeasuring || isDrawing)}
                >
                  <tool.icon className={`h-5 w-5 ${tool.color}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{tool.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          
          {/* Botón para limpiar herramientas */}
          {(isMeasuring || isDrawing) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearTools}
                  className="p-2 h-10 w-10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Limpiar herramientas</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
      
      {/* Indicador de herramienta activa */}
      {activeTool && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
          <Badge variant="secondary" className="text-xs">
            {tools.find(t => t.id === activeTool)?.label}
          </Badge>
        </div>
      )}

      {/* Popover para opciones de exportación */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 mt-2"
          >
            <Download className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" side="left">
          <div className="space-y-4">
            <h4 className="font-medium">Opciones de Exportación</h4>
            
            <div className="space-y-2">
              <Label htmlFor="format">Formato</Label>
              <Select 
                value={exportOptions.format} 
                onValueChange={(value) => setExportOptions(prev => ({ ...prev, format: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="jpg">JPG</SelectItem>
                  <SelectItem value="webp">WebP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quality">Calidad</Label>
              <Select 
                value={exportOptions.quality.toString()} 
                onValueChange={(value) => setExportOptions(prev => ({ ...prev, quality: parseFloat(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1.0">Alta (100%)</SelectItem>
                  <SelectItem value="0.8">Media (80%)</SelectItem>
                  <SelectItem value="0.6">Baja (60%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filename">Nombre del archivo</Label>
              <Input
                id="filename"
                value={exportOptions.filename}
                onChange={(e) => setExportOptions(prev => ({ ...prev, filename: e.target.value }))}
                placeholder="Nombre del archivo"
              />
            </div>

            <Button 
              onClick={() => onExport(exportOptions)}
              className="w-full"
            >
              Exportar Mapa
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

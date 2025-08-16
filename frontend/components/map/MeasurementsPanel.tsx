"use client"

import React, { useState } from 'react'
import { Ruler, Pencil, Trash2, Download, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { MeasurementResult, DrawResult } from '@/types/map'

interface MeasurementsPanelProps {
  measurements: MeasurementResult[]
  drawings: DrawResult[]
  onRemoveMeasurement: (id: string) => void
  onRemoveDrawing: (id: string) => void
  onExportMeasurements?: () => void
}

export function MeasurementsPanel({
  measurements,
  drawings,
  onRemoveMeasurement,
  onRemoveDrawing,
  onExportMeasurements
}: MeasurementsPanelProps) {
  const [isOpen, setIsOpen] = useState(true)

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // Aquí podrías mostrar un toast de confirmación
    } catch (error) {
      console.error('Error al copiar al portapapeles:', error)
    }
  }

  const generateReport = () => {
    let report = 'REPORTE DE MEDICIONES Y DIBUJOS\n'
    report += '================================\n\n'
    
    if (measurements.length > 0) {
      report += 'MEDICIONES:\n'
      report += '-----------\n'
      measurements.forEach((measurement, index) => {
        report += `${index + 1}. Distancia: ${measurement.formattedValue}\n`
        report += `   Fecha: ${formatTimestamp(measurement.timestamp)}\n`
        report += `   Coordenadas: ${measurement.coordinates.length} puntos\n\n`
      })
    }
    
    if (drawings.length > 0) {
      report += 'DIBUJOS:\n'
      report += '--------\n'
      drawings.forEach((drawing, index) => {
        report += `${index + 1}. Área: ${drawing.formattedArea}\n`
        report += `   Fecha: ${formatTimestamp(drawing.timestamp)}\n`
        report += `   Coordenadas: ${drawing.coordinates.length} puntos\n\n`
      })
    }
    
    return report
  }

  const exportReport = () => {
    const report = generateReport()
    const blob = new Blob([report], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `reporte-mediciones-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const totalItems = measurements.length + drawings.length

  if (totalItems === 0) {
    return null
  }

  return (
    <div className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white rounded-lg shadow-lg p-4 z-10 max-w-sm">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              <span className="font-medium">Mediciones y Dibujos</span>
              <Badge variant="secondary" className="ml-auto">
                {totalItems}
              </Badge>
            </div>
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-4 space-y-4">
          {/* Mediciones */}
          {measurements.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-1">
                <Ruler className="h-3 w-3" />
                Mediciones ({measurements.length})
              </h4>
              <div className="space-y-2">
                {measurements.map((measurement) => (
                  <Card key={measurement.id} className="p-3">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">
                            {measurement.formattedValue}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTimestamp(measurement.timestamp)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(`${measurement.formattedValue} - ${formatTimestamp(measurement.timestamp)}`)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveMeasurement(measurement.id)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Dibujos */}
          {drawings.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-1">
                <Pencil className="h-3 w-3" />
                Dibujos ({drawings.length})
              </h4>
              <div className="space-y-2">
                {drawings.map((drawing) => (
                  <Card key={drawing.id} className="p-3">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">
                            {drawing.formattedArea}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTimestamp(drawing.timestamp)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(`${drawing.formattedArea} - ${formatTimestamp(drawing.timestamp)}`)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveDrawing(drawing.id)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={exportReport}
              className="flex-1"
            >
              <Download className="h-3 w-3 mr-1" />
              Exportar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(generateReport())}
              className="flex-1"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copiar
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

"use client"

import React from 'react'
import { X, Calendar, MapPin, User, FileText, Camera, Fish, Shell, Leaf, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface PopupInfo {
  longitude: number
  latitude: number
  feature: any
}

interface MapPopupProps {
  popupInfo: PopupInfo | null
  onClose: () => void
}

export function MapPopup({ popupInfo, onClose }: MapPopupProps) {
  if (!popupInfo) return null

  const { feature } = popupInfo
  const properties = feature.properties || {}
  const sourceId = feature.source

  const renderEvidenciaContent = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-blue-600">
          📍 Evidencia #{properties.id_evidencia}
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Descripción:</span>
        </div>
        <p className="text-sm text-gray-700 pl-6">
          {properties.descripcion || 'Sin descripción'}
        </p>
        
        {properties.fecha && (
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              Fecha: {new Date(properties.fecha).toLocaleDateString('es-CL')}
            </span>
          </div>
        )}
        
        {properties.hora && (
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              Hora: {properties.hora}
            </span>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            Denuncia: #{properties.id_denuncia}
          </span>
        </div>
        
        {properties.foto_url && (
          <div className="flex items-center space-x-2">
            <Camera className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-blue-600 underline cursor-pointer">
              Ver foto
            </span>
          </div>
        )}
      </div>
    </div>
  )

  const renderConcesionContent = () => {
    // Obtener color según el tipo de concesión
    const getTipoColor = (tipo: string) => {
      switch (tipo) {
        case 'MOLUSCOS': return '#8FBC8F'
        case 'SALMONES': return '#FFB6C1'
        case 'ABALONES o EQUINODERMOS': return '#FFD93D'
        case 'ALGAS': return '#D2B48C'
        default: return '#8FBC8F'
      }
    }

    // Obtener ícono según el tipo de concesión
    const getTipoIcon = (tipo: string) => {
      switch (tipo) {
        case 'MOLUSCOS': return <Shell className="h-4 w-4 text-gray-500" />
        case 'SALMONES': return <Fish className="h-4 w-4 text-gray-500" />
        case 'ABALONES o EQUINODERMOS': return <Shell className="h-4 w-4 text-gray-500" />
        case 'ALGAS': return <Leaf className="h-4 w-4 text-gray-500" />
        default: return <Shell className="h-4 w-4 text-gray-500" />
      }
    }

    const tipoColor = getTipoColor(properties.tipo)

    return (
    <div className="space-y-3">
             <div className="flex items-center justify-between">
         <h3 className="font-semibold text-lg flex items-center gap-2" style={{ color: tipoColor }}>
           {getTipoIcon(properties.tipo)}
           Código de centro N° {properties.codigo_centro}
         </h3>
         <Button variant="ghost" size="sm" onClick={onClose}>
           <X className="h-4 w-4" />
         </Button>
       </div>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Nombre:</span>
        </div>
        <p className="text-sm text-gray-700 pl-6">
          {properties.nombre || 'Sin nombre'}
        </p>
        
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            Titular: {properties.titular || 'No especificado'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {getTipoIcon(properties.tipo)}
          <span className="text-sm text-gray-600">
            Tipo: {properties.tipo || 'No especificado'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            Región: {properties.region || 'No especificada'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs bg-gray-50">
            ID: {properties.id_concesion}
          </Badge>
        </div>
      </div>
    </div>
    )
  }

  const renderAnalisisContent = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-red-600">
          📊 Análisis #{properties.id_analisis}
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            Denuncia: #{properties.id_denuncia}
          </span>
        </div>
        
        {properties.fecha_analisis && (
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              Fecha: {new Date(properties.fecha_analisis).toLocaleDateString('es-CL')}
            </span>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            Método: {properties.metodo || 'No especificado'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            Buffer: {properties.distancia_buffer || 0}m
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            Concesiones encontradas: {properties.total_concesiones || 0}
          </span>
        </div>
        
        {properties.observaciones && (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Observaciones:</span>
            </div>
            <p className="text-sm text-gray-700 pl-6">
              {properties.observaciones}
            </p>
          </div>
        )}
      </div>
    </div>
  )

  const renderContent = () => {
    if (sourceId === 'evidencias-source') {
      return renderEvidenciaContent()
    } else if (sourceId === 'concesiones-source') {
      return renderConcesionContent()
    } else if (sourceId === 'analisis-source') {
      return renderAnalisisContent()
    } else {
             return (
         <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">
              {properties.title || 'Detalles'}
            </h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            {properties.description || 'Sin descripción'}
          </p>
        </div>
      )
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
      {renderContent()}
    </div>
  )
}

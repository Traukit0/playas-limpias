"use client"

import React, { useRef, useEffect, useState, useCallback } from 'react'
import Map, { 
  Source,
  Layer,
  Popup
} from 'react-map-gl'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MAP_CONFIG } from '@/lib/map-config'
import { LayerControl } from './LayerControl'
import { Toolbar } from './Toolbar'
import { Search } from './Search'
import { Legend } from './Legend'
import { MeasurementsPanel } from './MeasurementsPanel'
import { useMapData } from '@/hooks/useMapData'
import { useMapLayers } from '@/hooks/useMapLayers'
import { useMapTools } from '@/hooks/useMapTools'

interface MapViewerProps {
  initialViewState?: {
    longitude: number
    latitude: number
    zoom: number
  }
  onMapLoad?: (map: maplibregl.Map) => void
}

export function MapViewer({ 
  initialViewState = {
    longitude: -73.447, // Centro exacto de los datos
    latitude: -42.52,
    zoom: 15
  }, 
  onMapLoad 
}: MapViewerProps) {
  const mapRef = useRef<any>(null)
  const [viewState, setViewState] = useState(initialViewState)
  const [popupInfo, setPopupInfo] = useState<any>(null)
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null)

  // Hooks personalizados
  const { layers, visibleLayers, addLayer, toggleLayer, updateLayerCount } = useMapLayers(mapRef.current)
  const { loadMapData, mapData, loading } = useMapData(updateLayerCount)
  const { 
    activeTool,
    measurements,
    drawings,
    isMeasuring,
    isDrawing,
    startMeasuring,
    stopMeasuring,
    startDrawing,
    stopDrawing,
    exportMap,
    clearTools,
    removeMeasurement,
    removeDrawing
  } = useMapTools(mapRef.current)

  // Cargar datos cuando cambie el viewState
  useEffect(() => {
    if (mapRef.current) {
      const bounds = mapRef.current.getBounds()
      loadMapData({
        bounds: [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth()
        ],
        zoom: Math.floor(viewState.zoom)
      })
    }
  }, [viewState, loadMapData])

  // Manejar carga del mapa
  const handleMapLoad = useCallback((event: any) => {
    const map = event.target
    mapRef.current = map
    if (onMapLoad) {
      onMapLoad(map)
    }
    
    // Configurar estilos y fuentes
    map.setStyle(MAP_CONFIG.styles.streets)
    
    // Agregar controles personalizados usando MapLibre directamente
    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.addControl(new maplibregl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true
    }), 'top-right')
    map.addControl(new maplibregl.FullscreenControl(), 'top-right')
  }, [onMapLoad])

  // Manejar click en el mapa
  const handleMapClick = useCallback((event: any) => {
    const feature = event.features?.[0]
    if (feature) {
      setPopupInfo({
        longitude: event.lngLat.lng,
        latitude: event.lngLat.lat,
        feature: feature
      })
    } else {
      setPopupInfo(null)
    }
  }, [])

  const handleLocationSelect = useCallback((coordinates: [number, number], bbox?: [number, number, number, number]) => {
    if (mapRef.current) {
      if (bbox) {
        // Si hay bbox, ajustar la vista para mostrar toda el área
        mapRef.current.fitBounds([
          [bbox[1], bbox[0]], // [lat, lng] para el suroeste
          [bbox[3], bbox[2]]  // [lat, lng] para el noreste
        ], { padding: 50 })
      } else {
        // Si solo hay coordenadas, centrar en el punto
        mapRef.current.flyTo({
          center: coordinates,
          zoom: 12,
          duration: 1000
        })
      }
    }
  }, [])

  // Manejar hover en el mapa
  const handleMapMouseMove = useCallback((event: any) => {
    const map = event.target
    const features = map.queryRenderedFeatures(event.point)
    
    if (features.length > 0) {
      map.getCanvas().style.cursor = 'pointer'
    } else {
      map.getCanvas().style.cursor = ''
    }
  }, [])

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onLoad={handleMapLoad}
        onClick={handleMapClick}
        onMouseMove={handleMapMouseMove}

        mapStyle={MAP_CONFIG.styles.streets}
        style={{ width: '100%', height: '100%' }}
        interactiveLayerIds={layers.map(layer => layer.id)}
      >
        {/* Fuentes de datos dinámicas */}

        {mapData.evidencias && (
          <Source
            id="evidencias-source"
            type="geojson"
            data={mapData.evidencias}
          >
            <Layer
              id="evidencias-layer"
              type="circle"
              paint={{
                'circle-color': MAP_CONFIG.layers.evidencias.color,
                'circle-radius': 6,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#fff'
              }}
            />
          </Source>
        )}

        {mapData.concesiones && (
          <Source
            id="concesiones-source"
            type="geojson"
            data={mapData.concesiones}
          >
            <Layer
              id="concesiones-fill"
              type="fill"
              paint={{
                'fill-color': MAP_CONFIG.layers.concesiones.color,
                'fill-opacity': MAP_CONFIG.layers.concesiones.fillOpacity
              }}
            />
            <Layer
              id="concesiones-border"
              type="line"
              paint={{
                'line-color': MAP_CONFIG.layers.concesiones.borderColor,
                'line-width': 2
              }}
            />
          </Source>
        )}

        {mapData.analisis && (
          <Source
            id="analisis-source"
            type="geojson"
            data={mapData.analisis}
          >
            <Layer
              id="analisis-layer"
              type="fill"
              paint={{
                'fill-color': MAP_CONFIG.layers.analisis.color,
                'fill-opacity': MAP_CONFIG.layers.analisis.fillOpacity
              }}
            />
            <Layer
              id="analisis-border"
              type="line"
              paint={{
                'line-color': MAP_CONFIG.layers.analisis.borderColor,
                'line-width': 1
              }}
            />
          </Source>
        )}

        {/* Popup informativo */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            anchor="bottom"
            onClose={() => setPopupInfo(null)}
            closeOnClick={false}
          >
            <div className="p-2">
              <h3 className="font-semibold text-sm">
                {popupInfo.feature.properties?.title || 'Detalles'}
              </h3>
              <p className="text-xs text-gray-600">
                {popupInfo.feature.properties?.description || 'Sin descripción'}
              </p>
              {popupInfo.feature.properties?.fecha && (
                <p className="text-xs text-gray-500 mt-1">
                  Fecha: {new Date(popupInfo.feature.properties.fecha).toLocaleDateString()}
                </p>
              )}
            </div>
          </Popup>
        )}
      </Map>

      {/* Controles superpuestos */}
      <LayerControl 
        layers={layers}
        visibleLayers={visibleLayers}
        onLayerToggle={toggleLayer}
      />
      <Toolbar 
        onMeasure={isMeasuring ? stopMeasuring : startMeasuring}
        onDraw={isDrawing ? stopDrawing : startDrawing}
        onExport={exportMap}
        onFilter={() => console.log('Filtrar')}
        onShare={() => console.log('Compartir')}
        onInfo={() => console.log('Información')}
        onClear={clearTools}
        activeTool={activeTool}
        isMeasuring={isMeasuring}
        isDrawing={isDrawing}
      />
      <Search 
        onSearch={(term: string) => console.log('Buscar:', term)}
        onFilter={(filters: any) => console.log('Filtrar:', filters)}
        onLocationSelect={handleLocationSelect}
      />
      <Legend layers={layers} />
      <MeasurementsPanel
        measurements={measurements}
        drawings={drawings}
        onRemoveMeasurement={removeMeasurement}
        onRemoveDrawing={removeDrawing}
      />
      
      {/* Indicador de carga */}
      {loading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg px-4 py-2 z-20">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Cargando datos...</span>
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface LastAnalysisMapProps {
  coordenadas: [number, number]
  lugar: string
  concesiones_afectadas: number
  fecha_analisis: string
  buffer_geom?: any
  distancia_buffer?: number
  metodo?: string
}

interface Concesion {
  id_concesion: number
  codigo_centro: string
  titular: string
  tipo: string
  nombre: string
  region: string
  geom: any
  interseccion_valida: boolean
  distancia_minima: number | null
}

interface Evidencia {
  id_evidencia: number
  fecha: string
  hora: string
  descripcion: string | null
  foto_url: string | null
  coordenadas: any
}

export function LastAnalysisMap({ 
  coordenadas, 
  lugar, 
  concesiones_afectadas, 
  fecha_analisis,
  buffer_geom,
  distancia_buffer,
  metodo
}: LastAnalysisMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const [concesiones, setConcesiones] = useState<Concesion[]>([])
  const [evidencias, setEvidencias] = useState<Evidencia[]>([])
  const [loading, setLoading] = useState(false)

  // Función para obtener el centroide de un polígono
  const getPolygonCentroid = (geom: any): [number, number] | null => {
    if (!geom || !geom.coordinates) return null
    
    try {
      if (geom.type === 'MultiPolygon') {
        // Para MultiPolygon, tomar el primer polígono
        const coords = geom.coordinates[0][0]
        const latSum = coords.reduce((sum: number, coord: number[]) => sum + coord[1], 0)
        const lngSum = coords.reduce((sum: number, coord: number[]) => sum + coord[0], 0)
        return [latSum / coords.length, lngSum / coords.length]
      } else if (geom.type === 'Polygon') {
        const coords = geom.coordinates[0]
        const latSum = coords.reduce((sum: number, coord: number[]) => sum + coord[1], 0)
        const lngSum = coords.reduce((sum: number, coord: number[]) => sum + coord[0], 0)
        return [latSum / coords.length, lngSum / coords.length]
      }
    } catch (error) {
      console.error('Error calculando centroide:', error)
    }
    return null
  }

  // Cargar datos del último análisis
  useEffect(() => {
    const fetchUltimoAnalisis = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('auth-token')
        if (!token) return

        const response = await fetch('http://localhost:8000/dashboard/ultimo-analisis/concesiones', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          setConcesiones(data.concesiones || [])
          setEvidencias(data.evidencias || [])
        }
      } catch (error) {
        console.error('Error cargando datos del último análisis:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUltimoAnalisis()
  }, [])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Crear el mapa
    const map = L.map(mapRef.current).setView(coordenadas, 13)
    mapInstanceRef.current = map

    // Agregar capa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)

    // Agregar buffer geometry si existe
    if (buffer_geom) {
             L.geoJSON(buffer_geom, {
         style: { color: "blue", weight: 2, fillOpacity: 0.2 },
         onEachFeature: (feature: any, layer: any) => {
           layer.bindPopup(`
             <div>
               <b>Área de Buffer</b><br/>
               Distancia: ${distancia_buffer}m<br/>
               Método: ${metodo}
             </div>
           `)
         }
       }).addTo(map)
    }

    // Agregar evidencias GPS
    evidencias.forEach(ev => {
      if (ev.coordenadas && Array.isArray(ev.coordenadas.coordinates)) {
        const marker = L.marker([ev.coordenadas.coordinates[1], ev.coordenadas.coordinates[0]]).addTo(map)
        marker.bindPopup(`
          <div>
            <b>Evidencia #${ev.id_evidencia}</b><br/>
            Fecha: ${ev.fecha}<br/>
            Hora: ${ev.hora}<br/>
            ${ev.descripcion ? `Descripción: ${ev.descripcion}<br/>` : ''}
            ${ev.foto_url ? '📷 Con fotografía' : ''}
          </div>
        `)
      }
    })

    // Agregar concesiones intersectadas
    concesiones.forEach(concession => {
      const color = concession.interseccion_valida ? "red" : "orange"
      
             L.geoJSON(concession.geom, {
         style: { color, weight: 2, fillOpacity: 0.3 },
         onEachFeature: (feature: any, layer: any) => {
           layer.bindPopup(`
             <div>
               <div><b>Concesión:</b> ${concession.nombre}</div>
               <div><b>Código Centro:</b> ${concession.codigo_centro}</div>
               <div><b>Titular:</b> ${concession.titular}</div>
               <div><b>Tipo:</b> ${concession.tipo}</div>
               <div><b>Región:</b> ${concession.region}</div>
               <div><b>Intersección Válida:</b> ${concession.interseccion_valida ? 'Sí' : 'No'}</div>
               ${concession.distancia_minima ? `<div><b>Distancia Mínima:</b> ${concession.distancia_minima}m</div>` : ''}
             </div>
           `)
         }
       }).addTo(map)

      // Agregar tooltip con código de centro
      const centroide = getPolygonCentroid(concession.geom)
      if (centroide) {
        const marker = L.marker(centroide, {
          icon: L.divIcon({ className: 'invisible-marker' })
        }).addTo(map)
        marker.bindTooltip(concession.codigo_centro, {
          direction: 'center',
          permanent: true,
          className: 'tooltip-centro'
        })
      }
    })

    // Ajustar vista si hay elementos
    if (buffer_geom || concesiones.length > 0) {
      try {
        const bounds = L.latLngBounds()
        let hasBounds = false
        
        if (buffer_geom) {
          L.geoJSON(buffer_geom).eachLayer((layer: any) => {
            bounds.extend(layer.getBounds())
            hasBounds = true
          })
        }
        
        concesiones.forEach(concession => {
          L.geoJSON(concession.geom).eachLayer((layer: any) => {
            bounds.extend(layer.getBounds())
            hasBounds = true
          })
        })
        
        if (hasBounds && bounds.isValid()) {
          map.fitBounds(bounds, { padding: [20, 20] })
        }
      } catch (error) {
        console.error('Error ajustando vista del mapa:', error)
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [coordenadas, buffer_geom, distancia_buffer, metodo, concesiones, evidencias])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Último Análisis Realizado</h3>
        <div className="text-sm text-muted-foreground">
          {new Date(fecha_analisis).toLocaleDateString('es-CL')}
        </div>
      </div>
      
      <div 
        ref={mapRef} 
        className="h-[400px] w-full rounded-lg border bg-muted"
        style={{ zIndex: 0 }}
      />
      
      {loading && (
        <div className="text-center text-sm text-muted-foreground">
          Cargando datos del análisis...
        </div>
      )}
      
      <div className="text-sm text-muted-foreground space-y-2">
        <p><strong>Lugar:</strong> {lugar}</p>
        <p><strong>Concesiones afectadas:</strong> {concesiones_afectadas}</p>
        {distancia_buffer && <p><strong>Distancia buffer:</strong> {distancia_buffer}m</p>}
        {metodo && <p><strong>Método:</strong> {metodo}</p>}
      </div>

      {/* Leyenda del mapa */}
      {(buffer_geom || concesiones.length > 0) && (
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Leyenda</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {evidencias.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                <span>Puntos GPS ({evidencias.length})</span>
              </div>
            )}
            {buffer_geom && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 bg-blue-200 rounded"></div>
                <span>Área de Buffer ({distancia_buffer}m)</span>
              </div>
            )}
            {concesiones.some(c => c.interseccion_valida) && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-red-500 bg-red-300 rounded"></div>
                <span>Intersección Válida</span>
              </div>
            )}
            {concesiones.some(c => !c.interseccion_valida) && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-orange-500 bg-orange-300 rounded"></div>
                <span>Intersección No Válida</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

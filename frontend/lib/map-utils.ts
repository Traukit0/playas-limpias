import { MapBounds, MapViewState, MeasurementResult, DrawResult } from '@/types/map'

// Utilidades para el visor cartográfico

/**
 * Calcula la distancia entre dos puntos en coordenadas geográficas
 */
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371e3 // Radio de la Tierra en metros
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Formatea una distancia en unidades legibles
 */
export function formatDistance(distance: number): string {
  if (distance < 1000) {
    return `${Math.round(distance)} m`
  } else {
    return `${(distance / 1000).toFixed(2)} km`
  }
}

/**
 * Calcula el área de un polígono en coordenadas geográficas
 */
export function calculatePolygonArea(coordinates: number[][][]): number {
  let area = 0
  const R = 6371e3 // Radio de la Tierra en metros

  for (const ring of coordinates) {
    for (let i = 0; i < ring.length - 1; i++) {
      const [lon1, lat1] = ring[i]
      const [lon2, lat2] = ring[i + 1]
      
      area += (lon2 - lon1) * (2 + Math.sin(lat1 * Math.PI / 180) + Math.sin(lat2 * Math.PI / 180))
    }
  }

  return Math.abs(area * R * R / 2)
}

/**
 * Formatea un área en unidades legibles
 */
export function formatArea(area: number): string {
  if (area < 10000) {
    return `${Math.round(area)} m²`
  } else if (area < 1000000) {
    return `${(area / 10000).toFixed(2)} ha`
  } else {
    return `${(area / 1000000).toFixed(2)} km²`
  }
}

/**
 * Convierte coordenadas de grados decimales a DMS (grados, minutos, segundos)
 */
export function decimalToDMS(decimal: number): string {
  const degrees = Math.floor(Math.abs(decimal))
  const minutes = Math.floor((Math.abs(decimal) - degrees) * 60)
  const seconds = ((Math.abs(decimal) - degrees - minutes / 60) * 3600).toFixed(2)
  
  const direction = decimal >= 0 ? '' : '-'
  return `${direction}${degrees}° ${minutes}' ${seconds}"`
}

/**
 * Convierte coordenadas de DMS a grados decimales
 */
export function dmsToDecimal(degrees: number, minutes: number, seconds: number, direction: 'N' | 'S' | 'E' | 'W'): number {
  let decimal = degrees + minutes / 60 + seconds / 3600
  
  if (direction === 'S' || direction === 'W') {
    decimal = -decimal
  }
  
  return decimal
}

/**
 * Valida si las coordenadas están dentro de los límites de Chile
 */
export function isValidChileCoordinates(lat: number, lon: number): boolean {
  // Límites aproximados de Chile
  const chileBounds = {
    north: -17.5,
    south: -56.0,
    east: -66.0,
    west: -81.0
  }
  
  return lat >= chileBounds.south && lat <= chileBounds.north &&
         lon >= chileBounds.west && lon <= chileBounds.east
}

/**
 * Valida si las coordenadas están dentro de la región de Los Lagos
 */
export function isValidLosLagosCoordinates(lat: number, lon: number): boolean {
  // Límites aproximados de la región de Los Lagos
  const losLagosBounds = {
    north: -40.0,
    south: -45.0,
    east: -71.0,
    west: -75.0
  }
  
  return lat >= losLagosBounds.south && lat <= losLagosBounds.north &&
         lon >= losLagosBounds.west && lon <= losLagosBounds.east
}

/**
 * Genera un ID único para elementos del mapa
 */
export function generateMapId(): string {
  return `map_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Debounce function para optimizar llamadas a la API
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle function para limitar la frecuencia de llamadas
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Calcula el centro de un conjunto de coordenadas
 */
export function calculateCenter(coordinates: [number, number][]): [number, number] {
  if (coordinates.length === 0) {
    return [0, 0]
  }
  
  const sumLat = coordinates.reduce((sum, coord) => sum + coord[1], 0)
  const sumLon = coordinates.reduce((sum, coord) => sum + coord[0], 0)
  
  return [sumLon / coordinates.length, sumLat / coordinates.length]
}

/**
 * Calcula los límites (bounds) de un conjunto de coordenadas
 */
export function calculateBounds(coordinates: [number, number][]): MapBounds['bounds'] {
  if (coordinates.length === 0) {
    return [-180, -90, 180, 90]
  }
  
  let minLon = coordinates[0][0]
  let maxLon = coordinates[0][0]
  let minLat = coordinates[0][1]
  let maxLat = coordinates[0][1]
  
  for (const [lon, lat] of coordinates) {
    minLon = Math.min(minLon, lon)
    maxLon = Math.max(maxLon, lon)
    minLat = Math.min(minLat, lat)
    maxLat = Math.max(maxLat, lat)
  }
  
  return [minLon, minLat, maxLon, maxLat]
}

/**
 * Aplica padding a los bounds para mejor visualización
 */
export function addPaddingToBounds(
  bounds: MapBounds['bounds'], 
  padding: number = 0.1
): MapBounds['bounds'] {
  const [minLon, minLat, maxLon, maxLat] = bounds
  const lonPadding = (maxLon - minLon) * padding
  const latPadding = (maxLat - minLat) * padding
  
  return [
    minLon - lonPadding,
    minLat - latPadding,
    maxLon + lonPadding,
    maxLat + latPadding
  ]
}

/**
 * Calcula el zoom óptimo para mostrar un conjunto de bounds
 */
export function calculateOptimalZoom(bounds: MapBounds['bounds']): number {
  const [minLon, minLat, maxLon, maxLat] = bounds
  const latDiff = maxLat - minLat
  const lonDiff = maxLon - minLon
  const maxDiff = Math.max(latDiff, lonDiff)
  
  // Fórmula aproximada para calcular zoom basado en la diferencia de coordenadas
  return Math.floor(14 - Math.log2(maxDiff))
}

/**
 * Convierte un color hexadecimal a RGBA
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Genera un color aleatorio para elementos del mapa
 */
export function generateRandomColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ]
  
  return colors[Math.floor(Math.random() * colors.length)]
}

/**
 * Valida si un objeto es un GeoJSON válido
 */
export function isValidGeoJSON(geojson: any): boolean {
  if (!geojson || typeof geojson !== 'object') {
    return false
  }
  
  if (geojson.type === 'FeatureCollection') {
    return Array.isArray(geojson.features) && 
           geojson.features.every((feature: any) => isValidGeoJSON(feature))
  }
  
  if (geojson.type === 'Feature') {
    return geojson.geometry && isValidGeoJSON(geojson.geometry)
  }
  
  if (['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon'].includes(geojson.type)) {
    return Array.isArray(geojson.coordinates)
  }
  
  return false
}

/**
 * Simplifica una geometría para mejor rendimiento
 */
export function simplifyGeometry(coordinates: number[][], tolerance: number = 0.0001): number[][] {
  if (coordinates.length <= 2) {
    return coordinates
  }
  
  const simplified: number[][] = [coordinates[0]]
  
  for (let i = 1; i < coordinates.length - 1; i++) {
    const prev = coordinates[i - 1]
    const curr = coordinates[i]
    const next = coordinates[i + 1]
    
    const distance = pointToLineDistance(curr, prev, next)
    
    if (distance > tolerance) {
      simplified.push(curr)
    }
  }
  
  simplified.push(coordinates[coordinates.length - 1])
  return simplified
}

/**
 * Calcula la distancia de un punto a una línea
 */
function pointToLineDistance(point: number[], lineStart: number[], lineEnd: number[]): number {
  const A = point[0] - lineStart[0]
  const B = point[1] - lineStart[1]
  const C = lineEnd[0] - lineStart[0]
  const D = lineEnd[1] - lineStart[1]
  
  const dot = A * C + B * D
  const lenSq = C * C + D * D
  
  if (lenSq === 0) {
    return Math.sqrt(A * A + B * B)
  }
  
  const param = dot / lenSq
  
  let xx, yy
  
  if (param < 0) {
    xx = lineStart[0]
    yy = lineStart[1]
  } else if (param > 1) {
    xx = lineEnd[0]
    yy = lineEnd[1]
  } else {
    xx = lineStart[0] + param * C
    yy = lineStart[1] + param * D
  }
  
  const dx = point[0] - xx
  const dy = point[1] - yy
  
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Exporta el mapa como imagen
 */
export async function exportMapAsImage(
  map: any, 
  format: 'png' | 'jpg' = 'png',
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = map.getCanvas()
      const dataURL = canvas.toDataURL(`image/${format}`, quality)
      resolve(dataURL)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Descarga un archivo desde una URL de datos
 */
export function downloadFile(dataURL: string, filename: string): void {
  const link = document.createElement('a')
  link.href = dataURL
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Copia texto al portapapeles
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    // Fallback para navegadores que no soportan clipboard API
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textArea)
    return success
  }
}

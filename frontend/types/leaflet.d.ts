declare module 'leaflet' {
  export * from 'leaflet'
  
  // Declaraciones adicionales para métodos específicos
  export function map(element: string | HTMLElement, options?: any): Map
  export function tileLayer(urlTemplate: string, options?: any): TileLayer
  export function marker(latLng: [number, number], options?: any): Marker
  export function geoJSON(geojson?: any, options?: any): GeoJSON
  export function divIcon(options?: any): DivIcon
  export function latLngBounds(latLngs?: any): LatLngBounds
  
  // Interfaces para los parámetros
  interface Map {
    setView(center: [number, number], zoom: number): Map
    addTo(layer: any): Map
    remove(): void
    fitBounds(bounds: LatLngBounds, options?: any): Map
  }
  
  interface TileLayer {
    addTo(map: Map): TileLayer
  }
  
  interface Marker {
    addTo(map: Map): Marker
    bindPopup(content: string, options?: any): Marker
    bindTooltip(content: string, options?: any): Marker
    getBounds(): LatLngBounds
  }
  
  interface GeoJSON {
    addTo(map: Map): GeoJSON
    eachLayer(callback: (layer: any) => void): GeoJSON
  }
  
  interface DivIcon {
    // Propiedades del icono
  }
  
  interface LatLngBounds {
    extend(latLng: any): LatLngBounds
    isEmpty(): boolean
    isValid(): boolean
  }
}

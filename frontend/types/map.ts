// Tipos para el visor cartográfico

export interface MapBounds {
  bounds: [number, number, number, number] // [west, south, east, north]
  zoom: number
}

export interface MapData {
  denuncias?: GeoJSON.FeatureCollection
  evidencias?: GeoJSON.FeatureCollection
  concesiones?: GeoJSON.FeatureCollection
  analisis?: GeoJSON.FeatureCollection
}

export interface MapDataState {
  mapData: MapData
  loading: boolean
  error: string | null
}

export interface Layer {
  id: string
  name: string
  visible: boolean
  type: 'denuncias' | 'evidencias' | 'concesiones' | 'analisis'
  color: string
  icon: string
  count?: number
  description?: string
}

export interface MapViewState {
  longitude: number
  latitude: number
  zoom: number
  bearing?: number
  pitch?: number
}

export interface PopupInfo {
  longitude: number
  latitude: number
  feature: any
}

export interface SearchFilters {
  dateRange: {
    start: string
    end: string
  } | null
  region: string
  status: string
  type: string
}

export interface MapStats {
  total_denuncias: number
  total_evidencias: number
  total_concesiones: number
  total_analisis: number
  fecha_primera_denuncia?: string
  fecha_ultima_denuncia?: string
}

// Tipos para propiedades de features GeoJSON
export interface DenunciaProperties {
  id_denuncia: number
  lugar: string
  fecha_inspeccion: string
  fecha_ingreso: string
  observaciones: string
  total_evidencias: number
  count?: number
  fecha_inicio?: string
  fecha_fin?: string
  lugares?: string
  title: string
  description: string
}

export interface EvidenciaProperties {
  id_evidencia: number
  id_denuncia: number
  descripcion: string
  fecha: string
  hora: string
  foto_url?: string
  title: string
  description: string
}

export interface ConcesionProperties {
  id_concesion: number
  codigo_centro: number
  titular: string
  tipo: string
  nombre: string
  region: string
  title: string
  description: string
}

export interface AnalisisProperties {
  id_analisis: number
  id_denuncia: number
  fecha_analisis: string
  distancia_buffer: number
  metodo: string
  observaciones: string
  total_concesiones: number
  title: string
  description: string
}

// Tipos para herramientas del mapa
export interface MapTool {
  id: string
  name: string
  icon: string
  active: boolean
  handler: () => void
}

export interface MeasurementResult {
  distance: number
  unit: string
  coordinates: [number, number][]
}

export interface DrawResult {
  type: 'polygon' | 'line' | 'point'
  coordinates: any
  properties: Record<string, any>
}

// Tipos para exportación
export interface ExportOptions {
  format: 'png' | 'jpg' | 'pdf'
  quality: number
  width?: number
  height?: number
  filename?: string
}

// Tipos para configuración del mapa
export interface MapConfig {
  styles: {
    streets: string
    satellite: string
    topographic: string
    openstreetmap: string
  }
  clustering: {
    radius: number
    maxZoom: number
    minPoints: number
  }
  layers: {
    denuncias: LayerStyle
    evidencias: LayerStyle
    concesiones: LayerStyle
    analisis: LayerStyle
  }
  interactions: {
    hover: boolean
    click: boolean
    drag: boolean
    zoom: boolean
    scrollZoom: boolean
    boxZoom: boolean
    doubleClickZoom: boolean
    touchZoomRotate: boolean
  }
  popup: {
    maxWidth: number
    closeButton: boolean
    closeOnClick: boolean
    className: string
  }
  controls: {
    navigation: ControlConfig
    geolocate: ControlConfig
    fullscreen: ControlConfig
  }
  search: {
    placeholder: string
    debounceMs: number
    minLength: number
  }
  filters: {
    dateRange: FilterConfig
    region: FilterConfig
    status: FilterConfig
  }
  tools: {
    measure: ToolConfig
    draw: ToolConfig
    export: ExportConfig
  }
  performance: {
    maxZoom: number
    minZoom: number
    tileSize: number
    maxParallelImageRequests: number
    maxParallelRequests: number
    maxZoomForRasterTiles: number
  }
  cache: {
    enabled: boolean
    maxSize: number
    maxAge: number
  }
  errors: {
    showNotifications: boolean
    logToConsole: boolean
    retryAttempts: number
    retryDelay: number
  }
}

interface LayerStyle {
  color: string
  clusterColor?: string
  clusterTextColor?: string
  hoverColor?: string
  selectedColor?: string
  borderColor?: string
  fillOpacity?: number
  hoverOpacity?: number
  selectedOpacity?: number
}

interface ControlConfig {
  position: string
  showCompass?: boolean
  showZoom?: boolean
  trackUserLocation?: boolean
  showUserHeading?: boolean
}

interface FilterConfig {
  enabled: boolean
  defaultDays?: number
  options?: Array<{ value: string; label: string }>
}

interface ToolConfig {
  enabled: boolean
  units?: string[]
  styles?: Record<string, any>
  formats?: string[]
  quality?: number
}

interface ExportConfig {
  enabled: boolean
  formats: string[]
  quality: number
}

// Tipos para eventos del mapa
export interface MapEvent {
  type: string
  target: any
  lngLat?: [number, number]
  point?: [number, number]
  features?: any[]
}

export interface MapLoadEvent {
  target: any
  type: string
}

export interface MapMoveEvent {
  viewState: MapViewState
  target: any
  type: string
}

export interface MapClickEvent {
  lngLat: [number, number]
  point: [number, number]
  features: any[]
  target: any
  type: string
}

export interface MapMouseEvent {
  lngLat: [number, number]
  point: [number, number]
  target: any
  type: string
}

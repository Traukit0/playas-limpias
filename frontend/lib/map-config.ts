export const MAP_CONFIG = {
  // Estilos de mapas base
  styles: {
    streets: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    satellite: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    topographic: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    openstreetmap: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
  },
  
  // Configuración de clustering
  clustering: {
    radius: 50,
    maxZoom: 16,
    minPoints: 3
  },
  
  // Configuración de capas
  layers: {
    evidencias: {
      color: '#4ECDC4',
      clusterColor: '#26A69A',
      clusterTextColor: '#FFFFFF',
      hoverColor: '#00BCD4',
      selectedColor: '#009688'
    },
    concesiones: {
      // Colores por tipo de concesión
      tipos: {
        'MOLUSCOS': {
          color: '#FF6B6B', // Rojo coral
          borderColor: '#D32F2F',
          fillOpacity: 0.4,
          hoverOpacity: 0.6
        },
        'SALMONES': {
          color: '#4ECDC4', // Turquesa
          borderColor: '#26A69A',
          fillOpacity: 0.4,
          hoverOpacity: 0.6
        },
        'ABALONES o EQUINODERMOS': {
          color: '#FFD93D', // Amarillo
          borderColor: '#F57C00',
          fillOpacity: 0.4,
          hoverOpacity: 0.6
        },
        'ALGAS': {
          color: '#6C5CE7', // Púrpura
          borderColor: '#5F3DC4',
          fillOpacity: 0.4,
          hoverOpacity: 0.6
        }
      },
      // Color por defecto para tipos no definidos
      color: '#CCCCCC',
      borderColor: '#999999',
      fillOpacity: 0.3,
      hoverOpacity: 0.5,
      selectedOpacity: 0.7
    },
    analisis: {
      color: '#6C5CE7',
      borderColor: '#5F3DC4',
      fillOpacity: 0.2,
      hoverOpacity: 0.4,
      selectedOpacity: 0.6
    }
  },
  
  // Configuración de interacciones
  interactions: {
    hover: true,
    click: true,
    drag: true,
    zoom: true,
    scrollZoom: true,
    boxZoom: true,
    doubleClickZoom: true,
    touchZoomRotate: true
  },
  
  // Configuración de popups
  popup: {
    maxWidth: 300,
    closeButton: true,
    closeOnClick: false,
    className: 'map-popup'
  },
  
  // Configuración de controles
  controls: {
    navigation: {
      position: 'top-right',
      showCompass: true,
      showZoom: true
    },
    geolocate: {
      position: 'top-right',
      trackUserLocation: true,
      showUserHeading: true
    },
    fullscreen: {
      position: 'top-right'
    }
  },
  
  // Configuración de búsqueda
  search: {
    placeholder: 'Buscar por lugar, denuncia, concesión...',
    debounceMs: 300,
    minLength: 2
  },
  
  // Configuración de filtros
  filters: {
    dateRange: {
      enabled: true,
      defaultDays: 30
    },
    region: {
      enabled: true,
      options: [
        { value: 'los-lagos', label: 'Los Lagos' },
        { value: 'chiloe', label: 'Chiloé' },
        { value: 'osorno', label: 'Osorno' },
        { value: 'llanquihue', label: 'Llanquihue' }
      ]
    },
    status: {
      enabled: true,
      options: [
        { value: 'pendiente', label: 'Pendiente' },
        { value: 'en-proceso', label: 'En Proceso' },
        { value: 'completado', label: 'Completado' },
        { value: 'cancelado', label: 'Cancelado' }
      ]
    }
  },
  
  // Configuración de herramientas
  tools: {
    measure: {
      enabled: true,
      units: ['meters', 'kilometers', 'feet', 'miles']
    },
    draw: {
      enabled: true,
      styles: {
        polygon: {
          fillColor: '#FF6B6B',
          fillOpacity: 0.2,
          strokeColor: '#FF6B6B',
          strokeWidth: 2
        },
        line: {
          strokeColor: '#4ECDC4',
          strokeWidth: 3
        },
        point: {
          fillColor: '#6C5CE7',
          strokeColor: '#FFFFFF',
          strokeWidth: 2,
          radius: 6
        }
      }
    },
    export: {
      enabled: true,
      formats: ['png', 'jpg', 'pdf'],
      quality: 0.8
    }
  },
  
  // Configuración de performance
  performance: {
    maxZoom: 18,
    minZoom: 5,
    tileSize: 512,
    maxParallelImageRequests: 4,
    maxParallelRequests: 6,
    maxZoomForRasterTiles: 22
  },
  
  // Configuración de caché
  cache: {
    enabled: true,
    maxSize: 50, // MB
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  },
  
  // Configuración de errores
  errors: {
    showNotifications: true,
    logToConsole: true,
    retryAttempts: 3,
    retryDelay: 1000
  }
}

// Configuración específica para Chile/Chiloé
export const CHILE_CONFIG = {
  // Centro por defecto (Chiloé)
  defaultCenter: {
    longitude: -73.5,
    latitude: -42.5,
    zoom: 8
  },
  
  // Límites del país
  bounds: {
    north: -17.5,
    south: -56.0,
    east: -66.0,
    west: -81.0
  },
  
  // Región de Los Lagos
  losLagosBounds: {
    north: -40.0,
    south: -45.0,
    east: -71.0,
    west: -75.0
  },
  
  // Chiloé específico
  chiloeBounds: {
    north: -41.5,
    south: -43.5,
    east: -72.5,
    west: -74.5
  }
}

// Configuración de estilos personalizados
export const CUSTOM_STYLES = {
  // Estilo para modo oscuro
  dark: {
    background: '#1a1a1a',
    text: '#ffffff',
    border: '#333333',
    shadow: 'rgba(0, 0, 0, 0.3)'
  },
  
  // Estilo para modo claro
  light: {
    background: '#ffffff',
    text: '#000000',
    border: '#e5e5e5',
    shadow: 'rgba(0, 0, 0, 0.1)'
  },
  
  // Estilo para modo acuático
  aquatic: {
    background: '#e3f2fd',
    text: '#1565c0',
    border: '#90caf9',
    shadow: 'rgba(21, 101, 192, 0.1)'
  }
}

// Configuración de animaciones
export const ANIMATION_CONFIG = {
  duration: 300,
  easing: 'ease-out',
  zoom: {
    duration: 500,
    easing: 'ease-out'
  },
  pan: {
    duration: 300,
    easing: 'ease-out'
  },
  fade: {
    duration: 200,
    easing: 'ease-in-out'
  }
}

// Configuración inteligente de API que funciona en local y Docker
export const getApiUrl = () => {
  // En el navegador, siempre usar localhost para desarrollo
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  }
  
  // En el servidor (SSR), detectar si estamos en Docker
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  
  // Si no está definida o es localhost, pero estamos en contenedor, usar backend
  if (!apiUrl || apiUrl.includes('localhost')) {
    // Detectar si estamos en Docker verificando variables de entorno o hostname
    const isDocker = process.env.HOSTNAME?.includes('docker') || 
                    process.env.NODE_ENV === 'development' && 
                    process.env.DOCKER_CONTAINER === 'true'
    
    if (isDocker) {
      return 'http://backend:8000'
    }
  }
  
  return apiUrl || 'http://localhost:8000'
}

export const API_URL = getApiUrl()
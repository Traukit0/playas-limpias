import { useAuth } from "@/hooks/use-auth"

// Configuración centralizada para el wizard
export const WIZARD_CONFIG = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
}

// Hook personalizado para obtener configuración del wizard con autenticación
export const useWizardAuth = () => {
  const { token } = useAuth()
  
  return {
    token,
    apiUrl: WIZARD_CONFIG.API_BASE_URL,
    isAuthenticated: !!token
  }
} 
import { useState, useEffect } from 'react'

interface User {
  id_usuario: number
  nombre: string
  email: string
  activo: boolean
  fecha_registro: string
  ultimo_acceso?: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  loading: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
  })

  useEffect(() => {
    // Verificar autenticación al cargar
    checkAuth()
  }, [])

  const checkAuth = () => {
    try {
      const token = localStorage.getItem('auth_token')
      const userData = localStorage.getItem('user_data')
      const isAuthenticated = localStorage.getItem('is_authenticated') === 'true'

      if (token && userData && isAuthenticated) {
        const user = JSON.parse(userData)
        setAuthState({
          isAuthenticated: true,
          user,
          token,
          loading: false,
        })
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          token: null,
          loading: false,
        })
      }
    } catch (error) {
      console.error('Error checking auth:', error)
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
      })
    }
  }

  const login = (token: string, user: User) => {
    localStorage.setItem('auth_token', token)
    localStorage.setItem('user_data', JSON.stringify(user))
    localStorage.setItem('is_authenticated', 'true')
    
    setAuthState({
      isAuthenticated: true,
      user,
      token,
      loading: false,
    })
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    localStorage.removeItem('is_authenticated')
    
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
    })
  }

  return {
    ...authState,
    login,
    logout,
    checkAuth,
  }
} 
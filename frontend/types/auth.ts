import type { DefaultSession, DefaultUser } from "next-auth"
import type { JWT } from "next-auth/jwt"

// Extender tipos de NextAuth para incluir nuestros campos personalizados
declare module "next-auth" {
  interface Session {
    accessToken?: string
    usuario?: {
      id_usuario: number
      nombre: string
      email: string
      activo: boolean
      fecha_registro: string
      ultimo_acceso?: string
    }
    user: {
      id: string
      email: string
      name: string
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    accessToken?: string
    usuario?: {
      id_usuario: number
      nombre: string
      email: string
      activo: boolean
      fecha_registro: string
      ultimo_acceso?: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    usuario?: {
      id_usuario: number
      nombre: string
      email: string
      activo: boolean
      fecha_registro: string
      ultimo_acceso?: string
    }
  }
}

// Tipos para nuestras API calls
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  nombre: string
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  expires_in: number
  user: {
    id_usuario: number
    nombre: string
    email: string
    activo: boolean
    fecha_registro: string
    ultimo_acceso?: string
  }
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}
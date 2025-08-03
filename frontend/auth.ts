import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"

// Schemas de validación
const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Password requerido"),
})

const RegisterSchema = z.object({
  nombre: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Password debe tener al menos 6 caracteres"),
})

// Configuración de Auth.js v5
export const config = {
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        nombre: { label: "Nombre", type: "text" },
        action: { label: "Action", type: "text" }, // "login" o "register"
      },
      async authorize(credentials) {
        try {
          const action = credentials?.action || "login"
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
          
          if (action === "login") {
            // Proceso de login
            const { email, password } = LoginSchema.parse(credentials)

            const response = await fetch(`${apiUrl}/auth/login`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email, password }),
            })

            if (!response.ok) {
              return null
            }

            const data = await response.json()
            
            if (data.access_token && data.user) {
              return {
                id: data.user.id_usuario.toString(),
                email: data.user.email,
                name: data.user.nombre,
                accessToken: data.access_token,
                usuario: data.user,
              }
            }
          } else if (action === "register") {
            // Proceso de registro
            const { nombre, email, password } = RegisterSchema.parse(credentials)

            const response = await fetch(`${apiUrl}/auth/register`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ nombre, email, password }),
            })

            if (!response.ok) {
              return null
            }

            const data = await response.json()
            
            if (data.access_token && data.user) {
              return {
                id: data.user.id_usuario.toString(),
                email: data.user.email,
                name: data.user.nombre,
                accessToken: data.access_token,
                usuario: data.user,
              }
            }
          }
          
          return null
        } catch (error) {
          return null
        }
      }
    })
  ],
  
  callbacks: {
    async jwt({ token, user }) {
      // Persistir el access token y user info en el JWT
      if (user) {
        token.accessToken = user.accessToken
        token.usuario = user.usuario
      }
      return token
    },
    
    async session({ session, token }) {
      // Enviar propiedades al cliente
      if (token) {
        session.accessToken = token.accessToken as string
        session.usuario = token.usuario as any
        session.user.id = token.sub!
      }
      return session
    },
  },
  
  pages: {
    signIn: '/auth/login',
  },
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30 minutes to match backend
  },
  
  secret: process.env.NEXTAUTH_SECRET || "nextauth-secret-change-in-production-playas-limpias-2025",
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(config)
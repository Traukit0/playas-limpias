import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas que requieren autenticación
  const protectedRoutes = ['/dashboard', '/nueva-inspeccion', '/historial', '/mapa', '/perfil']
  
  // Rutas públicas de autenticación
  const authRoutes = ['/auth/login', '/auth/register']

  // Verificar si la ruta actual requiere autenticación
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // Por ahora, permitir todas las rutas
  // TODO: Implementar verificación de autenticación cuando se complete el sistema
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/nueva-inspeccion/:path*',
    '/historial/:path*',
    '/mapa/:path*',
    '/perfil/:path*',
    '/auth/:path*',
  ],
}
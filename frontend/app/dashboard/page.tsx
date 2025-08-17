"use client"

import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"
import { FileBarChart, Plus, User, Activity, Clock, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RecentInspections } from "@/components/recent-inspections"
import { Badge } from "@/components/ui/badge"

export default function DashboardPage() {
  const { user, isAuthenticated, loading } = useAuth()

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h2>
          <p className="text-gray-600 mb-4">Debes iniciar sesión para acceder al dashboard</p>
          <Link href="/auth/login">
            <Button>Iniciar Sesión</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h1>
            {user && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {user.nombre}
                </Badge>
              </div>
            )}
          </div>
          <Link href="/nueva-inspeccion">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Inspección
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Saludo personalizado */}
        {user && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-blue-900">
              ¡Bienvenido, {user.nombre.split(' ')[0]}!
            </h2>
            <p className="text-blue-700 text-sm">
              Sistema de Inspecciones Ambientales - Playas Limpias
            </p>
            {user.ultimo_acceso && (
              <p className="text-blue-600 text-xs mt-1">
                Último acceso: {new Date(user.ultimo_acceso).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
        )}



        {/* Inspecciones recientes */}
        <Card>
          <CardHeader>
            <CardTitle>Inspecciones Recientes</CardTitle>
            <CardDescription>
              Últimas inspecciones realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentInspections />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

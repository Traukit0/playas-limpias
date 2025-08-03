"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return // Aún cargando

    if (isAuthenticated) {
      // Usuario autenticado → ir al dashboard
      router.push("/dashboard")
    } else {
      // Usuario no autenticado → ir al login
      router.push("/auth/login")
    }
  }, [isAuthenticated, loading, router])

  // Mostrar loading mientras redirige
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">PL</span>
        </div>
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
        <h1 className="text-xl font-semibold text-gray-700 mb-2">
          Playas Limpias
        </h1>
        <p className="text-gray-500">Cargando...</p>
      </div>
    </div>
  )
}
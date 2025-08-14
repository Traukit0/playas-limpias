"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { login } = useAuth()

  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Probar diferentes URLs para el backend
      const possibleUrls = [
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
        'http://localhost:8000',
        'http://localhost:8000',
        'http://host.docker.internal:8000'
      ]
      
      let response = null
      
      // Probar cada URL hasta que una funcione
      for (const url of possibleUrls) {
        try {
          const testUrl = `${url}/auth/login`
          
          response = await fetch(testUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: formData.email,
              password: formData.password,
            }),
          })
          
          if (response.ok) {
            break
          }
        } catch (err: any) {
          continue
        }
      }
      
      if (!response || !response.ok) {
        setError("No se pudo conectar con el servidor")
        toast({
          title: "Error de conexión",
          description: "No se pudo conectar con el servidor",
          variant: "destructive",
        })
        return
      }

      const data = await response.json()
      
      if (data.access_token && data.user) {
        // Usar el hook para crear la sesión
        login(data.access_token, data.user)
        
        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión exitosamente",
        })
        
        // Redirigir al dashboard con timeout para asegurar que el toast se muestre
        setTimeout(() => {
          router.push(callbackUrl)
        }, 1000)
      } else {
        setError("Respuesta inválida del servidor")
      }
    } catch (error: any) {
      console.error("Error en login:", error)
      setError("Error inesperado. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError("") // Limpiar error al escribir
  }

  return (
    <div className="relative min-h-screen">
      {/* Fondo con imagen + overlay de degradado para legibilidad */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('/login_portada.png')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/50 to-slate-900/30" />
      </div>

      {/* Contenido principal centrado solo con el card de login */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        {/* Card de login con efecto glassmorphism */}
        <Card className="w-full max-w-md rounded-3xl border border-white/20 bg-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-2xl backdrop-saturate-150 ring-1 ring-white/10 supports-[backdrop-filter]:backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/30 dark:ring-white/10">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-600/30">
                  <span className="text-white font-bold text-xl">PL</span>
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-center text-slate-100">
                Iniciar Sesión
              </CardTitle>
              <CardDescription className="text-center text-slate-300">
                Sistema de Inspecciones en Playas Limpias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-200">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu.email@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                    disabled={isLoading}
                    className="bg-white/10 border-white/20 text-slate-100 placeholder:text-slate-300/60 focus-visible:ring-2 focus-visible:ring-sky-400/50 focus-visible:border-sky-300/40"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-200">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      required
                      disabled={isLoading}
                      className="bg-white/10 border-white/20 text-slate-100 placeholder:text-slate-300/60 focus-visible:ring-2 focus-visible:ring-sky-400/50 focus-visible:border-sky-300/40"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-slate-300 hover:text-slate-100"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-sky-600/90 hover:bg-sky-500 text-white border border-white/10 shadow-lg shadow-sky-900/20"
                  disabled={isLoading || !formData.email || !formData.password}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    "Iniciar Sesión"
                  )}
                </Button>

                <div className="text-center text-sm">
                  <span className="text-slate-300/80">
                    ¿No tienes una cuenta?{" "}
                  </span>
                  <Link
                    href="/auth/register"
                    className="text-sky-300 hover:text-sky-200 underline-offset-2 hover:underline font-medium"
                  >
                    Regístrate aquí
                  </Link>
                </div>
              </form>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
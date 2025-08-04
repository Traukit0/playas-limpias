"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const router = useRouter()
  const { toast } = useToast()
  const { login } = useAuth()

  // Validaciones en tiempo real
  const validations = {
    nombre: formData.nombre.length >= 2,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
    password: formData.password.length >= 6,
    confirmPassword: formData.password === formData.confirmPassword && formData.confirmPassword.length > 0,
  }

  const allValid = Object.values(validations).every(Boolean)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Probar diferentes URLs para el backend (mismo sistema que login)
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
          const testUrl = `${url}/auth/register`
          
          response = await fetch(testUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              nombre: formData.nombre,
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
        const errorData = await response?.json().catch(() => ({}))
        
        if (response?.status === 409 || errorData.detail?.includes("email")) {
          setError("Este email ya está registrado")
        } else {
          setError("Error al crear la cuenta. Inténtalo de nuevo.")
        }
        
        toast({
          title: "Error en registro",
          description: error || "No se pudo crear la cuenta",
          variant: "destructive",
        })
        return
      }

      const data = await response.json()
      
      if (data.access_token && data.user) {
        // Usar el hook para crear la sesión
        login(data.access_token, data.user)

        toast({
          title: "¡Cuenta creada exitosamente!",
          description: "Bienvenido a Playas Limpias",
        })
        router.push("/dashboard")
      } else {
        setError("Respuesta inválida del servidor")
      }
    } catch (error: any) {
      console.error("Error en registro:", error)
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            {/* Logo o ícono */}
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">PL</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Crear Cuenta
          </CardTitle>
          <CardDescription className="text-center">
            Únete al Sistema de Inspecciones en Playas Limpias
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
              <Label htmlFor="nombre">Nombre completo</Label>
              <div className="relative">
                <Input
                  id="nombre"
                  type="text"
                  placeholder="Juan Pérez"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange("nombre", e.target.value)}
                  required
                  disabled={isLoading}
                />
                {formData.nombre && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    {validations.nombre ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <span className="text-red-500 text-xs">Min. 2 caracteres</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="tu.email@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  disabled={isLoading}
                />
                {formData.email && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    {validations.email ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <span className="text-red-500 text-xs">Email inválido</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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
              {formData.password && !validations.password && (
                <p className="text-xs text-red-500">Mínimo 6 caracteres</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {formData.confirmPassword && !validations.confirmPassword && (
                <p className="text-xs text-red-500">Las contraseñas no coinciden</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !allValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                "Crear Cuenta"
              )}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                ¿Ya tienes una cuenta?{" "}
              </span>
              <Link
                href="/auth/login"
                className="text-blue-600 hover:underline font-medium"
              >
                Inicia sesión aquí
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { User, Mail, Calendar, Shield, Key, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

export default function PerfilPage() {
  const { user, isAuthenticated, loading, token } = useAuth()
  const { toast } = useToast()

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsChangingPassword(true)
    setPasswordError("")

    // Validaciones
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Las nuevas contraseñas no coinciden")
      setIsChangingPassword(false)
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("La nueva contraseña debe tener al menos 6 caracteres")
      setIsChangingPassword(false)
      return
    }

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
          const testUrl = `${url}/auth/change-password`
          
          response = await fetch(testUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              current_password: passwordForm.currentPassword,
              new_password: passwordForm.newPassword,
            }),
          })
          
          if (response.ok) {
            break
          }
        } catch (err: any) {
          continue
        }
      }

      if (response && response.ok) {
        toast({
          title: "Contraseña actualizada",
          description: "Tu contraseña ha sido cambiada exitosamente",
        })
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        const error = await response?.json().catch(() => ({}))
        setPasswordError(error.detail || "Error al cambiar la contraseña")
      }
    } catch (error) {
      console.error("Error changing password:", error)
      setPasswordError("Error inesperado. Inténtalo de nuevo.")
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handlePasswordInputChange = (field: string, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }))
    if (passwordError) setPasswordError("")
  }

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  // Si no está autenticado, mostrar mensaje
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h2>
          <p className="text-gray-600 mb-4">Debes iniciar sesión para acceder a tu perfil</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Gestiona tu información personal y configuración de cuenta
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Información Personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
            <CardDescription>
              Tu información básica en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <div className="flex items-center gap-2">
                <Input value={user.nombre || ""} disabled />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input value={user.email || ""} disabled />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Estado de cuenta</Label>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <Badge variant={user.activo ? "default" : "destructive"}>
                  {user.activo ? "Activa" : "Inactiva"}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fecha de registro</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input 
                  value={new Date(user.fecha_registro).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })} 
                  disabled 
                />
              </div>
            </div>

            {user.ultimo_acceso && (
              <div className="space-y-2">
                <Label>Último acceso</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={new Date(user.ultimo_acceso).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })} 
                    disabled 
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cambiar Contraseña */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Seguridad
            </CardTitle>
            <CardDescription>
              Cambia tu contraseña para mantener tu cuenta segura
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {passwordError && (
                <Alert variant="destructive">
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="currentPassword">Contraseña actual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => handlePasswordInputChange("currentPassword", e.target.value)}
                  disabled={isChangingPassword}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva contraseña</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => handlePasswordInputChange("newPassword", e.target.value)}
                  disabled={isChangingPassword}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => handlePasswordInputChange("confirmPassword", e.target.value)}
                  disabled={isChangingPassword}
                  required
                />
              </div>

              <Separator />

              <Button
                type="submit"
                disabled={
                  isChangingPassword ||
                  !passwordForm.currentPassword ||
                  !passwordForm.newPassword ||
                  !passwordForm.confirmPassword
                }
                className="w-full"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cambiando contraseña...
                  </>
                ) : (
                  "Cambiar Contraseña"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
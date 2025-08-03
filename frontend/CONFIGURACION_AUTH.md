# 🔐 Configuración de Autenticación Frontend

## 📋 Variables de Entorno Requeridas

### **1. Crear archivo `.env.local`**

En el directorio `frontend/`, crea el archivo `.env.local` con las siguientes variables:

```bash
# Next.js Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:8000

# NextAuth Configuration  
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=nextauth-secret-change-in-production-playas-limpias-2025
```

### **2. Para Producción**

```bash
# Producción
NEXT_PUBLIC_API_URL=https://tu-dominio-backend.com
NEXTAUTH_URL=https://tu-dominio-frontend.com
NEXTAUTH_SECRET=tu-clave-super-secreta-para-nextauth-produccion-min-32-chars
```

## 🚀 Instalación y Configuración

### **1. Instalar Dependencias**

```bash
cd frontend
pnpm install
```

### **2. Configurar Variables de Entorno**

```bash
# Copiar y editar variables de entorno
cp .env.example .env.local  # Si existe
# O crear manualmente con el contenido de arriba
```

### **3. Ejecutar en Desarrollo**

```bash
pnpm dev
```

La aplicación estará disponible en: `http://localhost:3000`

## 🧪 Testing del Sistema de Autenticación

### **Flujo de Testing Completo:**

1. **📍 Ir a la URL**: `http://localhost:3000`
   - Debería redirigir automáticamente a `/auth/login`

2. **📝 Registro de Usuario**:
   - Ir a "Regístrate aquí"
   - Completar formulario de registro
   - Verificar redirección automática al dashboard

3. **🔑 Login de Usuario**:
   - Usar credenciales del usuario registrado
   - Verificar redirección al dashboard

4. **🏠 Dashboard Autenticado**:
   - Verificar saludo personalizado con nombre del usuario
   - Verificar navbar con información del usuario
   - Verificar que todas las rutas protegidas funcionan

5. **👤 Gestión de Perfil**:
   - Ir a "Mi Perfil" desde el menú de usuario
   - Verificar información del usuario
   - Probar cambio de contraseña

6. **🚪 Logout**:
   - Usar "Cerrar Sesión" desde el menú
   - Verificar redirección a login
   - Verificar que rutas protegidas redirigen al login

## 📱 Estructura de Rutas

### **Rutas Públicas** (No requieren autenticación):
- `/` → Redirige según estado de auth
- `/auth/login` → Página de login
- `/auth/register` → Página de registro
- `/api/auth/*` → Endpoints de NextAuth

### **Rutas Protegidas** (Requieren autenticación):
- `/dashboard` → Dashboard principal
- `/nueva-inspeccion` → Wizard de inspección
- `/historial` → Historial de inspecciones  
- `/mapa` → Vista de mapa
- `/perfil` → Gestión de perfil de usuario

## 🔧 Integración con Backend

### **Headers de Autenticación**:
```javascript
// El token JWT se incluye automáticamente en las requests
fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${session.accessToken}`,
    'Content-Type': 'application/json'
  }
})
```

### **Acceso a Datos del Usuario**:
```javascript
import { useSession } from "next-auth/react"

function MiComponente() {
  const { data: session, status } = useSession()
  
  if (status === "loading") return <p>Cargando...</p>
  if (!session) return <p>No autenticado</p>
  
  return (
    <div>
      <p>Hola {session.user.name}</p>
      <p>Email: {session.user.email}</p>
      <p>Token: {session.accessToken}</p>
    </div>
  )
}
```

## ⚠️ Problemas Comunes

### **1. Error de CORS**
- Verificar que el backend tenga configurado CORS para `http://localhost:3000`
- Verificar `NEXT_PUBLIC_API_URL` en `.env.local`

### **2. Error de Autenticación**
- Verificar que el backend esté ejecutándose en puerto 8000
- Verificar credenciales de usuario
- Verificar que `NEXTAUTH_SECRET` esté configurado

### **3. Redirecciones Infinitas**
- Verificar middleware en `middleware.ts`
- Verificar configuración de rutas en `auth.ts`

### **4. Sesión no Persiste**
- Verificar cookies en el navegador
- Verificar `NEXTAUTH_URL` en variables de entorno

## 🎯 Próximos Pasos

Una vez que el sistema de autenticación funcione correctamente:

1. ✅ Probar registro y login
2. ✅ Verificar navegación entre rutas protegidas
3. ✅ Probar funcionalidad de perfil
4. ⏳ Integrar wizard existente con autenticación
5. ⏳ Testing end-to-end completo

## 📝 Notas de Desarrollo

- **Auth.js v5**: Versión beta pero estable para producción
- **JWT Tokens**: Persisten por 30 minutos (configurable)
- **Middleware**: Protege rutas automáticamente
- **TypeScript**: Tipos completos para sesión y usuario
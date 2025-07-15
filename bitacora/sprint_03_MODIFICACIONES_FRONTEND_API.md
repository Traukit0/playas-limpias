# Modificaciones Frontend - Corrección de Errores 404 API

## Problema Identificado

El frontend está experimentando errores 404 al hacer llamadas GET a `/usuarios` y `/estados_denuncia/` debido a:

1. **Falta de URL base del backend**: Las llamadas se hacen a rutas relativas sin especificar la URL del servidor backend
2. **Formato incorrecto del token**: El token se envía sin el prefijo "Bearer" en las llamadas GET
3. **Falta de configuración de proxy**: No hay redirección de llamadas API al backend

## Análisis del Backend

### Rutas Disponibles
- `GET /usuarios/` - Lista todos los usuarios (requiere autenticación)
- `GET /estados_denuncia/` - Lista todos los estados de denuncia (requiere autenticación)

### Autenticación
- Token válido: `testtoken123`
- Formato requerido: `Bearer testtoken123`
- Middleware: `verificar_token` en `backend/security/auth.py`

## Modificaciones Propuestas

### 1. Configuración de Variables de Entorno

**Archivo**: `frontend/.env.local` (nuevo)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Nota**: Este archivo debe crearse manualmente en el directorio `frontend/` ya que está excluido del control de versiones por `.gitignore`.

### 2. Corrección del Componente Step-One

**Archivo**: `frontend/components/wizard-steps/step-one.tsx`

#### Cambios:
- Agregar constante para URL base del backend
- Corregir formato del token en llamadas GET (agregar "Bearer")
- Mejorar manejo de errores
- Mantener funcionalidad existente intacta

#### Líneas específicas a modificar:
- Línea 20: Agregar `API_BASE_URL`
- Líneas 42-47: Corregir headers de Authorization
- Líneas 42-47: Agregar URL base a las llamadas fetch

### 3. Mejoras en el Manejo de Errores

- Agregar logging de errores para debugging
- Mostrar mensajes de error más informativos
- Mantener fallback a arrays vacíos en caso de error

## Impacto de los Cambios

### Positivo:
- ✅ Corrección de errores 404
- ✅ Carga correcta de usuarios y estados
- ✅ Mejor experiencia de usuario
- ✅ Mantenimiento de funcionalidad existente

### Riesgos Mínimos:
- ⚠️ Requiere configuración de variable de entorno
- ⚠️ Dependencia de que el backend esté en `localhost:8000`

## Verificación Post-Cambios

1. Verificar que las llamadas GET funcionen correctamente
2. Confirmar que los dropdowns se llenen con datos
3. Validar que el flujo de creación de inspección continúe funcionando
4. Verificar que no se rompa funcionalidad existente

## Pasos para Implementar los Cambios

### 1. Crear archivo de variables de entorno
```bash
# En el directorio frontend/
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

### 2. Reiniciar el servidor de desarrollo
```bash
# En el directorio frontend/
npm run dev
# o
pnpm dev
```

### 3. Verificar en el navegador
- Abrir las herramientas de desarrollador (F12)
- Ir a la pestaña "Nueva Inspección"
- Verificar que no hay errores 404 en la consola
- Confirmar que los dropdowns de "Inspector Responsable" y "Estado de Denuncia" se llenan correctamente

## Archivos a Modificar

1. `frontend/.env.local` (nuevo)
2. `frontend/components/wizard-steps/step-one.tsx` (modificar)

## Cambios Realizados

### ✅ Completado:
- [x] Documentación detallada del problema y solución
- [x] Modificación del componente `step-one.tsx`:
  - [x] Agregada constante `API_BASE_URL`
  - [x] Corregido formato del token (agregado "Bearer")
  - [x] Mejorado manejo de errores con logging
  - [x] Agregadas URLs completas a las llamadas fetch
- [x] Instrucciones de implementación y verificación

### ⏳ Pendiente:
- [ ] Crear archivo `frontend/.env.local` manualmente
- [ ] Reiniciar servidor de desarrollo
- [ ] Verificar funcionamiento en navegador

## Notas Técnicas

- Las modificaciones son incrementales y no rompen funcionalidad existente
- Se mantiene el token hardcodeado como está actualmente
- Se preserva la estructura de datos y tipos existentes
- Compatible con la configuración actual del backend 
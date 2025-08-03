# 🧪 Guía de Testing - Endpoints de Autenticación

Esta guía contiene ejemplos de cURL y scripts para probar todos los endpoints de autenticación implementados.

## 📋 Pre-requisitos

1. **Backend ejecutándose**: `uvicorn main:app --reload --host 0.0.0.0 --port 8000`
2. **Base de datos configurada** con las nuevas columnas de usuarios
3. **Dependencias instaladas**: `pip install -r requirements.txt`
4. **Migración ejecutada** (opcional): `python scripts/migrate_users.py`

## 🔐 Endpoints Disponibles

### 1. **POST /auth/register** - Registro de Usuario

```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "email": "juan.perez@example.com",
    "password": "password123"
  }'
```

**Respuesta esperada:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id_usuario": 6,
    "nombre": "Juan Pérez",
    "email": "juan.perez@example.com",
    "activo": true,
    "fecha_registro": "2025-01-XX...",
    "ultimo_acceso": null
  }
}
```

### 2. **POST /auth/login** - Login de Usuario

```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan.perez@example.com",
    "password": "password123"
  }'
```

### 3. **GET /auth/me** - Información del Usuario Actual

```bash
# Primero obtener el token del login/register
TOKEN="your_jwt_token_here"

curl -X GET "http://localhost:8000/auth/me" \
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta esperada:**
```json
{
  "id_usuario": 6,
  "nombre": "Juan Pérez",
  "email": "juan.perez@example.com",
  "activo": true,
  "fecha_registro": "2025-01-XX...",
  "ultimo_acceso": "2025-01-XX..."
}
```

### 4. **POST /auth/refresh** - Renovar Token

```bash
curl -X POST "http://localhost:8000/auth/refresh" \
  -H "Authorization: Bearer $TOKEN"
```

### 5. **PUT /auth/change-password** - Cambiar Contraseña

```bash
curl -X PUT "http://localhost:8000/auth/change-password" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "password123",
    "new_password": "newpassword456"
  }'
```

### 6. **POST /auth/logout** - Logout

```bash
curl -X POST "http://localhost:8000/auth/logout" \
  -H "Authorization: Bearer $TOKEN"
```

## 🔧 Testing de Compatibilidad con Token Hardcodeado

Los endpoints existentes deben seguir funcionando con el token hardcodeado:

```bash
# Probar endpoint existente con token hardcodeado
curl -X GET "http://localhost:8000/usuarios/" \
  -H "Authorization: Bearer testtoken123"

# Probar endpoint existente con JWT
curl -X GET "http://localhost:8000/usuarios/" \
  -H "Authorization: Bearer $TOKEN"
```

## 📊 Script de Testing Automático

```bash
#!/bin/bash
# test_auth_flow.sh

BASE_URL="http://localhost:8000"
EMAIL="test.user@example.com"
PASSWORD="testpassword123"
NEW_PASSWORD="newtestpassword456"

echo "🧪 Testing Authentication Flow"
echo "=============================="

# 1. Registro
echo "1. 👤 Registrando usuario..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"nombre\": \"Test User\",
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.access_token')

if [ "$TOKEN" != "null" ]; then
  echo "✅ Registro exitoso"
  echo "🔑 Token: ${TOKEN:0:20}..."
else
  echo "❌ Error en registro"
  echo "$REGISTER_RESPONSE"
  exit 1
fi

# 2. Información del usuario
echo ""
echo "2. 👁️  Obteniendo información del usuario..."
USER_INFO=$(curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN")

USER_NAME=$(echo $USER_INFO | jq -r '.nombre')
if [ "$USER_NAME" != "null" ]; then
  echo "✅ Usuario: $USER_NAME"
else
  echo "❌ Error obteniendo información"
  echo "$USER_INFO"
fi

# 3. Cambiar contraseña
echo ""
echo "3. 🔐 Cambiando contraseña..."
CHANGE_PASS=$(curl -s -X PUT "$BASE_URL/auth/change-password" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"current_password\": \"$PASSWORD\",
    \"new_password\": \"$NEW_PASSWORD\"
  }")

if echo "$CHANGE_PASS" | grep -q "exitosamente"; then
  echo "✅ Contraseña cambiada"
else
  echo "❌ Error cambiando contraseña"
  echo "$CHANGE_PASS"
fi

# 4. Login con nueva contraseña
echo ""
echo "4. 🔑 Login con nueva contraseña..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$NEW_PASSWORD\"
  }")

NEW_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')
if [ "$NEW_TOKEN" != "null" ]; then
  echo "✅ Login exitoso con nueva contraseña"
else
  echo "❌ Error en login"
  echo "$LOGIN_RESPONSE"
fi

# 5. Renovar token
echo ""
echo "5. 🔄 Renovando token..."
REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/refresh" \
  -H "Authorization: Bearer $NEW_TOKEN")

REFRESHED_TOKEN=$(echo $REFRESH_RESPONSE | jq -r '.access_token')
if [ "$REFRESHED_TOKEN" != "null" ]; then
  echo "✅ Token renovado"
else
  echo "❌ Error renovando token"
  echo "$REFRESH_RESPONSE"
fi

# 6. Probar endpoint protegido
echo ""
echo "6. 🛡️  Probando endpoint protegido..."
PROTECTED_RESPONSE=$(curl -s -X GET "$BASE_URL/usuarios/" \
  -H "Authorization: Bearer $REFRESHED_TOKEN")

if echo "$PROTECTED_RESPONSE" | grep -q "id_usuario"; then
  echo "✅ Acceso a endpoint protegido exitoso"
else
  echo "❌ Error accediendo a endpoint protegido"
  echo "$PROTECTED_RESPONSE"
fi

echo ""
echo "🎉 Testing completado"
```

## ⚠️ Casos de Error a Verificar

### 1. Email duplicado en registro
```bash
# Intentar registrar el mismo email dos veces
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Usuario Duplicado",
    "email": "juan.perez@example.com",
    "password": "password123"
  }'
```

**Respuesta esperada:** HTTP 400 - "El email ya está registrado"

### 2. Credenciales incorrectas
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan.perez@example.com", 
    "password": "wrongpassword"
  }'
```

**Respuesta esperada:** HTTP 401 - "Email o contraseña incorrectos"

### 3. Token inválido
```bash
curl -X GET "http://localhost:8000/auth/me" \
  -H "Authorization: Bearer invalid_token"
```

**Respuesta esperada:** HTTP 401 - "Token inválido o expirado"

### 4. Contraseña actual incorrecta
```bash
curl -X PUT "http://localhost:8000/auth/change-password" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "wrongpassword",
    "new_password": "newpassword456"
  }'
```

**Respuesta esperada:** HTTP 400 - "Contraseña actual incorrecta"

## 📝 Checklist de Verificación

- [ ] Registro de usuario nuevo funciona
- [ ] Login con credenciales correctas funciona  
- [ ] Login con credenciales incorrectas falla apropiadamente
- [ ] Endpoint `/auth/me` retorna información del usuario
- [ ] Cambio de contraseña funciona
- [ ] Renovación de token funciona
- [ ] Token hardcodeado sigue funcionando (compatibilidad)
- [ ] JWT tokens funcionan en endpoints protegidos
- [ ] Tokens inválidos son rechazados apropiadamente
- [ ] Registro con email duplicado falla apropiadamente

## 🚀 Siguiente Paso: Frontend

Una vez que todos los tests pasen, proceder con la implementación del frontend (Fase 2).
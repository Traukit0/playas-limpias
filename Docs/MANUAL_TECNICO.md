# 📋 MANUAL TÉCNICO - PROYECTO PLAYAS LIMPIAS

**Versión:** 1.0  
**Fecha:** Enero 2025  
**Proyecto:** MVP - Monitoreo Ambiental de Acuicultura  
**Región:** Los Lagos, Chiloé, Chile  

---

## 📋 ÍNDICE

1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Requisitos del Sistema](#requisitos-del-sistema)
4. [Instalación y Configuración](#instalación-y-configuración)
5. [Despliegue en Desarrollo](#despliegue-en-desarrollo)
6. [Despliegue en Producción](#despliegue-en-producción)
7. [Configuración de Base de Datos](#configuración-de-base-de-datos)
8. [Troubleshooting](#troubleshooting)
9. [Capturas de Pantalla](#capturas-de-pantalla)

---

## 🎯 INTRODUCCIÓN

### Propósito del Manual

Este manual técnico proporciona las instrucciones completas para el despliegue, configuración y mantenimiento del sistema **Playas Limpias**, una plataforma web para el monitoreo ambiental de residuos provenientes de la acuicultura en la región de Los Lagos, provincia de Chiloé, Chile.

### Características del Sistema

- **Backend:** API REST con FastAPI (Python)
- **Frontend:** Aplicación web con Next.js (React/TypeScript)
- **Base de Datos:** PostgreSQL con extensión PostGIS
- **Contenerización:** Docker Compose
- **Autenticación:** JWT con NextAuth
- **Mapas:** MapLibre GL JS para visualización geoespacial

### Versión del MVP

Este manual corresponde al **MVP (Minimum Viable Product)** del proyecto, que incluye:

- ✅ Sistema de autenticación completo
- ✅ Gestión de denuncias y evidencias
- ✅ Análisis geoespacial básico
- ✅ Generación de reportes PDF/KMZ
- ✅ Visor cartográfico interactivo
- ✅ Dashboard con métricas

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### Diagrama de Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Base de       │
│   (Next.js 15)  │◄──►│   (FastAPI)     │◄──►│   Datos         │
│   + MapLibre    │    │   + Services    │    │   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Autenticación │    │  Procesamiento  │    │   Datos         │
│   (NextAuth)    │    │  Geoespacial    │    │   Geoespaciales │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Componentes Principales

#### Backend (FastAPI)
- **Puerto:** 8000
- **Lenguaje:** Python 3.9+
- **Framework:** FastAPI 0.115.13
- **ORM:** SQLAlchemy 2.0.41 + GeoAlchemy2
- **Autenticación:** JWT con bcrypt

#### Frontend (Next.js)
- **Puerto:** 3000
- **Framework:** Next.js 15.2.4
- **Lenguaje:** TypeScript 5
- **UI:** React 19 + Tailwind CSS
- **Mapas:** MapLibre GL JS 3.6.2

#### Base de Datos
- **Motor:** PostgreSQL 17
- **Extensión:** PostGIS 3.5
- **Puerto:** 5432
- **Contenedor:** postgis/postgis:17-3.5

---

## 💻 REQUISITOS DEL SISTEMA

### Requisitos Mínimos de Hardware

#### Desarrollo Local
- **CPU:** 2 cores
- **RAM:** 4GB
- **Almacenamiento:** 20GB libre
- **Red:** Conexión a internet

#### Producción
- **CPU:** 4 cores
- **RAM:** 8GB
- **Almacenamiento:** 50GB libre
- **Red:** Conexión estable a internet

### Requisitos de Software

#### Sistema Operativo
- **Windows:** 10/11 (64-bit)
- **macOS:** 10.15+
- **Linux:** Ubuntu 20.04+, CentOS 8+

#### Software Requerido
- **Docker:** 20.10+
- **Docker Compose:** 2.0+
- **Git:** 2.30+
- **Node.js:** 18+ (para desarrollo local)
- **Python:** 3.9+ (para desarrollo local)

### Puertos Requeridos

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| Frontend | 3000 | Aplicación web Next.js |
| Backend | 8000 | API FastAPI |
| Base de Datos | 5432 | PostgreSQL/PostGIS |

---

## ⚙️ INSTALACIÓN Y CONFIGURACIÓN

### Paso 1: Clonar el Repositorio

```bash
# Clonar el repositorio
git clone [URL_DEL_REPOSITORIO]
cd playas-limpias

# Verificar la estructura del proyecto
ls -la
```

**Estructura esperada:**
```
playas-limpias/
├── backend/
├── frontend/
├── db/
├── docker-compose.yml
├── .env
└── README.md
```

### Paso 2: Configurar Variables de Entorno

#### Archivo Principal (.env)
```bash
# Crear archivo .env en la raíz del proyecto
cp .env.example .env
```

**Contenido del archivo .env:**
```env
# Base de datos PostgreSQL
POSTGRES_DB=playasgdb
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin123
```

#### Backend (.env)
```bash
# Crear archivo .env en el directorio backend
cd backend
cp .env.example .env
```

**Contenido del archivo backend/.env:**
```env
# Conexión a base de datos
DATABASE_URL=postgresql+psycopg2://admin:admin123@db:5432/playasgdb

# Configuración JWT
SECRET_KEY=dev-secret-key-change-in-production-playas-limpias-2025
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Configuración del servidor
SERVER_HOST=localhost
SERVER_PORT=8000
```

#### Frontend (.env.local)
```bash
# Crear archivo .env.local en el directorio frontend
cd ../frontend
cp .env.local.example .env.local
```

**Contenido del archivo frontend/.env.local:**
```env
# Configuración de API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Configuración de autenticación
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=nextauth-secret-change-in-production-playas-limpias-2025

# Ambiente
NODE_ENV=development
```

### Paso 3: Verificar Docker

```bash
# Verificar que Docker esté instalado y funcionando
docker --version
docker-compose --version

# Verificar que Docker esté ejecutándose
docker info
```

---

## 🚀 DESPLIEGUE EN DESARROLLO

### Paso 1: Construir e Iniciar Servicios

```bash
# Desde la raíz del proyecto
cd playas-limpias

# Construir e iniciar todos los servicios
docker-compose up --build -d

# Verificar que todos los servicios estén ejecutándose
docker-compose ps
```

**Salida esperada:**
```
NAME                COMMAND                  SERVICE             STATUS              PORTS
playas_postgis      "docker-entrypoint.s…"   db                  running             0.0.0.0:5432->5432/tcp
playas_backend      "uvicorn main:app --…"   backend             running             0.0.0.0:8000->8000/tcp
playas_frontend     "npm run dev"            frontend            running             0.0.0.0:3000->3000/tcp
```

### Paso 2: Verificar Servicios

#### Verificar Base de Datos
```bash
# Conectar a la base de datos
docker exec -it playas_postgis psql -U admin -d playasgdb

# Verificar tablas
\dt

# Salir de psql
\q
```

#### Verificar Backend
```bash
# Verificar que la API esté funcionando
curl http://localhost:8000/docs

# Verificar logs del backend
docker-compose logs backend
```

#### Verificar Frontend
```bash
# Verificar que el frontend esté funcionando
curl http://localhost:3000

# Verificar logs del frontend
docker-compose logs frontend
```

### Paso 3: Acceder a la Aplicación

**URLs de acceso:**
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Documentación API:** http://localhost:8000/docs
- **Base de datos:** localhost:5432

---

## 🏭 DESPLIEGUE EN PRODUCCIÓN

### Paso 1: Preparar Servidor

#### Requisitos del Servidor
- **Sistema Operativo:** Ubuntu 20.04 LTS o superior
- **Acceso SSH** configurado
- **Firewall** configurado
- **Dominio** configurado (opcional)

#### Instalar Dependencias
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Agregar usuario al grupo docker
sudo usermod -aG docker $USER
```

### Paso 2: Configurar Variables de Producción

#### Archivo .env de Producción
```env
# Base de datos
POSTGRES_DB=playasgdb
POSTGRES_USER=admin
POSTGRES_PASSWORD=[CONTRASEÑA_SEGURA_PRODUCCIÓN]

# Backend
DATABASE_URL=postgresql+psycopg2://admin:[CONTRASEÑA_SEGURA_PRODUCCIÓN]@db:5432/playasgdb
SECRET_KEY=[CLAVE_SECRETA_SEGURA_PRODUCCIÓN]
ACCESS_TOKEN_EXPIRE_MINUTES=15

# Frontend
NEXT_PUBLIC_API_URL=https://[TU_DOMINIO].com
NEXTAUTH_URL=https://[TU_DOMINIO].com
NEXTAUTH_SECRET=[CLAVE_SECRETA_NEXTAUTH_PRODUCCIÓN]

# Ambiente
ENVIRONMENT=production
NODE_ENV=production
```

### Paso 3: Desplegar en Producción

```bash
# Clonar repositorio en servidor
git clone [URL_DEL_REPOSITORIO]
cd playas-limpias

# Configurar variables de entorno
cp .env.example .env
# Editar .env con valores de producción

# Construir e iniciar servicios
docker-compose up --build -d

# Verificar servicios
docker-compose ps
```

---

## 🗄️ CONFIGURACIÓN DE BASE DE DATOS

### Estructura de la Base de Datos

El sistema utiliza PostgreSQL con extensión PostGIS para el manejo de datos geoespaciales. La base de datos incluye 8 tablas principales:

#### Tablas Principales

**1. usuarios**
```sql
CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true,
    ultimo_acceso TIMESTAMP
);
```

**2. estados_denuncia**
```sql
CREATE TABLE estados_denuncia (
    id_estado SERIAL PRIMARY KEY,
    estado TEXT UNIQUE NOT NULL
);
```

**3. denuncias**
```sql
CREATE TABLE denuncias (
    id_denuncia SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES usuarios(id_usuario),
    id_estado INTEGER REFERENCES estados_denuncia(id_estado),
    fecha_inspeccion TIMESTAMP NOT NULL,
    fecha_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lugar TEXT,
    observaciones TEXT
);
```

**4. evidencias**
```sql
CREATE TABLE evidencias (
    id_evidencia SERIAL PRIMARY KEY,
    id_denuncia INTEGER REFERENCES denuncias(id_denuncia),
    coordenadas GEOMETRY(Point, 4326) NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    descripcion TEXT,
    foto_url TEXT
);
```

**5. concesiones**
```sql
CREATE TABLE concesiones (
    id_concesion SERIAL PRIMARY KEY,
    codigo_centro INTEGER NOT NULL,
    titular TEXT NOT NULL,
    tipo TEXT,
    nombre TEXT,
    region TEXT,
    geom GEOMETRY(MultiPolygon, 4326) NOT NULL
);
```

**6. analisis_denuncia**
```sql
CREATE TABLE analisis_denuncia (
    id_analisis SERIAL PRIMARY KEY,
    id_denuncia INTEGER REFERENCES denuncias(id_denuncia),
    fecha_analisis TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    distancia_buffer NUMERIC NOT NULL,
    metodo TEXT,
    observaciones TEXT,
    buffer_geom GEOMETRY(MultiPolygon, 4326)
);
```

**7. resultado_analisis**
```sql
CREATE TABLE resultado_analisis (
    id_resultado SERIAL PRIMARY KEY,
    id_analisis INTEGER REFERENCES analisis_denuncia(id_analisis),
    id_concesion INTEGER REFERENCES concesiones(id_concesion),
    interseccion_valida BOOLEAN,
    distancia_minima NUMERIC
);
```

**8. los_lagos**
```sql
CREATE TABLE los_lagos (
    id SERIAL PRIMARY KEY,
    geom GEOMETRY(MultiPolygon, 4326),
    fid INTEGER
);
```

### Inicialización de la Base de Datos

#### Ejecutar Script de Esquema
```bash
# Conectar a la base de datos
docker exec -it playas_postgis psql -U admin -d playasgdb

# Ejecutar script de esquema
\i /db/schema_bd.sql

# Verificar tablas creadas
\dt

# Salir
\q
```

#### Insertar Datos Iniciales
```sql
-- Insertar estados de denuncia
INSERT INTO estados_denuncia (estado) VALUES 
('Pendiente'),
('En Proceso'),
('Completado'),
('Cancelado');

-- Insertar usuario administrador (opcional)
-- Nota: El password_hash debe ser generado usando bcrypt
INSERT INTO usuarios (nombre, email, password_hash, activo) VALUES 
('Administrador', 'admin@playaslimpias.cl', '[HASH_GENERADO_CON_BCRYPT]', true);
```

#### Verificar Estructura de Tablas
```sql
-- Verificar todas las tablas creadas
\dt

-- Verificar extensión PostGIS
SELECT PostGIS_Version();

-- Verificar índices geoespaciales
SELECT indexname, tablename, indexdef 
FROM pg_indexes 
WHERE indexname LIKE '%gist%';
```

### Índices Geoespaciales

```sql
-- Crear índices para optimizar consultas geoespaciales
-- Estos índices mejoran significativamente el rendimiento de consultas espaciales

-- Índice para coordenadas de evidencias (puntos GPS)
CREATE INDEX idx_evidencias_coordenadas ON evidencias USING GIST (coordenadas);

-- Índice para geometrías de concesiones (polígonos)
CREATE INDEX idx_concesiones_geom ON concesiones USING GIST (geom);

-- Índice para buffers de análisis (polígonos)
CREATE INDEX idx_analisis_buffer_geom ON analisis_denuncia USING GIST (buffer_geom);

-- Índice para geometría de la región de los lagos
CREATE INDEX idx_los_lagos_geom ON los_lagos USING GIST (geom);

-- Verificar índices creados
SELECT schemaname, tablename, indexname, indexdef 
FROM pg_indexes 
WHERE indexname LIKE '%gist%' 
ORDER BY tablename;
```

### Relaciones entre Tablas

```
usuarios (1) ──── (N) denuncias
estados_denuncia (1) ──── (N) denuncias
denuncias (1) ──── (N) evidencias
denuncias (1) ──── (N) analisis_denuncia
analisis_denuncia (1) ──── (N) resultado_analisis
concesiones (1) ──── (N) resultado_analisis
```

---

## 🔧 TROUBLESHOOTING

### Problemas Comunes

#### 1. Servicios No Inician

**Síntoma:** `docker-compose up` falla
```bash
# Verificar logs
docker-compose logs

# Verificar puertos en uso
netstat -tulpn | grep :3000
netstat -tulpn | grep :8000
netstat -tulpn | grep :5432

# Solución: Detener servicios que usen los puertos
sudo lsof -ti:3000 | xargs kill -9
sudo lsof -ti:8000 | xargs kill -9
sudo lsof -ti:5432 | xargs kill -9
```

#### 2. Error de Conexión a Base de Datos

**Síntoma:** `Connection refused` o `database does not exist`
```bash
# Verificar que el contenedor de BD esté ejecutándose
docker-compose ps db

# Verificar logs de la base de datos
docker-compose logs db

# Conectar manualmente a la base de datos
docker exec -it playas_postgis psql -U admin -d playasgdb

# Si la base de datos no existe, crearla
docker exec -it playas_postgis createdb -U admin playasgdb
```

#### 3. Error de Permisos en Archivos

**Síntoma:** `Permission denied` al acceder a archivos
```bash
# Verificar permisos
ls -la backend/fotos/
ls -la logs/

# Corregir permisos
sudo chown -R $USER:$USER backend/fotos/
sudo chown -R $USER:$USER logs/
chmod -R 755 backend/fotos/
chmod -R 755 logs/
```

#### 4. Error de Memoria Insuficiente

**Síntoma:** Contenedores se reinician o fallan
```bash
# Verificar uso de memoria
docker stats

# Aumentar memoria disponible para Docker
# En Docker Desktop: Settings > Resources > Memory
# En Linux: editar /etc/docker/daemon.json
```

#### 5. Error de Red

**Síntoma:** Frontend no puede conectar con Backend
```bash
# Verificar conectividad entre contenedores
docker exec -it playas_frontend ping backend
docker exec -it playas_backend ping frontend

# Verificar variables de entorno
docker exec -it playas_frontend env | grep API
```

### Logs de Debug

#### Habilitar Logs Detallados
```bash
# Backend con logs detallados
docker-compose up backend --build

# Frontend con logs detallados
docker-compose up frontend --build

# Ver logs en tiempo real
docker-compose logs -f --tail=100
```

#### Verificar Configuración
```bash
# Verificar variables de entorno
docker exec -it playas_backend env
docker exec -it playas_frontend env

# Verificar archivos de configuración
docker exec -it playas_backend cat config.py
docker exec -it playas_frontend cat next.config.mjs
```

---

## 📸 CAPTURAS DE PANTALLA

### Capturas Requeridas

#### 1. Dashboard Principal
**Archivo:** `screenshots/dashboard.png`
**Descripción:** Captura del dashboard principal mostrando métricas, estadísticas y acciones rápidas
**Elementos a mostrar:**
- Panel de métricas generales
- Gráfico de inspecciones recientes
- Mapa de último análisis
- Menú de navegación
- Barra de estado del sistema

#### 2. Wizard de Inspección - Paso 1
**Archivo:** `screenshots/wizard-step1.png`
**Descripción:** Primer paso del wizard de inspección con formulario de información general
**Elementos a mostrar:**
- Formulario de datos básicos
- Selector de inspector
- Campo de observaciones
- Botones de navegación
- Indicador de progreso

#### 3. Wizard de Inspección - Paso 2
**Archivo:** `screenshots/wizard-step2.png`
**Descripción:** Segundo paso del wizard con carga de archivo GPX
**Elementos a mostrar:**
- Área de drag & drop para archivo GPX
- Lista de waypoints cargados
- Configuración de zona horaria UTC
- Estadísticas de procesamiento
- Validación de coordenadas

#### 4. Wizard de Inspección - Paso 3
**Archivo:** `screenshots/wizard-step3.png`
**Descripción:** Tercer paso del wizard con subida de fotografías
**Elementos a mostrar:**
- Área de subida de imágenes
- Preview de fotografías
- Metadatos EXIF extraídos
- Asociación con waypoints
- Controles de edición

#### 5. Wizard de Inspección - Paso 4
**Archivo:** `screenshots/wizard-step4.png`
**Descripción:** Cuarto paso del wizard con análisis geoespacial
**Elementos a mostrar:**
- Mapa interactivo con evidencias
- Configuración de buffer
- Previsualización de resultados
- Lista de concesiones afectadas
- Controles de análisis

#### 6. Wizard de Inspección - Paso 5
**Archivo:** `screenshots/wizard-step5.png`
**Descripción:** Quinto paso del wizard con resultados y descarga
**Elementos a mostrar:**
- Resumen de análisis
- Opciones de descarga (PDF/KMZ)
- Visualización de resultados
- Botón de finalización
- Confirmación de éxito

#### 7. Visor Cartográfico
**Archivo:** `screenshots/map-viewer.png`
**Descripción:** Visor cartográfico principal con múltiples capas
**Elementos a mostrar:**
- Mapa con capas de evidencias, concesiones y análisis
- Controles de capas (visibilidad)
- Barra de herramientas
- Panel de búsqueda
- Leyenda de capas

#### 8. Página de Historial
**Archivo:** `screenshots/historial.png`
**Descripción:** Página de historial con listado de inspecciones
**Elementos a mostrar:**
- Tabla de inspecciones
- Filtros por estado y fecha
- Estadísticas del período
- Opciones de descarga
- Paginación

#### 9. Análisis de Reincidencias
**Archivo:** `screenshots/reincidencias.png`
**Descripción:** Dashboard de análisis de reincidencias
**Elementos a mostrar:**
- Gráficos de patrones de contaminación
- Clasificación de riesgo por empresa
- Tabla de reincidencias
- Filtros de análisis
- Métricas de riesgo

#### 10. Documentación de API
**Archivo:** `screenshots/api-docs.png`
**Descripción:** Página de documentación automática de la API
**Elementos a mostrar:**
- Interfaz de Swagger/OpenAPI
- Lista de endpoints
- Ejemplos de requests/responses
- Botón de "Try it out"
- Esquemas de datos

---

## 📞 CONTACTO Y SOPORTE

### Información de Contacto

- **Proyecto:** Playas Limpias
- **Versión:** 1.0 (MVP)
- **Fecha de Documentación:** Enero 2025
- **Responsable Técnico:** [NOMBRE_DEL_RESPONSABLE]
- **Email:** [EMAIL_DE_CONTACTO]

### Recursos Adicionales

- **Repositorio:** [URL_DEL_REPOSITORIO]
- **Documentación API:** http://localhost:8000/docs
- **Issues:** [URL_DEL_SISTEMA_DE_ISSUES]
- **Wiki:** [URL_DEL_WIKI]

### Horarios de Soporte

- **Desarrollo:** Lunes a Viernes, 9:00 - 18:00
- **Emergencias:** 24/7 (solo para problemas críticos de producción)

---

*Este manual técnico corresponde al MVP del proyecto Playas Limpias y debe ser actualizado conforme evolucione el sistema.*

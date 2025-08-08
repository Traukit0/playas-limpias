# 📋 ANÁLISIS TÉCNICO COMPLETO - PROYECTO PLAYAS LIMPIAS

## 🎯 PROPÓSITO GENERAL Y ESPECÍFICO

**Playas Limpias** es una plataforma web para el monitoreo ambiental de residuos provenientes de la acuicultura en la región de Los Lagos, provincia de Chiloé, Chile.

### Objetivos Principales:
- **Gestión de inspecciones ambientales** en playas contaminadas
- **Análisis geoespacial** para determinar responsables de limpieza
- **Documentación fotográfica** con georreferenciación GPS
- **Generación de reportes** en PDF y KMZ
- **Identificación rápida** de concesiones acuícolas responsables

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### Stack Tecnológico Principal:
- **Backend:** FastAPI (Python) con arquitectura modular
- **Frontend:** Next.js 15 con React 19 y TypeScript
- **Base de datos:** PostgreSQL + PostGIS para datos geoespaciales
- **Contenerización:** Docker Compose para desarrollo y despliegue
- **Autenticación:** JWT con bcrypt para hashing de contraseñas

### Arquitectura de Componentes:
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Base de       │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│   Datos         │
│                 │    │                 │    │   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Autenticación │    │  Procesamiento  │    │   Datos         │
│   (JWT)         │    │  Geoespacial    │    │   Geoespaciales │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 📊 MODELOS DE DATOS Y RELACIONES

### Entidades Principales:

#### 1. **Usuario** (`usuarios`)
```sql
- id_usuario (PK, SERIAL)
- nombre (TEXT, NOT NULL)
- email (TEXT, UNIQUE, NOT NULL)
- password_hash (TEXT, NULLABLE)
- fecha_registro (TIMESTAMP, DEFAULT NOW)
- activo (BOOLEAN, DEFAULT TRUE)
- ultimo_acceso (TIMESTAMP, NULLABLE)
```

#### 2. **Denuncia** (`denuncias`)
```sql
- id_denuncia (PK, SERIAL)
- id_usuario (FK → usuarios)
- id_estado (FK → estados_denuncia)
- fecha_inspeccion (TIMESTAMP, NOT NULL)
- fecha_ingreso (TIMESTAMP, DEFAULT NOW)
- lugar (TEXT, NULLABLE)
- observaciones (TEXT, NULLABLE)
```

#### 3. **Evidencia** (`evidencias`)
```sql
- id_evidencia (PK, SERIAL)
- id_denuncia (FK → denuncias)
- coordenadas (GEOMETRY(POINT, 4326), NOT NULL)
- fecha (DATE, NOT NULL)
- hora (TIME, NOT NULL)
- descripcion (TEXT, NULLABLE)
- foto_url (TEXT, NULLABLE)
```

#### 4. **Concesión** (`concesiones`)
```sql
- id_concesion (PK, SERIAL)
- codigo_centro (INTEGER, NOT NULL)
- titular (TEXT, NOT NULL)
- tipo (TEXT, NULLABLE)
- nombre (TEXT, NULLABLE)
- region (TEXT, NULLABLE)
- geom (GEOMETRY(MULTIPOLYGON, 4326), NOT NULL)
```

#### 5. **Análisis** (`analisis_denuncia`)
```sql
- id_analisis (PK, SERIAL)
- id_denuncia (FK → denuncias)
- fecha_analisis (TIMESTAMP, DEFAULT NOW)
- distancia_buffer (NUMERIC, NOT NULL)
- metodo (TEXT, NULLABLE)
- observaciones (TEXT, NULLABLE)
- buffer_geom (GEOMETRY(MULTIPOLYGON, 4326), NULLABLE)
```

#### 6. **Resultado de Análisis** (`resultado_analisis`)
```sql
- id_resultado (PK, SERIAL)
- id_analisis (FK → analisis_denuncia)
- id_concesion (FK → concesiones)
- interseccion_valida (BOOLEAN, NULLABLE)
- distancia_minima (NUMERIC, NULLABLE)
```

### Diagrama de Relaciones:
```
usuarios (1) ──── (N) denuncias (1) ──── (N) evidencias
    │                                           │
    │                                           │
    └─── (1) ──── (N) analisis_denuncia (1) ───┘
                           │
                           │
                    (1) ──── (N) resultado_analisis (N) ──── (1) concesiones
```

---

## 🔧 COMPONENTES Y SERVICIOS PRINCIPALES

### Backend Services:

#### 1. **FotoService** (`foto_service.py`)
- **Funcionalidad:** Procesamiento de imágenes con EXIF
- **Características:**
  - Compresión y optimización automática
  - Extracción de metadatos GPS
  - Corrección de orientación EXIF
  - Gestión de almacenamiento organizado
  - Validación de tipos de archivo

#### 2. **Geoprocessing Services:**
- **Buffer Service** (`buffer.py`):
  - Genera buffers unificados desde evidencias
  - Recorte con capa de tierra firme
  - Soporte para diferentes distancias

- **Intersección Service** (`interseccion.py`):
  - Calcula intersecciones con concesiones
  - Calcula distancias mínimas
  - Valida intersecciones

#### 3. **Generadores de Reportes:**
- **MapGenerator** (`map_generator.py`):
  - Mapas estáticos con folium
  - Visualización de evidencias y buffers
  - Exportación en múltiples formatos

- **PDFGenerator** (`pdf_generator.py`):
  - Reportes en PDF con Jinja2
  - Plantillas personalizables
  - Inclusión de mapas y datos

- **KMZGenerator** (`kmz_generator.py`):
  - Archivos KMZ para Google Earth
  - Capas organizadas por tipo
  - Metadatos descriptivos

### Frontend Components:

#### 1. **InspectionWizard**
- Wizard de 5 pasos para inspecciones
- Gestión de estado centralizada
- Validación en cada paso

#### 2. **AnalysisMap**
- Visualización de análisis geoespacial
- Renderizado con Canvas
- Interactividad con datos reales

#### 3. **GPS Track Uploader**
- Carga de archivos GPX
- Parsing de waypoints
- Validación de formato

#### 4. **File Uploader**
- Subida de fotografías
- Preview en tiempo real
- Validación de tipos

#### 5. **AuthenticatedNavbar**
- Navegación con autenticación
- Gestión de sesión
- Menú contextual

---

## 🌐 ENDPOINTS Y RUTAS PRINCIPALES

### Autenticación:
```
POST /auth/register     - Registro de usuarios
POST /auth/login        - Inicio de sesión
GET  /auth/me           - Información del usuario actual
POST /auth/refresh      - Renovación de token
POST /auth/logout       - Cierre de sesión
PUT  /auth/change-password - Cambio de contraseña
```

### Denuncias:
```
POST /denuncias/                    - Crear denuncia
GET  /denuncias/                    - Listar denuncias
GET  /denuncias/mis-denuncias       - Denuncias del usuario
GET  /denuncias/{id}/detalles       - Detalles de denuncia
PUT  /denuncias/{id}/estado         - Cambiar estado
```

### Evidencias:
```
POST /evidencias/                   - Crear evidencia
GET  /evidencias/denuncia/{id}      - Evidencias de denuncia
POST /evidencias/fotos              - Subir fotos
GET  /evidencias/{id}/foto          - Obtener foto
```

### Análisis:
```
POST /analisis/                     - Ejecutar análisis
POST /analisis/preview              - Previsualizar análisis
GET  /analisis/{id}/pdf             - Generar PDF
GET  /analisis/{id}/kmz             - Generar KMZ
GET  /analisis/{id}/mapa            - Generar mapa
```

### Concesiones:
```
GET  /concesiones/                  - Listar concesiones
GET  /concesiones/{id}              - Detalles de concesión
```

### Estados:
```
GET  /estados_denuncia/             - Listar estados
```

---

## 🎨 PATRONES DE DISEÑO IDENTIFICADOS

### 1. **Dependency Injection**
- Uso de `Depends()` en FastAPI
- Inyección de dependencias automática
- Separación de responsabilidades

### 2. **Repository Pattern**
- Separación de modelos y lógica de negocio
- Abstracción de acceso a datos
- Reutilización de consultas

### 3. **Service Layer**
- Servicios especializados (FotoService, MapGenerator)
- Lógica de negocio centralizada
- Facilidad de testing

### 4. **Factory Pattern**
- Generadores de reportes
- Creación de objetos complejos
- Configuración flexible

### 5. **Observer Pattern**
- Hooks de React para estado
- Reactividad automática
- Gestión de efectos secundarios

### 6. **Middleware Pattern**
- Autenticación JWT
- Logging y monitoreo
- Validación de requests

### 7. **Wizard Pattern**
- Flujo de inspección paso a paso
- Validación incremental
- Navegación controlada

---

## 📦 DEPENDENCIAS EXTERNAS CLAVE

### Backend:
```
FastAPI==0.115.13           - Framework web moderno
SQLAlchemy==2.0.41          - ORM con soporte geoespacial
GeoAlchemy2==0.17.1         - Extensión geoespacial
PostGIS                      - Extensión geoespacial de PostgreSQL
Pillow==9.5.0               - Procesamiento de imágenes
python-jose[cryptography]==3.3.0 - JWT tokens
passlib[bcrypt]==1.7.4      - Hashing de contraseñas
xhtml2pdf==0.2.17           - Generación de PDFs
folium                       - Mapas estáticos
shapely==2.1.1              - Manipulación de geometrías
gpxpy==1.6.2                - Parsing de archivos GPX
exifread==3.0.0             - Lectura de metadatos EXIF
```

### Frontend:
```
Next.js 15.2.4              - Framework React con SSR
React 19.0.0                 - Biblioteca de UI
TypeScript 5                 - Tipado estático
Tailwind CSS 3.4.17         - Framework CSS
Radix UI                     - Componentes accesibles
Leaflet 1.9.4               - Mapas interactivos
React Hook Form 7.54.1      - Gestión de formularios
Zod 3.24.1                  - Validación de esquemas
React Leaflet 5.0.0         - Integración Leaflet-React
Next Auth 5.0.0-beta.4      - Autenticación
```

---

## 🔄 FLUJO DE TRABAJO PRINCIPAL

### 1. **Registro/Login**
```
Usuario → Registro/Login → Autenticación JWT → Dashboard
```

### 2. **Nueva Inspección (Wizard de 5 pasos)**
```
Paso 1: Información General
├── Datos básicos de inspección
├── Selección de inspector
└── Observaciones iniciales

Paso 2: Waypoints GPS
├── Carga de archivo GPX
├── Parsing de waypoints
└── Validación de coordenadas

Paso 3: Fotografías
├── Subida de imágenes
├── Extracción de metadatos EXIF
└── Asociación con waypoints

Paso 4: Análisis
├── Visualización en mapa
├── Configuración de buffer
└── Previsualización de resultados

Paso 5: Resultados
├── Generación de reportes
├── Descarga de PDF/KMZ
└── Finalización de inspección
```

### 3. **Análisis Geoespacial**
```
Evidencias → Buffer Generation → Intersección con Concesiones → Resultados
```

### 4. **Generación de Reportes**
```
Datos → Procesamiento → PDF/KMZ → Descarga
```

---

## ⚡ CARACTERÍSTICAS TÉCNICAS AVANZADAS

### Procesamiento Geoespacial:
- **PostGIS** para consultas espaciales complejas
- **Buffer generation** con distancias configurables
- **Intersección** con capas de concesiones
- **Cálculo de distancias** mínimas

### Procesamiento de Imágenes:
- **Extracción de metadatos EXIF** de fotografías
- **Corrección automática** de orientación
- **Compresión inteligente** con optimización
- **Validación de tipos** de archivo

### Generación de Reportes:
- **Mapas estáticos** con folium
- **PDFs dinámicos** con Jinja2
- **Archivos KMZ** para Google Earth
- **Metadatos descriptivos** incluidos

### Autenticación y Seguridad:
- **JWT tokens** con refresh automático
- **Hashing bcrypt** para contraseñas
- **Validación de esquemas** con Pydantic
- **CORS configurado** para desarrollo

### Interfaz de Usuario:
- **Responsive design** con Tailwind CSS
- **Componentes accesibles** con Radix UI
- **Mapas interactivos** con Leaflet
- **Formularios validados** con React Hook Form

---

## 📈 ESTADO ACTUAL DEL PROYECTO

### Completitud: **70%**

### ✅ Funcionalidades Implementadas:
- Sistema de autenticación completo
- Gestión de usuarios y denuncias
- Subida y procesamiento de fotos
- Análisis geoespacial básico
- Generación de reportes PDF/KMZ
- Interfaz de usuario responsive
- Contenerización con Docker

### 🔄 En Desarrollo:
- Optimización de análisis geoespacial
- Mejoras en la interfaz de usuario
- Testing automatizado
- Documentación técnica

### 📋 Pendientes:
- Implementación de notificaciones
- Dashboard avanzado con métricas
- API para integración externa
- Optimización de rendimiento

---

## 🛠️ CONFIGURACIÓN DE DESARROLLO

### Requisitos del Sistema:
- Docker y Docker Compose
- Node.js 18+ (para desarrollo local)
- Python 3.9+ (para desarrollo local)

### Comandos de Desarrollo:
```bash
# Iniciar el proyecto completo
docker-compose up --build

# Solo backend
docker-compose up backend

# Solo frontend
docker-compose up frontend

# Detener servicios
docker-compose down
```

### Variables de Entorno:
```env
# Base de datos
DATABASE_URL=postgresql://user:password@localhost:5432/playas_limpias

# Autenticación
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Servidor
SERVER_HOST=localhost
SERVER_PORT=8000
```

---

## 📚 DOCUMENTACIÓN ADICIONAL

- **README.md** - Descripción general del proyecto
- **BITACORA.md** - Seguimiento de avances por sprints
- **docker-compose.yml** - Configuración de contenedores
- **requirements.txt** - Dependencias de Python
- **package.json** - Dependencias de Node.js

---

*Este análisis técnico proporciona una comprensión integral del proyecto Playas Limpias, incluyendo su arquitectura, componentes, patrones de diseño y estado actual de desarrollo.* 
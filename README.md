# Playas Limpias - Plataforma para monitoreo ambiental de residuos de la acuicultura

## Descripción

Playas Limpias es una plataforma que facilita el registro, seguimiento y análisis geoespacial de denuncias por residuos de la acuicultura en playas. Busca aportar insumos claros y oportunos para identificar responsables de limpieza y apoyar la toma de decisiones.

## Componentes del proyecto

### 🧱 Backend (API + análisis geoespacial)

- **Framework**: FastAPI (Python)
- **Base de datos**: PostgreSQL + PostGIS
- **ORM**: SQLAlchemy + GeoAlchemy2
- **Geoprocesamiento**: Shapely; soporte de tracks GPX
- **Autenticación**: JWT
- **Servicios**: manejo de fotos, generación de reportes PDF/KMZ y mapas estáticos

Rutas principales expuestas: `auth`, `usuarios`, `denuncias`, `evidencias`, `concesiones`, `analisis`, `estados_denuncia`.

### 🗺️ Frontend (web)

- **Framework**: Next.js + React
- **Mapas**: Leaflet con React Leaflet
- **UI**: Tailwind CSS y componentes basados en Radix
- **Autenticación**: NextAuth

### 📦 Infraestructura

- **Orquestación**: Docker Compose (servicios `db`, `backend`, `frontend`)
- **Imágenes/puertos**: PostGIS (5432), FastAPI (8000), Next.js (3000)
- **Archivos y volúmenes**: persistencia de base de datos (`pg_data`) y logs del backend

## Funcionalidades clave

- Registro y gestión de denuncias ambientales
- Carga y consulta de evidencias fotográficas
- Análisis geoespacial para cruce con concesiones y áreas de interés
- Generación de reportes en PDF y archivos KMZ
- Visualización de información en mapas interactivos

## Estructura del repositorio

- `backend/`: API FastAPI, modelos, rutas, servicios y plantillas de reportes
- `frontend/`: aplicación Next.js, vistas, componentes y mapas
- `db/`: scripts y definición de esquema (`schema_bd.sql`)
- `docker-compose.yml`: orquestación de servicios
- `logs/`: registros de ejecución del backend

## Documentos

- `BITACORA.md` y carpeta `bitacora/`: registro de avances
- `ANALISIS_TECNICO_COMPLETO.md`: detalles técnicos y arquitectura

---

Este es un proyecto en curso.
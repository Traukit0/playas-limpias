# Playas Limpias - Plataforma para monitoreo ambiental de los residuos provenientes de la acuicultura

## Descripción del Proyecto

Playas Limpias es un proyecto nacido de la necesidad de contar con una herramienta informática que permita crear instrumentos de análisis para determinar en un corto período de tiempo responsables de limpiar playas contaminadas por residuos de la acuicultura. 

En la región de los lagos, provincia de Chiloé, la contaminación por residuos de la acuicultura en playas es uno de los principales problemas ambientales que aquejan a la región. En función de la normativa ambiental vigente, y considerando las herramientas actuales existentes para determinar responsables de ejecutar limpieza en playas, se requiere contar con una plataforma de fácil uso, intuitiva y confiable, que entregue insumos para ejecutar análisis de forma rápida a fin de acortar los tiempos de respuesta a denuncias ambientales.

## Stack Tecnológico

El proyecto se desarrollará utilizando las siguientes tecnologías:

## 🧱 Backend (procesamiento geoespacial + API)

| Tecnología                 | Rol                        | Comentarios                                                                 |
|---------------------------|----------------------------|------------------------------------------------------------------------------|
| PostgreSQL + PostGIS      | Base de datos geoespacial  | Estándar de facto para datos espaciales; permite consultas geográficas complejas. |
| Python + FastAPI          | API RESTful moderna        | Muy rápido, fácil de documentar con OpenAPI, perfecto para microservicios.  |
| SQLAlchemy + GeoAlchemy2  | ORM para PostGIS           | Facilita trabajar con geometrías desde Python.                              |
| GDAL / Fiona / Shapely    | Procesamiento geoespacial  | Manipulación avanzada de capas vectoriales y raster.                        |

## 🗺️ Frontend (visualización cartográfica interactiva)

| Tecnología                          | Rol                               | Comentarios                                                                 |
|-------------------------------------|------------------------------------|------------------------------------------------------------------------------|
| React                               | Framework moderno frontend         | Componentes reutilizables, fácil integración con bibliotecas JS de mapas.   |
| Leaflet.js                          | Mapas interactivos 2D             | Ligero y muy compatible con React. Alternativa moderna: MapLibre (fork de Mapbox GL). |
| react-leaflet / maplibre-gl-js      | Integración de mapas en React     | Permite capas, markers, rutas, popup de fotos, etc.                          |
| deck.gl                             | Visualización geoespacial avanzada| Para capas complejas o animaciones (heatmaps, trayectorias 3D).             |
| React Dropzone / FilePond           | Subida de archivos (fotos, tracks)| Para UI amigable al subir imágenes y GPX/KML.                                |

## 📦 DevOps / Infraestructura

| Tecnología                       | Rol                                         | Comentarios                                                                 |
|----------------------------------|----------------------------------------------|------------------------------------------------------------------------------|
| Docker + Docker Compose          | Contenerización del stack                   | Portabilidad y despliegue en servidores o nube.                             |
| NGINX                            | Proxy y servidor de archivos estáticos      | Frontend, fotos e incluso tiles si los necesitas servir tú.                |
| Cloudflare Tunnel / Tailscale    | Acceso remoto seguro en red local           | Evita abrir puertos o complicarte con redes.                               |
| S3 (MinIO o AWS)                 | Almacenamiento de imágenes/fotos GPS        | Ideal para centralizar fotos georreferenciadas.                            |
| Supabase (opcional)              | Reemplazo cloud para PostGIS + API + Auth   | Para un enfoque Backend as a Service (BaaS).                               |

## 📌 Documentos del proyecto

- [Bitácora de avances](./BITACORA.md)


## Este es un proyecto en curso
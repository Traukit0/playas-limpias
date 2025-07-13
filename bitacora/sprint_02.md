
## 🗓 Bitácora de Avance - Sprint 2

**Fecha inicio:** 2025-07-07  
**Semanas:** 2 y 3 de 10  

---

### ✅ Actividades realizadas

- Implementar pruebas funcionales de todos los endpoints del backend usando Swagger y/o Postman.
- Ejecutar casos de prueba end-to-end (ingreso de denuncia, evidencia, análisis y consulta de resultados).
- Validar el almacenamiento y recuperación de geometrías espaciales con evidencias y concesiones.
- Establecer el flujo básico de trabajo completo desde `/usuarios` hasta `/analisis`.
- Realizar mejoras menores a los esquemas y rutas si se detectan problemas en la integración de componentes.
- Documentar observaciones de comportamiento de la API para futuras validaciones.
- Modificado el endpoint de evidencias para incluir en cada punto gps datos de fecha y hora
- Modificar descripcion en /evidencias para que acepte texto que viene desde foto, eliminar timestamp LISTO
- Analizar implicancia de UTC en los puntos GPS
- La prueba de la API para ingresar fotos y comentarios se debe ejecutar desde Postman, debido a limitaciones de Swagger con multipart/form data. Swagger insiste en enviar líneas de campos separados como un solos string separado por comas.
- Se modifica lógica de servicio de fotos para respetar orientación / relación de aspecto
- Se añade funcionalidad para visualizar el buffer de intersección antes de llevar el análisis a la base de datos
---

### ⚠️ Dificultades encontradas

- 🧰 **Creación del backend base**:
  - Se estableció la estructura modular del proyecto (`/models`, `/routes`, `/schemas`, `/security`, etc.).
  - Configuración de CORS y variables de entorno mediante `python-dotenv`.
  - Inicialización de servidor con FastAPI y conexión a la base de datos a través de SQLAlchemy + GeoAlchemy2.
- 🔐 **Implementación de autenticación básica por token**:
  - Se protegieron todos los endpoints usando autenticación vía `HTTPBearer`.
- 🔄 **Desarrollo de endpoints REST funcionales**:
  - `POST` y `GET` para `/usuarios`, `/denuncias`, `/evidencias`, `/concesiones`, `/analisis`, y `/estados_denuncia`.
  - Se garantizó funcionalidad mínima para registrar y recuperar datos relevantes asociados a denuncias ambientales y sus análisis.
- 📋 **Documentación API generada automáticamente con Swagger (OpenAPI)**:
  - Se probaron todos los endpoints vía interfaz generada por FastAPI en `http://localhost:8000/docs`.
- 🖥 **Interoperabilidad entre frontend-backend con geometrías espaciales**:  
  Se identificó una dificultad clave en la manipulación de datos espaciales en la API:
  - No es posible enviar ni recibir directamente objetos `GEOMETRY(Point)` a través de JSON.
  - Se decidió trabajar con coordenadas `lat/lon` separadas en el frontend, que luego son convertidas internamente a objetos `Point` (con `from_shape(...)`) para ser almacenados en PostGIS.
  - Para devolver las geometrías, se implementó una conversión a WKT (`POINT(lon lat)`) y su posterior parseo, lo cual requiere lógica adicional.
  - Este mecanismo ha generado aprendizaje valioso sobre cómo manejar datos espaciales en sistemas RESTful.
- 🔍 **Validación de buffers y geometrías en el backend**:  
  - Al construir el endpoint de análisis (`/analisis/`), se utilizó una combinación de `ST_Union`, `ST_Buffer`, `ST_Intersects` y `ST_Distance`, que requiere transformar proyecciones (`4326` a `3857` y viceversa) para calcular distancias métricas reales.
  - Esto añadió complejidad y requirió testing adicional con datos reales.
  - Había un problema con operación de substract en el cálculo del buffer menos la geometría de tierra. Se solucionó a fin de que el buffer devuelva solamente lo correspondiente al mar.
---

### 🔜 Acciones pendientes o planificadas

- Iniciar implementación del módulo `/services/geoprocessing/` para encapsular lógica espacial.
- Diseñar estructura y lógica inicial del visor frontend con React + MapLibre.
- Comenzar pruebas de integración frontend-backend (fetch de geometrías desde `/concesiones` y `/evidencias`).
- Iniciar documentación técnica del API (OpenAPI + manual de uso).

### 🔜 Acciones pendientes o planificadas

- 🌍 Diseñar y montar visor web que consuma los endpoints `GET /evidencias`, `GET /concesiones`, y eventualmente `GET /analisis`.
- 📝 Generar documentación técnica y funcional de endpoints + estructura de carpetas, como base para entrega intermedia (PMV).
- 🧪 Ejecutar pruebas de integración end-to-end (ingreso denuncia + evidencia + análisis + revisión resultados).

---

### 📌 Observaciones adicionales

> En esta semana se debe consolidar la arquitectura técnica funcional del backend, asegurando que cada ruta cumpla su propósito y que el flujo completo desde ingreso hasta análisis esté operativo de forma básica, previo a su integración visual y a la adición de lógica avanzada de procesamiento espacial.

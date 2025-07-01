## 🗓 Bitácora de Avance - Semana 1

**Fecha:** 2025-06-23  
**Semana:** 1 de 12  

---

### ✅ Actividades realizadas

- Elección del stack tecnológico a utilizar y su implementación: PostgreSQL + PostGIS, despliegue en contendor local a través de [docker-compose.yml](/docker-compose.yml)
- Definición de [esquema base de datos](/db/schema.sql).
- Pruebas básicas de ingreso de datos a la BD para corroborar estructura de la misma.
- Documentación técnica preliminar sobre estructura BD.
- Creación de estructura básica inicial para el backend

---

### ⚠️ Dificultades encontradas

- Una opción posible fue utilizar Supabase ya que a la fecha de comienzo del proyecto consta con soporte para PostGIS. Se optó por contenedor local ya que Supabase aún carece de características avanzadas como procesamiento con GDAL.
- Se decidió utilizar DBeaver para conectar a la base de datos del contenedor, ya que funciona en entorno Windows y Linux. 

---

### 🔜 Acciones pendientes o planificadas

- Revisar estructura BD para que cubra un caso básico a fin de poder mostrar PMV.

---

**Observaciones adicionales:**
> Se da inicio al proyecto creando la estructura de datos para el mismo, el diseño de la base de datos y la estructura de tablas.




## 🗓 Bitácora de Avance - Semana 1

**Fecha:** 2025-06-23  
**Semana:** 1 de 12  

---

### ✅ Actividades realizadas

- 📦 **Elección e implementación del stack tecnológico principal**:
  - PostgreSQL + PostGIS como motor de base de datos geoespacial.
  - Despliegue local mediante [docker-compose.yml](/docker-compose.yml), con volúmenes persistentes para asegurar conservación de datos.
- 🧱 **Definición y ejecución del esquema de base de datos**:
  - Se diseñó y ejecutó el archivo [schema.sql](/db/schema.sql) que incluye las siguientes tablas: `usuarios`, `denuncias`, `evidencias`, `concesiones`, `estados_denuncia`, `analisis_denuncia` y `resultado_analisis`.
- 🧪 **Validación de integridad del modelo de datos**:
  - Ingreso manual de registros desde DBeaver para confirmar estructura y relaciones foráneas.
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

---

### ⚠️ Dificultades encontradas

- 💡 **Evaluación inicial de Supabase como alternativa a PostGIS**:  
  Se descartó en esta etapa por limitaciones en procesamiento geoespacial avanzado (GDAL, análisis vectorial), a pesar de su soporte nativo para PostGIS.
- 🖥 **Interoperabilidad entre frontend-backend con geometrías espaciales**:  
  Se identificó una dificultad clave en la manipulación de datos espaciales en la API:
  - No es posible enviar ni recibir directamente objetos `GEOMETRY(Point)` a través de JSON.
  - Se decidió trabajar con coordenadas `lat/lon` separadas en el frontend, que luego son convertidas internamente a objetos `Point` (con `from_shape(...)`) para ser almacenados en PostGIS.
  - Para devolver las geometrías, se implementó una conversión a WKT (`POINT(lon lat)`) y su posterior parseo, lo cual requiere lógica adicional.
  - Este mecanismo ha generado aprendizaje valioso sobre cómo manejar datos espaciales en sistemas RESTful.
- 🔍 **Validación de buffers y geometrías en el backend**:  
  - Al construir el endpoint de análisis (`/analisis/`), se utilizó una combinación de `ST_Union`, `ST_Buffer`, `ST_Intersects` y `ST_Distance`, que requiere transformar proyecciones (`4326` a `3857` y viceversa) para calcular distancias métricas reales.
  - Esto añadió complejidad y requirió testing adicional con datos reales.

---

### 🔜 Acciones pendientes o planificadas

- 🔄 Implementar capa de servicios (`/services/geoprocessing/`) para abstraer lógica geoespacial y separar responsabilidades del backend.
- 🌍 Diseñar y montar visor web que consuma los endpoints `GET /evidencias`, `GET /concesiones`, y eventualmente `GET /analisis`.
- 📝 Generar documentación técnica y funcional de endpoints + estructura de carpetas, como base para entrega intermedia (PMV).
- 🧪 Ejecutar pruebas de integración end-to-end (ingreso denuncia + evidencia + análisis + revisión resultados).

---

### 📌 Observaciones adicionales

> Se ha completado el desarrollo del esqueleto funcional mínimo del backend, el cual permite gestionar usuarios, denuncias, evidencias georreferenciadas, centros de cultivo (concesiones) y ejecutar análisis espaciales automatizados.  
>
> Todo lo implementado está en línea directa con los objetivos definidos en el documento del anteproyecto y el informe técnico del proyecto de título, validando la factibilidad y consistencia del enfoque propuesto.

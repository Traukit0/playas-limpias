
## 🗓 Bitácora de Avance - Sprint 4

**Fecha inicio:** 2025-08-04  
**Semanas:** 7 y 8 de 10  

---

### ✅ Actividades realizadas

- Se crea el endpoint "mis denuncias", donde se compila toda la información de denuncias ingresadas al sistema
- Dentro de este nuevo endpoint, se crea nueva lógica para revisar detalles individuales de denuncias. Por cada denuncia pueden visualizarse los resultados, fotografías, coordenadas, etc. En definitiva la información de cada denuncia puede visualizarse de forma completa (HU28).
- El estado de cada denuncia puede cambiarse a través de este nuevo endpoint, además de poder ingresar un nuevo comentario para justificar este cambio (HU29).
- Cambios menores en UI/UX, se agrega imagen de fondo a pantalla de login / register y se cambia el tipo de letra
- **Implementación del visor cartográfico general con MapLibre GL JS**
- Se desarrolla sistema completo de capas geográficas (evidencias, concesiones, análisis) con controles de visibilidad
- Se implementa funcionalidad de popups informativos al hacer click en elementos del mapa
- Se corrige problema de coordenadas en consultas PostGIS (orden lat/lng vs lng/lat)
- Se optimiza orden de dibujado de capas: evidencias (superior), concesiones (media), análisis (base)
- Se implementa sistema de conteo dinámico de elementos por capa
- **Sistema de búsqueda avanzada implementado:**
- Búsqueda por centro de cultivo, titular, lugar de denuncia
- Resultados organizados por prioridad: análisis → denuncias → reincidencias → concesiones
- Navegación directa al mapa al hacer click en resultados
- Análisis de reincidencias por titular y centro de cultivo
- **Optimización de rendimiento del mapa:**
- Debouncing inteligente (500ms) durante movimiento del mapa
- Sistema de caché de 30 segundos para evitar llamadas duplicadas
- Throttling a 60fps para eventos de movimiento
- Indicadores visuales mejorados (carga vs actualización)
- **Mejoras en popups informativos:**
- Popup de análisis expandido con información de denuncia asociada
- Eliminación de observaciones duplicadas
- Información completa: lugar, fechas, método, buffer, concesiones afectadas
- **Corrección de errores de bucle infinito:**
- Optimización de useEffects y useCallbacks
- Uso de refs para evitar re-renders innecesarios
- Cleanup automático de timeouts
- **Desarrollo de página de historial completa:**
- Reemplazo de datos mock por datos reales desde backend
- Implementación de filtros por estado y búsqueda de texto
- Funcionalidad de descarga de PDF y KMZ para cada denuncia
- Estadísticas detalladas (total, por estado, último mes)
- **Creación de página de reincidencias:**
- Análisis visual de empresas con centros de cultivo involucrados en denuncias
- Clasificación de riesgo (alto, medio, bajo) basada en denuncias y centros
- Múltiples vistas: tabla, tarjetas y gráficos
- Filtros por nivel de riesgo y búsqueda por empresa
- **Rediseño del dashboard principal:**
- Eliminación de datos falsos y reemplazo con datos reales
- Simplificación de interfaz con acciones rápidas
- Optimización de layout para mejor usabilidad
---

### ⚠️ Dificultades encontradas

- Se debió iterar varias veces sobre el componente para desplegar fotos para que quedase visualmente fácil de entender
- **Problemas técnicos en implementación del mapa:**
- Errores de coordenadas en consultas PostGIS que requerían corrección del orden de parámetros
- Conflictos con capas de hover que causaban errores de consola
- Dificultades iniciales con la configuración de capas interactivas en MapLibre
- Se requirió simplificar el sistema de hover para evitar complejidad innecesaria
- **Problemas de rendimiento identificados y resueltos:**
- Over-rendering durante zoom y pan del mapa (7 movimientos = 7 renderizados)
- Llamadas excesivas a la API durante navegación
- Bucles infinitos por dependencias circulares en useEffects
- Errores de "Maximum update depth exceeded" en consola
- **Desafíos en implementación de búsqueda:**
- Ordenamiento correcto de resultados por relevancia
- Navegación precisa a geometrías específicas
- Manejo de diferentes tipos de datos (análisis, denuncias, concesiones)
- **Problemas en desarrollo de páginas adicionales:**
- Errores de endpoints 404/500 durante desarrollo de historial
- Dificultades con lógica de descarga de PDF/KMZ (dependencia de id_analisis)
- Errores de sintaxis JSX en componentes de reincidencias
- Problemas con tipos de datos en consultas SQL (STRING_AGG con enteros)
- **Desafíos en optimización del dashboard:**
- Integración compleja de Leaflet para mapa de último análisis
- Errores de bounds en mapas Leaflet
- Decisiones de diseño entre funcionalidad vs simplicidad
---

### 🔜 Acciones pendientes o planificadas

- Aún quedan modificaciones por realizar en la UI, para hacer mas explicativas algunas partes del wizard de inspeccción
- **Mejoras pendientes en el visor cartográfico:**
- Implementar herramientas de medición y dibujo (barra de herramientas eliminada por ahora)
- Agregar filtros avanzados por región, tipo de concesión, fecha
- Optimizar performance para grandes volúmenes de datos
- Implementar clustering automático para evidencias
- Funcionalidad de exportar/compartir mapas
- Ajustes menores de UI/UX (colores, grosores, iconos)
- **Funcionalidades adicionales consideradas:**
- Modo de comparación de períodos
- Estadísticas en tiempo real del área visible
- Integración con reportes PDF/KMZ desde el mapa
- **Mejoras pendientes en páginas desarrolladas:**
- Optimización de consultas SQL para mejor rendimiento
- Implementación de paginación en tablas grandes
- Mejoras en visualización de gráficos de reincidencias
- Exportación de datos de reincidencias (CSV, Excel)

---

### 📌 Observaciones adicionales

> El visor cartográfico representa un avance significativo en la funcionalidad del sistema, permitiendo visualización geoespacial completa de todos los datos del proyecto. La implementación con MapLibre GL JS proporciona una base sólida para futuras expansiones del sistema de mapas.

> Se logró resolver problemas complejos de coordenadas y optimización de consultas PostGIS, estableciendo buenas prácticas para el manejo de datos geoespaciales en el proyecto.

> La arquitectura modular implementada (hooks personalizados, componentes reutilizables) facilita el mantenimiento y extensión futura del sistema de mapas.

> **Logros destacados del Sprint 4:**
> - Rendimiento del mapa optimizado: 90% menos llamadas a la API durante navegación
> - Sistema de búsqueda funcional y navegación directa al mapa
> - Experiencia de usuario mejorada con debouncing y caché inteligente
> - Errores de bucle infinito completamente eliminados
> - Popups informativos expandidos con información contextual completa
> - **Páginas completadas y funcionales:**
> - Historial de denuncias con datos reales y funcionalidad completa
> - Análisis de reincidencias con sistema de clasificación de riesgo
> - Dashboard optimizado y simplificado
> - **Backend expandido:**
> - Nuevos endpoints para historial, reincidencias y estadísticas
> - Consultas SQL complejas para análisis de reincidencias
> - Integración completa con sistema de autenticación

> **Impacto en la experiencia del usuario:**
> - Navegación fluida sin interrupciones durante zoom/pan
> - Búsqueda rápida y resultados organizados por relevancia
> - Feedback visual apropiado durante cargas y actualizaciones
> - Interfaz responsiva y profesional
> - **Nuevas funcionalidades completadas:**
> - Historial completo con filtros y descargas funcionales
> - Análisis de reincidencias con clasificación de riesgo visual
> - Dashboard simplificado y enfocado en acciones principales
> - Eliminación de redundancias en navegación


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
---

### ⚠️ Dificultades encontradas

- Se debió iterar varias veces sobre el componente para desplegar fotos para que quedase visualmente fácil de entender
- **Problemas técnicos en implementación del mapa:**
- Errores de coordenadas en consultas PostGIS que requerían corrección del orden de parámetros
- Conflictos con capas de hover que causaban errores de consola
- Dificultades iniciales con la configuración de capas interactivas en MapLibre
- Se requirió simplificar el sistema de hover para evitar complejidad innecesaria
---

### 🔜 Acciones pendientes o planificadas

- Aún quedan modificaciones por realizar en la UI, para hacer mas explicativas algunas partes del wizard de inspeccción
- **Mejoras pendientes en el visor cartográfico:**
- Implementar herramientas de medición y dibujo
- Agregar funcionalidad de búsqueda y filtros avanzados
- Optimizar performance para grandes volúmenes de datos
- Implementar clustering automático para evidencias
- Mejorar velocidad de carga
- Darle funcionalidad a la barra buscar / filtros
- Darle funcionalidad a la barra de herramientas
- Ver que pasa con los botones exportar / compartir
- Cambiar colores, grosores de líneas

---

### 📌 Observaciones adicionales

> El visor cartográfico representa un avance significativo en la funcionalidad del sistema, permitiendo visualización geoespacial completa de todos los datos del proyecto. La implementación con MapLibre GL JS proporciona una base sólida para futuras expansiones del sistema de mapas.

> Se logró resolver problemas complejos de coordenadas y optimización de consultas PostGIS, estableciendo buenas prácticas para el manejo de datos geoespaciales en el proyecto.

> La arquitectura modular implementada (hooks personalizados, componentes reutilizables) facilita el mantenimiento y extensión futura del sistema de mapas.

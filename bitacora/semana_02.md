
## 🗓 Bitácora de Avance - Semana 2

**Fecha:** 2025-06-30  
**Semana:** 2 de 12  

---

### ✅ Actividades realizadas

- Implementar pruebas funcionales de todos los endpoints del backend usando Swagger y/o Postman.
- Ejecutar casos de prueba end-to-end (ingreso de denuncia, evidencia, análisis y consulta de resultados).
- Validar el almacenamiento y recuperación de geometrías espaciales con evidencias y concesiones.
- Establecer el flujo básico de trabajo completo desde `/usuarios` hasta `/analisis`.
- Realizar mejoras menores a los esquemas y rutas si se detectan problemas en la integración de componentes.
- Documentar observaciones de comportamiento de la API para futuras validaciones.

---

### ⚠️ Dificultades encontradas

- (Registrar aquí cualquier error técnico, incompatibilidad, error en coordenadas, lógica de intersección, etc.)
- (Anotar también si hubo problemas al probar la autenticación, flujo de datos, o carga desde el frontend.)

---

### 🔜 Acciones pendientes o planificadas

- Iniciar implementación del módulo `/services/geoprocessing/` para encapsular lógica espacial.
- Diseñar estructura y lógica inicial del visor frontend con React + MapLibre.
- Comenzar pruebas de integración frontend-backend (fetch de geometrías desde `/concesiones` y `/evidencias`).
- Iniciar documentación técnica del API (OpenAPI + manual de uso).

---

### 📌 Observaciones adicionales

> En esta semana se debe consolidar la arquitectura técnica funcional del backend, asegurando que cada ruta cumpla su propósito y que el flujo completo desde ingreso hasta análisis esté operativo de forma básica, previo a su integración visual y a la adición de lógica avanzada de procesamiento espacial.

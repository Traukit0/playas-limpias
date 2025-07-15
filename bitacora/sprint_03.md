
## 🗓 Bitácora de Avance - Sprint 3

**Fecha inicio:** 2025-07-21  
**Semanas:** 5 y 6 de 10  

---

### ✅ Actividades realizadas

- Modificado el .env del backend para que acepte conexión desde db (ya no es localhost)
- Todas las rutas desde el frontend deben ser referenciando a la URL, no solamente como /denuncias. Se creó un archivo env.local para manejar la URL en desarrollo y cambiarla cuando se pase a prod.
- Se ha añadido a la función listar_evidencias del endpoint /evidencias en el backend una lógica que permite filtrar por denuncia. Esto es útil para devolver solamente los waypoints asociados a una denuncia, no el set completo de datos. O dicho de otro modo: el filtrado de datos se hace en el backend.
- Se debió modificar el endpoint /upload_gpx para que aceptase el archivo gpx desde el frontend como parte del form-data
---

### ⚠️ Dificultades encontradas

- 
---

### 🔜 Acciones pendientes o planificadas

- Se debe modificar a futuro la seguridad, ya que para pruebas se está utilizando un token común, hardcodeado en /frontend/wizard-steps
- A futuro se debe cambiar /frontend/env.local para que refleje el servidor donde quedará la app.
- El filtrado de datos implementado en el endpoint /denuncias se debe replicar en otros endpoints, a fin de tener la data filtrada en el frontend

---

### 📌 Observaciones adicionales

> Para revisión de mejora del frontend, revisar [Modificaciones Frontend](/bitacora/sprint_03_MODIFICACIONES_FRONTEND_API.md)

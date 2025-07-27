
## 🗓 Bitácora de Avance - Sprint 3

**Fecha inicio:** 2025-07-21  
**Semanas:** 5 y 6 de 10  

---

### ✅ Actividades realizadas

- Modificado el .env del backend para que acepte conexión desde db (ya no es localhost)
- Todas las rutas desde el frontend deben ser referenciando a la URL, no solamente como /denuncias. Se creó un archivo env.local para manejar la URL en desarrollo y cambiarla cuando se pase a prod.
- Se ha añadido a la función listar_evidencias del endpoint /evidencias en el backend una lógica que permite filtrar por denuncia. Esto es útil para devolver solamente los waypoints asociados a una denuncia, no el set completo de datos. O dicho de otro modo: el filtrado de datos se hace en el backend.
- Se debió modificar el endpoint /upload_gpx para que aceptase el archivo gpx desde el frontend como parte del form-data
- Se añade react-leaflet a las librerías del proyecto, para desplegar los puntos GPS recién cargados en un mini mapa que se desplegará cuando se cargue el archivo gpx de manera exitosa en la segunda etapa del wizard.
- Se modificó todo el Dockerfile del frontend para utilizar pnpm como gestor de paquetes y dependencias
- Algunos endpoints se están extendiendo para que acepten parámetros de query
- Se agregó herramienta xhtml2pdf y jinja2 para la creación de PDF
- Se agregó py-staticmaps para generar mapa que vaya insertado en archivo PDF
- Está lista la creación de PDF, con mapa incorporado
---

### ⚠️ Dificultades encontradas

- Para desplegar los puntos GPS reciién subidos la mejor opción es react-leaflet, por su ligereza y responsividad. En este punto no se utilizará MapLibre
- Habían problemas con el gestor de dependencias npm, así que se decidió modificar todo para utilizar pnpm, que resuelve las diferencias de compatibilidad entre paquetes de mejor manera. 
- Se debe en algún momento abordar el problema de buffer cortado en dos por geografía de tierra. Una solución posible es dejar solamente el buffer mas cercano a los puntos y descartar el otro
- Se ha tenido que iterar entre varias herramientas para generar PDF, algunas requieren instalar dependencias muy grandes (headless webrowsers como Chromium), se optó por lo mas liviano y simple de utilizar.
- El orden interno del archivo PDF ha llevado mucho trabajo y horas de programación, ya que hubo dificultades en ordenar los elementos.
- 
---

### 🔜 Acciones pendientes o planificadas

- Se debe modificar a futuro la seguridad, ya que para pruebas se está utilizando un token común, hardcodeado en /frontend/wizard-steps. A este respecto, en el primer paso está la referencia al token, los otros pasos lo importan desde ahí
- A futuro se debe cambiar /frontend/env.local para que refleje el servidor donde quedará la app.
- El filtrado de datos implementado en el endpoint /denuncias se debe replicar en otros endpoints, a fin de tener la data filtrada en el frontend
- Se debe implementar una lógica para que el backend responda solamente con un polígono cercano a los puntos cuando existan dos (buffers cortados por tierra)
- Se deben modificar algunos puntos del wizard para mejor experiencia de usuario
- En el sprint final, se debe reconsiderar eliminar detalles menores de estética al archivo PDF creado
- 

---

### 📌 Observaciones adicionales

> Para revisión de mejora del frontend, revisar [Modificaciones Frontend](/bitacora/sprint_03_MODIFICACIONES_FRONTEND_API.md)

## 🗓 Bitácora de Avance - Sprint 1

**Fecha inicio:** 2025-06-23  
**Semanas:** 1 y 2 de 10  

---

### ✅ Actividades realizadas

- 📦 **Elección e implementación del stack tecnológico principal**:
  - PostgreSQL + PostGIS como motor de base de datos geoespacial.
  - Despliegue local mediante [docker-compose.yml](/docker-compose.yml), con volúmenes persistentes para asegurar conservación de datos.
- 🧱 **Definición y ejecución del esquema de base de datos**:
  - Se diseñó y ejecutó el archivo [schema.sql](/db/schema.sql) que incluye las siguientes tablas: `usuarios`, `denuncias`, `evidencias`, `concesiones`, `estados_denuncia`, `analisis_denuncia` y `resultado_analisis`.
- 🧪 **Validación de integridad del modelo de datos**:
  - Ingreso manual de registros desde DBeaver para confirmar estructura y relaciones foráneas.
- Elección del stack tecnológico a utilizar y su implementación: PostgreSQL + PostGIS, despliegue en contendor local a través de [docker-compose.yml](/docker-compose.yml)
- Definición de [esquema base de datos](/db/schema.sql).
- Pruebas básicas de ingreso de datos a la BD para corroborar estructura de la misma.
- Documentación técnica preliminar sobre estructura BD.
- Creación de estructura básica inicial para el backend

---

### ⚠️ Dificultades encontradas

- Una opción posible fue utilizar Supabase ya que a la fecha de comienzo del proyecto consta con soporte para PostGIS. Se optó por contenedor local ya que Supabase aún carece de características avanzadas como procesamiento con GDAL.
- Se decidió utilizar DBeaver para conectar a la base de datos del contenedor, ya que funciona en entorno Windows y Linux. 
- Elección de stack tecnológico a utilizar. Se optó por implementar una base de datos geoespacial con infraestructura propia directamente en PostgreSQL + PostGIS, ya que la solución propuesta a través de Supabase no cumplía con los requerimientos técnicos del proyecto, esto es, no se puede ejecutar análisis geoespacial avanzado sobre la misma. Adicionalmente, se decidió utilizar Fastapi por su rápida implementación, abundante documentación y facilidad de implementar nuevos endpoints para nuevas funcionalidades que puedan aparecer a futuro.
- Implementación de despliegue: se discutió la necesidad de que todas las instancias de desarrollo queden separadas entre sí, para tener mayor control sobre éstas. A futuro el despliegue se realizará en un servidor propio que cumpla con las características necesarias para el procesamiento de los volúmenes de datos requeridos.
- Se discuten ciertos aspectos del modelado de datos y cómo éstos impactarán a futuro en cuanto a consultas realizadas sobre los mismos.
- Modificada la BD para incluir campos de fecha y hora de registro punto GPS, esto a fin de asociarlo a cada foto obtenida en terreno
---

### 🔜 Acciones pendientes o planificadas

- Revisar estructura BD para que cubra un caso básico a fin de poder mostrar PMV.

---

**Observaciones adicionales:**
> Se da inicio al proyecto creando la estructura de datos para el mismo, el diseño de la base de datos y la estructura de tablas. La infraestructura básica de la arquitectura del programa está en funcionamiento, se documenta a través de 




## 🗓 Bitácora de Avance - Semana 1

**Fecha:** 2025-06-23  
**Semana:** 1 de 12  

---

### ✅ Actividades realizadas



---

### ⚠️ Dificultades encontradas

- 💡 **Evaluación inicial de Supabase como alternativa a PostGIS**:  
  Se descartó en esta etapa por limitaciones en procesamiento geoespacial avanzado (GDAL, análisis vectorial), a pesar de su soporte nativo para PostGIS.


---


---

### 📌 Observaciones adicionales

> Se ha completado el desarrollo del esqueleto funcional mínimo del backend, el cual permite gestionar usuarios, denuncias, evidencias georreferenciadas, centros de cultivo (concesiones) y ejecutar análisis espaciales automatizados.  
>
> Todo lo implementado está en línea directa con los objetivos definidos en el documento del anteproyecto y el informe técnico del proyecto de título, validando la factibilidad y consistencia del enfoque propuesto.

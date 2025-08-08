# 🎯 CASOS DE USO - PLATAFORMA PLAYAS LIMPIAS

## 📋 INTRODUCCIÓN

Este documento identifica y describe todos los casos de uso reales de la plataforma Playas Limpias, extraídos del análisis técnico del código fuente. Estos casos de uso servirán como base para la vista de escenarios del modelo arquitectónico 4+1 de Kruchten.

---

## 👥 ACTORES IDENTIFICADOS

### **Actores Principales:**
- **Inspector Ambiental** - Usuario principal que realiza inspecciones
- **Administrador del Sistema** - Gestor de usuarios y configuración
- **Sistema de Análisis Geoespacial** - Componente automático de procesamiento

### **Actores Secundarios:**
- **Sistema de Autenticación** - Gestión de sesiones y seguridad
- **Sistema de Reportes** - Generación automática de documentos
- **Base de Datos Geoespacial** - Almacenamiento y consultas espaciales

---

## 🎭 CASOS DE USO PRINCIPALES

### **UC-001: Registro de Usuario**
**Actor:** Inspector Ambiental  
**Descripción:** Un nuevo inspector se registra en el sistema para obtener acceso a la plataforma.

**Flujo Principal:**
1. El inspector accede a la página de registro
2. Completa formulario con nombre, email y contraseña
3. Sistema valida datos y crea cuenta
4. Sistema genera token JWT de autenticación
5. Inspector es redirigido al dashboard

**Flujos Alternativos:**
- Email ya registrado → Mostrar error
- Datos inválidos → Solicitar corrección

**Postcondiciones:**
- Usuario creado en base de datos
- Sesión activa con token JWT
- Acceso al dashboard habilitado

---

### **UC-002: Inicio de Sesión**
**Actor:** Inspector Ambiental  
**Descripción:** Un inspector existente inicia sesión en la plataforma.

**Flujo Principal:**
1. Inspector accede a página de login
2. Ingresa email y contraseña
3. Sistema valida credenciales
4. Sistema genera nuevo token JWT
5. Inspector es redirigido al dashboard

**Flujos Alternativos:**
- Credenciales incorrectas → Mostrar error
- Usuario inactivo → Mostrar error

**Postcondiciones:**
- Sesión activa con token JWT
- Último acceso actualizado
- Acceso al dashboard habilitado

---

### **UC-003: Gestión de Perfil de Usuario**
**Actor:** Inspector Ambiental  
**Descripción:** El inspector visualiza y modifica su información personal.

**Flujo Principal:**
1. Inspector accede a sección de perfil
2. Visualiza información actual
3. Modifica datos personales (opcional)
4. Cambia contraseña (opcional)
5. Sistema actualiza información

**Postcondiciones:**
- Información de perfil actualizada
- Historial de cambios registrado

---

### **UC-004: Crear Nueva Inspección (Wizard Completo)**
**Actor:** Inspector Ambiental  
**Descripción:** El inspector crea una nueva inspección ambiental siguiendo un wizard de 5 pasos.

#### **UC-004.1: Paso 1 - Información General**
**Flujo Principal:**
1. Inspector inicia nueva inspección
2. Completa datos básicos (lugar, fecha, observaciones)
3. Selecciona inspector responsable
4. Sistema valida información
5. Inspector avanza al siguiente paso

#### **UC-004.2: Paso 2 - Carga de Waypoints GPS**
**Flujo Principal:**
1. Inspector sube archivo GPX
2. Sistema parsea waypoints y coordenadas
3. Sistema valida formato y datos GPS
4. Inspector visualiza waypoints en mapa
5. Inspector confirma datos y avanza

**Flujos Alternativos:**
- Archivo inválido → Solicitar archivo correcto
- Sin coordenadas GPS → Mostrar advertencia

#### **UC-004.3: Paso 3 - Subida de Fotografías**
**Flujo Principal:**
1. Inspector sube múltiples fotografías
2. Sistema extrae metadatos EXIF (GPS, timestamp)
3. Sistema procesa y optimiza imágenes
4. Sistema asocia fotos con waypoints GPS
5. Inspector confirma fotos y avanza

**Flujos Alternativos:**
- Sin metadatos GPS → Solicitar ubicación manual
- Imagen corrupta → Solicitar nueva foto

#### **UC-004.4: Paso 4 - Análisis Geoespacial**
**Flujo Principal:**
1. Inspector visualiza evidencias en mapa
2. Configura distancia de buffer para análisis
3. Sistema ejecuta análisis geoespacial
4. Sistema identifica concesiones intersectadas
5. Inspector revisa resultados preliminares

#### **UC-004.5: Paso 5 - Generación de Reportes**
**Flujo Principal:**
1. Inspector confirma análisis final
2. Sistema genera reporte PDF
3. Sistema genera archivo KMZ
4. Sistema genera mapa estático
5. Inspector descarga documentos finales

**Postcondiciones:**
- Denuncia creada en base de datos
- Evidencias almacenadas y procesadas
- Análisis geoespacial ejecutado
- Reportes generados y disponibles

---

### **UC-005: Visualizar Dashboard Principal**
**Actor:** Inspector Ambiental  
**Descripción:** El inspector accede al dashboard principal para ver resumen de actividades.

**Flujo Principal:**
1. Inspector accede al dashboard
2. Sistema muestra métricas generales
3. Sistema muestra inspecciones recientes
4. Sistema muestra mapa de actividades
5. Inspector navega por diferentes secciones

**Información Mostrada:**
- Total de inspecciones realizadas
- Inspecciones del mes actual
- Porcentaje de cumplimiento
- Playas inspeccionadas
- Gráfico de actividad temporal
- Mapa de ubicaciones de inspecciones

---

### **UC-006: Gestionar Mis Denuncias**
**Actor:** Inspector Ambiental  
**Descripción:** El inspector visualiza y gestiona sus denuncias creadas.

**Flujo Principal:**
1. Inspector accede a "Mis Denuncias"
2. Sistema lista denuncias del inspector
3. Inspector filtra por estado o fecha
4. Inspector selecciona denuncia específica
5. Sistema muestra detalles completos

**Funcionalidades:**
- Listado paginado de denuncias
- Filtros por estado y fecha
- Vista detallada de cada denuncia
- Acceso a evidencias asociadas
- Cambio de estado de denuncia

---

### **UC-007: Ver Detalles de Denuncia**
**Actor:** Inspector Ambiental  
**Descripción:** El inspector visualiza todos los detalles de una denuncia específica.

**Flujo Principal:**
1. Inspector selecciona denuncia
2. Sistema muestra información general
3. Sistema muestra evidencias en mapa
4. Sistema muestra análisis realizados
5. Inspector accede a reportes generados

**Información Mostrada:**
- Datos básicos de la denuncia
- Evidencias con coordenadas GPS
- Fotografías con metadatos
- Análisis geoespaciales realizados
- Concesiones identificadas
- Reportes disponibles

---

### **UC-008: Ejecutar Análisis Geoespacial**
**Actor:** Inspector Ambiental  
**Descripción:** El inspector ejecuta análisis geoespacial sobre evidencias existentes.

**Flujo Principal:**
1. Inspector selecciona denuncia
2. Configura parámetros de análisis (distancia buffer)
3. Sistema genera buffer desde evidencias
4. Sistema calcula intersecciones con concesiones
5. Sistema almacena resultados del análisis

**Flujos Alternativos:**
- Sin evidencias suficientes → Mostrar error
- Sin concesiones en área → Mostrar resultado vacío

**Postcondiciones:**
- Análisis almacenado en base de datos
- Resultados disponibles para consulta
- Geometrías de buffer generadas

---

### **UC-009: Generar Reporte PDF**
**Actor:** Inspector Ambiental  
**Descripción:** El inspector genera un reporte en PDF de una inspección.

**Flujo Principal:**
1. Inspector selecciona denuncia o análisis
2. Solicita generación de PDF
3. Sistema procesa datos y mapas
4. Sistema genera PDF con plantilla
5. Inspector descarga archivo PDF

**Contenido del PDF:**
- Información de la denuncia
- Evidencias con coordenadas
- Mapas de ubicación
- Resultados de análisis
- Concesiones identificadas
- Metadatos de inspección

---

### **UC-010: Generar Archivo KMZ**
**Actor:** Inspector Ambiental  
**Descripción:** El inspector genera un archivo KMZ para visualización en Google Earth.

**Flujo Principal:**
1. Inspector selecciona denuncia o análisis
2. Solicita generación de KMZ
3. Sistema procesa datos geoespaciales
4. Sistema genera archivo KMZ estructurado
5. Inspector descarga archivo KMZ

**Contenido del KMZ:**
- Waypoints GPS de inspección
- Evidencias con fotos
- Buffer de análisis
- Concesiones intersectadas
- Metadatos descriptivos

---

### **UC-011: Previsualizar Análisis**
**Actor:** Inspector Ambiental  
**Descripción:** El inspector previsualiza resultados de análisis antes de confirmar.

**Flujo Principal:**
1. Inspector configura parámetros de análisis
2. Sistema ejecuta análisis en modo preview
3. Sistema muestra resultados preliminares
4. Inspector revisa concesiones identificadas
5. Inspector decide confirmar o ajustar parámetros

**Información Mostrada:**
- Buffer generado en mapa
- Concesiones intersectadas
- Distancias calculadas
- Estadísticas de intersección

---

### **UC-012: Cambiar Estado de Denuncia**
**Actor:** Inspector Ambiental  
**Descripción:** El inspector actualiza el estado de una denuncia.

**Flujo Principal:**
1. Inspector selecciona denuncia
2. Selecciona nuevo estado
3. Agrega observaciones (opcional)
4. Sistema actualiza estado
5. Sistema registra cambio con timestamp

**Estados Disponibles:**
- En Proceso
- Completada
- Pendiente de Revisión
- Cerrada

---

### **UC-013: Subir Evidencias Adicionales**
**Actor:** Inspector Ambiental  
**Descripción:** El inspector agrega nuevas evidencias a una denuncia existente.

**Flujo Principal:**
1. Inspector selecciona denuncia
2. Sube nuevas fotografías
3. Sistema procesa imágenes
4. Sistema extrae metadatos GPS
5. Sistema asocia evidencias a denuncia

**Postcondiciones:**
- Nuevas evidencias almacenadas
- Metadatos extraídos y validados
- Asociación con denuncia establecida

---

### **UC-014: Visualizar Mapa de Inspecciones**
**Actor:** Inspector Ambiental  
**Descripción:** El inspector visualiza todas las inspecciones en un mapa interactivo.

**Flujo Principal:**
1. Inspector accede a sección de mapa
2. Sistema carga todas las inspecciones
3. Sistema muestra puntos en mapa
4. Inspector interactúa con marcadores
5. Inspector accede a detalles desde mapa

**Funcionalidades:**
- Mapa interactivo con Leaflet
- Marcadores por inspección
- Popups con información básica
- Filtros por fecha o estado
- Zoom y navegación

---

### **UC-015: Gestionar Historial de Actividad**
**Actor:** Inspector Ambiental  
**Descripción:** El inspector visualiza el historial completo de sus actividades.

**Flujo Principal:**
1. Inspector accede a historial
2. Sistema muestra actividades cronológicas
3. Inspector filtra por tipo o fecha
4. Inspector accede a detalles específicos
5. Sistema muestra estadísticas de actividad

**Información Mostrada:**
- Lista cronológica de actividades
- Estadísticas de productividad
- Gráficos de actividad temporal
- Resumen de inspecciones por período

---

## 🔧 CASOS DE USO DEL SISTEMA

### **UC-016: Autenticación Automática**
**Actor:** Sistema de Autenticación  
**Descripción:** El sistema valida tokens JWT y gestiona sesiones automáticamente.

**Flujo Principal:**
1. Sistema recibe request con token
2. Valida firma y expiración del JWT
3. Extrae información del usuario
4. Verifica usuario activo en base de datos
5. Permite o deniega acceso

**Postcondiciones:**
- Sesión validada o rechazada
- Último acceso actualizado
- Log de actividad registrado

---

### **UC-017: Procesamiento Automático de Imágenes**
**Actor:** Sistema de Análisis Geoespacial  
**Descripción:** El sistema procesa automáticamente las imágenes subidas.

**Flujo Principal:**
1. Sistema recibe imagen
2. Extrae metadatos EXIF
3. Corrige orientación automáticamente
4. Comprime y optimiza imagen
5. Almacena en estructura organizada

**Procesamiento Incluido:**
- Extracción de coordenadas GPS
- Corrección de orientación
- Compresión inteligente
- Validación de formato
- Organización en carpetas

---

### **UC-018: Análisis Geoespacial Automático**
**Actor:** Sistema de Análisis Geoespacial  
**Descripción:** El sistema ejecuta análisis geoespacial automáticamente.

**Flujo Principal:**
1. Sistema recibe parámetros de análisis
2. Genera buffer desde evidencias
3. Calcula intersecciones con concesiones
4. Calcula distancias mínimas
5. Almacena resultados en base de datos

**Cálculos Realizados:**
- Buffer unificado de evidencias
- Intersección con capa de concesiones
- Cálculo de distancias espaciales
- Validación de geometrías
- Recorte con capa de tierra firme

---

### **UC-019: Generación Automática de Reportes**
**Actor:** Sistema de Reportes  
**Descripción:** El sistema genera reportes automáticamente cuando se solicita.

**Flujo Principal:**
1. Sistema recibe solicitud de reporte
2. Recopila datos de denuncia y análisis
3. Genera mapas estáticos
4. Aplica plantillas de documento
5. Genera archivo final (PDF/KMZ)

**Tipos de Reportes:**
- Reportes PDF con mapas
- Archivos KMZ para Google Earth
- Mapas estáticos en HTML
- Resúmenes ejecutivos

---

### **UC-020: Validación Automática de Datos**
**Actor:** Sistema de Validación  
**Descripción:** El sistema valida automáticamente todos los datos ingresados.

**Flujo Principal:**
1. Sistema recibe datos de entrada
2. Valida esquemas con Pydantic/Zod
3. Verifica integridad referencial
4. Valida formatos geoespaciales
5. Acepta o rechaza datos

**Validaciones Incluidas:**
- Esquemas de datos
- Coordenadas GPS válidas
- Formatos de archivo
- Relaciones entre entidades
- Metadatos requeridos

---

## 📊 CASOS DE USO DE ADMINISTRACIÓN

### **UC-021: Gestión de Usuarios (Administrador)**
**Actor:** Administrador del Sistema  
**Descripción:** El administrador gestiona usuarios del sistema.

**Funcionalidades:**
- Listar todos los usuarios
- Activar/desactivar usuarios
- Ver estadísticas de uso
- Gestionar roles y permisos
- Monitorear actividad de usuarios

---

### **UC-022: Monitoreo del Sistema (Administrador)**
**Actor:** Administrador del Sistema  
**Descripción:** El administrador monitorea el estado del sistema.

**Funcionalidades:**
- Ver métricas de rendimiento
- Monitorear uso de recursos
- Revisar logs del sistema
- Verificar estado de servicios
- Gestionar backups

---

## 🎯 CASOS DE USO ESPECIALIZADOS

### **UC-023: Análisis de Tendencias**
**Actor:** Inspector Ambiental  
**Descripción:** El inspector analiza tendencias en las inspecciones realizadas.

**Funcionalidades:**
- Gráficos de actividad temporal
- Análisis de patrones de contaminación
- Estadísticas por región
- Comparación de períodos
- Identificación de hotspots

---

### **UC-024: Exportación de Datos**
**Actor:** Inspector Ambiental  
**Descripción:** El inspector exporta datos para análisis externo.

**Formatos de Exportación:**
- CSV con datos de denuncias
- GeoJSON con geometrías
- Excel con resúmenes
- Shapefile para GIS
- JSON con datos completos

---

### **UC-025: Integración con Sistemas Externos**
**Actor:** Sistema de Integración  
**Descripción:** El sistema se integra con sistemas externos de gestión ambiental.

**Integraciones Posibles:**
- APIs de organismos ambientales
- Sistemas de notificación
- Bases de datos de concesiones
- Plataformas de reportes oficiales
- Sistemas de alertas tempranas

---

## 📋 RESUMEN DE CASOS DE USO

### **Casos de Uso Principales (15):**
1. Registro de Usuario
2. Inicio de Sesión
3. Gestión de Perfil
4. Crear Nueva Inspección (5 sub-casos)
5. Visualizar Dashboard
6. Gestionar Mis Denuncias
7. Ver Detalles de Denuncia
8. Ejecutar Análisis Geoespacial
9. Generar Reporte PDF
10. Generar Archivo KMZ
11. Previsualizar Análisis
12. Cambiar Estado de Denuncia
13. Subir Evidencias Adicionales
14. Visualizar Mapa de Inspecciones
15. Gestionar Historial de Actividad

### **Casos de Uso del Sistema (5):**
16. Autenticación Automática
17. Procesamiento Automático de Imágenes
18. Análisis Geoespacial Automático
19. Generación Automática de Reportes
20. Validación Automática de Datos

### **Casos de Uso de Administración (2):**
21. Gestión de Usuarios
22. Monitoreo del Sistema

### **Casos de Uso Especializados (3):**
23. Análisis de Tendencias
24. Exportación de Datos
25. Integración con Sistemas Externos

---

## 🎭 ACTORES Y SUS RESPONSABILIDADES

### **Actores Principales:**
- **Inspector Ambiental:** Usuario principal que realiza inspecciones
- **Administrador del Sistema:** Gestor de usuarios y configuración

### **Actores del Sistema:**
- **Sistema de Autenticación:** Gestión de sesiones y seguridad
- **Sistema de Análisis Geoespacial:** Procesamiento automático
- **Sistema de Reportes:** Generación de documentos
- **Sistema de Validación:** Verificación de datos
- **Sistema de Integración:** Comunicación externa

---

*Este documento proporciona una base completa para la vista de escenarios del modelo arquitectónico 4+1 de Kruchten, identificando todos los casos de uso reales de la plataforma Playas Limpias.* 
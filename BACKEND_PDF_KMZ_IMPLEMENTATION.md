# Backend Implementation: PDF & KMZ Generation

## 🎯 **Endpoints Diseñados**

### **1. Endpoint PDF**
```python
@router.get("/analisis/{id_analisis}/pdf")
async def generar_pdf_analisis(id_analisis: int, current_user: dict = Depends(get_current_user)):
    """
    Genera y descarga PDF completo del análisis
    """
```

### **2. Endpoint KMZ**
```python
@router.get("/analisis/{id_analisis}/kmz") 
async def generar_kmz_analisis(id_analisis: int, current_user: dict = Depends(get_current_user)):
    """
    Genera y descarga KMZ para Google Earth
    """
```

## 📁 **Estructura de Archivos Necesarios**

```
backend/
├── routes/
│   └── analisis.py              # Endpoints existentes + nuevos
├── services/
│   ├── pdf_generator.py         # Lógica de generación PDF
│   ├── kmz_generator.py         # Lógica de generación KMZ
│   └── map_renderer.py          # Mapas estáticos para PDF
├── templates/
│   └── pdf_template.html        # Template HTML para PDF
├── static/
│   └── pdf_assets/              # Logos, estilos CSS
└── temp_files/                  # Archivos temporales
```

## 🔧 **Implementación Endpoint PDF**

### **routes/analisis.py** (Nuevo endpoint)
```python
from services.pdf_generator import PDFGenerator
from fastapi.responses import FileResponse
import tempfile
import os

@router.get("/analisis/{id_analisis}/pdf")
async def generar_pdf_analisis(
    id_analisis: int, 
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # 1. Verificar que el análisis existe
        analisis = db.query(AnalisisDenuncia).filter(
            AnalisisDenuncia.id_analisis == id_analisis
        ).first()
        
        if not analisis:
            raise HTTPException(status_code=404, detail="Análisis no encontrado")
        
        # 2. Obtener datos relacionados
        denuncia = db.query(Denuncia).filter(
            Denuncia.id_denuncia == analisis.id_denuncia
        ).first()
        
        evidencias = db.query(Evidencia).filter(
            Evidencia.id_denuncia == analisis.id_denuncia
        ).all()
        
        resultados = db.query(ResultadoAnalisis).filter(
            ResultadoAnalisis.id_analisis == id_analisis
        ).all()
        
        concesiones_ids = [r.id_concesion for r in resultados]
        concesiones = db.query(Concesion).filter(
            Concesion.id_concesion.in_(concesiones_ids)
        ).all()
        
        usuario = db.query(Usuario).filter(
            Usuario.id_usuario == denuncia.id_usuario
        ).first()
        
        estado = db.query(EstadoDenuncia).filter(
            EstadoDenuncia.id_estado == denuncia.id_estado
        ).first()
        
        # 3. Generar PDF
        pdf_generator = PDFGenerator()
        pdf_bytes = await pdf_generator.generate_analysis_pdf(
            analisis=analisis,
            denuncia=denuncia,
            evidencias=evidencias,
            resultados=resultados,
            concesiones=concesiones,
            usuario=usuario,
            estado=estado
        )
        
        # 4. Crear archivo temporal
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            temp_file.write(pdf_bytes)
            temp_path = temp_file.name
        
        # 5. Retornar archivo para descarga
        filename = f"inspeccion_{denuncia.sector_name}_{id_analisis}.pdf"
        
        def cleanup():
            try:
                os.unlink(temp_path)
            except:
                pass
        
        return FileResponse(
            path=temp_path,
            media_type="application/pdf",
            filename=filename,
            background=BackgroundTask(cleanup)
        )
        
    except Exception as e:
        logger.error(f"Error generando PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generando PDF: {str(e)}")
```

## 🔧 **Implementación Endpoint KMZ**

### **routes/analisis.py** (Nuevo endpoint)
```python
from services.kmz_generator import KMZGenerator

@router.get("/analisis/{id_analisis}/kmz")
async def generar_kmz_analisis(
    id_analisis: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # 1. Obtener datos (similar al PDF)
        analisis = db.query(AnalisisDenuncia).filter(
            AnalisisDenuncia.id_analisis == id_analisis
        ).first()
        
        if not analisis:
            raise HTTPException(status_code=404, detail="Análisis no encontrado")
        
        # 2. Obtener geometrías y datos geoespaciales
        evidencias = db.query(Evidencia).filter(
            Evidencia.id_denuncia == analisis.id_denuncia
        ).all()
        
        resultados = db.query(ResultadoAnalisis).filter(
            ResultadoAnalisis.id_analisis == id_analisis
        ).all()
        
        concesiones_ids = [r.id_concesion for r in resultados]
        concesiones = db.query(Concesion).filter(
            Concesion.id_concesion.in_(concesiones_ids)
        ).all()
        
        # 3. Generar KMZ
        kmz_generator = KMZGenerator()
        kmz_bytes = await kmz_generator.generate_analysis_kmz(
            analisis=analisis,
            evidencias=evidencias,
            concesiones=concesiones,
            buffer_geom=analisis.buffer_geom
        )
        
        # 4. Crear archivo temporal
        with tempfile.NamedTemporaryFile(delete=False, suffix=".kmz") as temp_file:
            temp_file.write(kmz_bytes)
            temp_path = temp_file.name
        
        # 5. Retornar archivo
        filename = f"inspeccion_{analisis.id_denuncia}_{id_analisis}.kmz"
        
        def cleanup():
            try:
                os.unlink(temp_path)
            except:
                pass
        
        return FileResponse(
            path=temp_path,
            media_type="application/vnd.google-earth.kmz",
            filename=filename,
            background=BackgroundTask(cleanup)
        )
        
    except Exception as e:
        logger.error(f"Error generando KMZ: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generando KMZ: {str(e)}")
```

## 📄 **PDF Generator Service**

### **services/pdf_generator.py**
```python
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from io import BytesIO
import folium
import base64
from PIL import Image as PILImage

class PDFGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.custom_styles = self._create_custom_styles()
    
    def _create_custom_styles(self):
        """Crear estilos personalizados para el PDF"""
        return {
            'titulo': ParagraphStyle(
                'titulo',
                parent=self.styles['Heading1'],
                fontSize=24,
                spaceAfter=30,
                alignment=1  # Centrado
            ),
            'subtitulo': ParagraphStyle(
                'subtitulo', 
                parent=self.styles['Heading2'],
                fontSize=16,
                spaceAfter=12
            ),
            'normal': ParagraphStyle(
                'normal',
                parent=self.styles['Normal'],
                fontSize=10,
                spaceAfter=6
            )
        }
    
    async def generate_analysis_pdf(self, analisis, denuncia, evidencias, resultados, concesiones, usuario, estado):
        """Generar PDF completo del análisis"""
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        
        # Contenido del PDF
        story = []
        
        # 1. PORTADA
        story.extend(self._create_portada(analisis, denuncia, usuario))
        story.append(PageBreak())
        
        # 2. RESUMEN EJECUTIVO  
        story.extend(self._create_resumen_ejecutivo(analisis, evidencias, concesiones, resultados))
        story.append(PageBreak())
        
        # 3. MAPA PRINCIPAL
        story.extend(await self._create_mapa_section(analisis, evidencias, concesiones))
        story.append(PageBreak())
        
        # 4. CONCESIONES DETALLADAS
        story.extend(self._create_concesiones_section(concesiones, resultados))
        story.append(PageBreak())
        
        # 5. EVIDENCIAS GPS
        story.extend(self._create_evidencias_section(evidencias))
        story.append(PageBreak())
        
        # 6. PARÁMETROS TÉCNICOS
        story.extend(self._create_parametros_section(analisis, denuncia))
        
        # Construir PDF
        doc.build(story)
        
        # Retornar bytes
        buffer.seek(0)
        return buffer.getvalue()
    
    def _create_portada(self, analisis, denuncia, usuario):
        """Crear página de portada"""
        content = []
        
        # Logo (si existe)
        # content.append(Image('static/pdf_assets/logo.png', 2*inch, 1*inch))
        content.append(Spacer(1, 0.5*inch))
        
        # Título principal
        content.append(Paragraph("REPORTE DE INSPECCIÓN", self.custom_styles['titulo']))
        content.append(Spacer(1, 0.3*inch))
        
        # Información básica
        info_data = [
            ['ID de Análisis:', f"#{analisis.id_analisis}"],
            ['Sector:', denuncia.sector_name],
            ['Fecha de Inspección:', denuncia.fecha_inspeccion.strftime('%d/%m/%Y')],
            ['Inspector:', usuario.nombre if usuario else 'N/A'],
            ['Fecha de Análisis:', analisis.fecha_analisis.strftime('%d/%m/%Y %H:%M')],
        ]
        
        info_table = Table(info_data, colWidths=[2*inch, 3*inch])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.grey),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('BACKGROUND', (1, 0), (1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        content.append(info_table)
        return content
    
    def _create_resumen_ejecutivo(self, analisis, evidencias, concesiones, resultados):
        """Crear sección de resumen ejecutivo"""
        content = []
        
        content.append(Paragraph("RESUMEN EJECUTIVO", self.custom_styles['subtitulo']))
        
        # Métricas principales
        metricas_data = [
            ['Métrica', 'Valor'],
            ['Concesiones Intersectadas', str(len(resultados))],
            ['Puntos GPS Recolectados', str(len(evidencias))],
            ['Distancia de Buffer', f"{analisis.distancia_buffer}m"],
            ['Titulares Afectados', str(len(set(c.titular for c in concesiones)))]
        ]
        
        metricas_table = Table(metricas_data, colWidths=[3*inch, 2*inch])
        metricas_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        content.append(metricas_table)
        return content
    
    async def _create_mapa_section(self, analisis, evidencias, concesiones):
        """Crear sección con mapa estático"""
        content = []
        
        content.append(Paragraph("MAPA DE ANÁLISIS", self.custom_styles['subtitulo']))
        
        # Generar mapa estático con folium
        mapa_bytes = await self._generate_static_map(analisis, evidencias, concesiones)
        
        if mapa_bytes:
            # Convertir bytes a imagen para ReportLab
            img = PILImage.open(BytesIO(mapa_bytes))
            img_buffer = BytesIO()
            img.save(img_buffer, format='PNG')
            img_buffer.seek(0)
            
            # Agregar imagen al PDF
            content.append(Image(img_buffer, 6*inch, 4*inch))
        
        return content
    
    async def _generate_static_map(self, analisis, evidencias, concesiones):
        """Generar mapa estático usando folium"""
        try:
            # Calcular centro del mapa
            if evidencias:
                lats = [ev.coordenadas['coordinates'][1] for ev in evidencias if ev.coordenadas]
                lons = [ev.coordenadas['coordinates'][0] for ev in evidencias if ev.coordenadas]
                center_lat = sum(lats) / len(lats)
                center_lon = sum(lons) / len(lons)
            else:
                center_lat, center_lon = -41.4689, -72.9411  # Puerto Montt fallback
            
            # Crear mapa
            m = folium.Map(location=[center_lat, center_lon], zoom_start=13)
            
            # Agregar evidencias
            for ev in evidencias:
                if ev.coordenadas and 'coordinates' in ev.coordenadas:
                    folium.Marker(
                        [ev.coordenadas['coordinates'][1], ev.coordenadas['coordinates'][0]],
                        popup=f"Evidencia #{ev.id_evidencia}",
                        icon=folium.Icon(color='blue', icon='info-sign')
                    ).add_to(m)
            
            # Agregar buffer si existe
            if analisis.buffer_geom:
                folium.GeoJson(
                    analisis.buffer_geom,
                    style_function=lambda x: {'color': 'blue', 'weight': 2, 'fillOpacity': 0.2}
                ).add_to(m)
            
            # Agregar concesiones
            for concesion in concesiones:
                if concesion.geom:
                    folium.GeoJson(
                        concesion.geom,
                        style_function=lambda x: {'color': 'red', 'weight': 2, 'fillOpacity': 0.3}
                    ).add_to(m)
            
            # Convertir a imagen (requiere selenium o similar)
            # Esto es complejo, por ahora retornar None
            return None
            
        except Exception as e:
            print(f"Error generando mapa: {e}")
            return None
    
    def _create_concesiones_section(self, concesiones, resultados):
        """Crear sección de concesiones detalladas"""
        content = []
        
        content.append(Paragraph("CONCESIONES INTERSECTADAS", self.custom_styles['subtitulo']))
        
        # Crear tabla de concesiones
        headers = ['Código Centro', 'Nombre', 'Titular', 'Tipo', 'Región', 'Intersección']
        table_data = [headers]
        
        for resultado in resultados:
            concesion = next((c for c in concesiones if c.id_concesion == resultado.id_concesion), None)
            if concesion:
                table_data.append([
                    concesion.codigo_centro,
                    concesion.nombre,
                    concesion.titular,
                    concesion.tipo,
                    concesion.region,
                    'Válida' if resultado.interseccion_valida else 'No Válida'
                ])
        
        concesiones_table = Table(table_data, colWidths=[1*inch, 1.5*inch, 1.5*inch, 1*inch, 1*inch, 1*inch])
        concesiones_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        content.append(concesiones_table)
        return content
    
    def _create_evidencias_section(self, evidencias):
        """Crear sección de evidencias GPS"""
        content = []
        
        content.append(Paragraph("EVIDENCIAS GPS", self.custom_styles['subtitulo']))
        
        for ev in evidencias:
            ev_text = f"<b>Evidencia #{ev.id_evidencia}</b><br/>"
            ev_text += f"Fecha: {ev.fecha}<br/>"
            ev_text += f"Hora: {ev.hora}<br/>"
            if ev.coordenadas and 'coordinates' in ev.coordenadas:
                ev_text += f"Coordenadas: {ev.coordenadas['coordinates'][1]:.6f}, {ev.coordenadas['coordinates'][0]:.6f}<br/>"
            if ev.descripcion:
                ev_text += f"Descripción: {ev.descripcion}<br/>"
            if ev.foto_url:
                ev_text += "📷 Con fotografía<br/>"
            
            content.append(Paragraph(ev_text, self.custom_styles['normal']))
            content.append(Spacer(1, 0.1*inch))
        
        return content
    
    def _create_parametros_section(self, analisis, denuncia):
        """Crear sección de parámetros técnicos"""
        content = []
        
        content.append(Paragraph("PARÁMETROS TÉCNICOS", self.custom_styles['subtitulo']))
        
        params_data = [
            ['Parámetro', 'Valor'],
            ['ID de Análisis', f"#{analisis.id_analisis}"],
            ['ID de Denuncia', f"#{analisis.id_denuncia}"],
            ['Método de Análisis', analisis.metodo],
            ['Distancia de Buffer', f"{analisis.distancia_buffer}m"],
            ['Fecha de Análisis', analisis.fecha_analisis.strftime('%d/%m/%Y %H:%M:%S')],
            ['Observaciones', analisis.observaciones or 'N/A']
        ]
        
        params_table = Table(params_data, colWidths=[2.5*inch, 3*inch])
        params_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        content.append(params_table)
        return content
```

## 🗺️ **KMZ Generator Service**

### **services/kmz_generator.py**
```python
import zipfile
from io import BytesIO
import xml.etree.ElementTree as ET
from xml.dom import minidom

class KMZGenerator:
    def __init__(self):
        self.kml_namespace = "http://www.opengis.net/kml/2.2"
    
    async def generate_analysis_kmz(self, analisis, evidencias, concesiones, buffer_geom):
        """Generar archivo KMZ completo"""
        
        # 1. Crear KML
        kml_content = self._create_kml(analisis, evidencias, concesiones, buffer_geom)
        
        # 2. Crear archivo ZIP (KMZ)
        kmz_buffer = BytesIO()
        
        with zipfile.ZipFile(kmz_buffer, 'w', zipfile.ZIP_DEFLATED) as kmz:
            # Agregar KML principal
            kmz.writestr('doc.kml', kml_content)
            
            # TODO: Agregar fotografías si existen
            # for evidencia in evidencias:
            #     if evidencia.foto_url:
            #         # Descargar y agregar foto al KMZ
            #         pass
        
        kmz_buffer.seek(0)
        return kmz_buffer.getvalue()
    
    def _create_kml(self, analisis, evidencias, concesiones, buffer_geom):
        """Crear contenido KML"""
        
        # Crear documento KML
        kml = ET.Element('kml', xmlns=self.kml_namespace)
        document = ET.SubElement(kml, 'Document')
        
        # Metadata
        ET.SubElement(document, 'name').text = f"Inspección - Análisis #{analisis.id_analisis}"
        ET.SubElement(document, 'description').text = f"Análisis de inspección generado el {analisis.fecha_analisis}"
        
        # Estilos
        self._add_styles(document)
        
        # Carpeta de evidencias GPS
        evidencias_folder = ET.SubElement(document, 'Folder')
        ET.SubElement(evidencias_folder, 'name').text = 'Evidencias GPS'
        
        for evidencia in evidencias:
            if evidencia.coordenadas and 'coordinates' in evidencia.coordenadas:
                placemark = ET.SubElement(evidencias_folder, 'Placemark')
                ET.SubElement(placemark, 'name').text = f"Evidencia #{evidencia.id_evidencia}"
                ET.SubElement(placemark, 'description').text = f"Fecha: {evidencia.fecha}\nHora: {evidencia.hora}"
                ET.SubElement(placemark, 'styleUrl').text = '#evidencia_style'
                
                point = ET.SubElement(placemark, 'Point')
                coords = f"{evidencia.coordenadas['coordinates'][0]},{evidencia.coordenadas['coordinates'][1]},0"
                ET.SubElement(point, 'coordinates').text = coords
        
        # Buffer
        if buffer_geom:
            buffer_folder = ET.SubElement(document, 'Folder')
            ET.SubElement(buffer_folder, 'name').text = 'Área de Buffer'
            
            placemark = ET.SubElement(buffer_folder, 'Placemark')
            ET.SubElement(placemark, 'name').text = f"Buffer {analisis.distancia_buffer}m"
            ET.SubElement(placemark, 'styleUrl').text = '#buffer_style'
            
            # Convertir GeoJSON a KML geometry
            self._add_geojson_to_kml(placemark, buffer_geom)
        
        # Concesiones
        concesiones_folder = ET.SubElement(document, 'Folder')
        ET.SubElement(concesiones_folder, 'name').text = 'Concesiones Intersectadas'
        
        for concesion in concesiones:
            if concesion.geom:
                placemark = ET.SubElement(concesiones_folder, 'Placemark')
                ET.SubElement(placemark, 'name').text = concesion.codigo_centro
                ET.SubElement(placemark, 'description').text = f"""
                    <![CDATA[
                    <b>Nombre:</b> {concesion.nombre}<br/>
                    <b>Titular:</b> {concesion.titular}<br/>
                    <b>Tipo:</b> {concesion.tipo}<br/>
                    <b>Región:</b> {concesion.region}
                    ]]>
                """
                ET.SubElement(placemark, 'styleUrl').text = '#concesion_style'
                
                # Convertir GeoJSON a KML geometry
                self._add_geojson_to_kml(placemark, concesion.geom)
        
        # Convertir a string
        rough_string = ET.tostring(kml, 'unicode')
        reparsed = minidom.parseString(rough_string)
        return reparsed.toprettyxml(indent="  ")
    
    def _add_styles(self, document):
        """Agregar estilos KML"""
        
        # Estilo evidencias
        evidencia_style = ET.SubElement(document, 'Style', id='evidencia_style')
        icon_style = ET.SubElement(evidencia_style, 'IconStyle')
        ET.SubElement(icon_style, 'color').text = 'ff0000ff'  # Rojo
        ET.SubElement(icon_style, 'scale').text = '1.2'
        
        # Estilo buffer
        buffer_style = ET.SubElement(document, 'Style', id='buffer_style')
        line_style = ET.SubElement(buffer_style, 'LineStyle')
        ET.SubElement(line_style, 'color').text = '7f00ffff'  # Azul semi-transparente
        ET.SubElement(line_style, 'width').text = '3'
        poly_style = ET.SubElement(buffer_style, 'PolyStyle')
        ET.SubElement(poly_style, 'color').text = '3300ffff'  # Azul muy transparente
        
        # Estilo concesiones
        concesion_style = ET.SubElement(document, 'Style', id='concesion_style')
        line_style = ET.SubElement(concesion_style, 'LineStyle')
        ET.SubElement(line_style, 'color').text = 'ff0000ff'  # Rojo
        ET.SubElement(line_style, 'width').text = '2'
        poly_style = ET.SubElement(concesion_style, 'PolyStyle')
        ET.SubElement(poly_style, 'color').text = '7f0000ff'  # Rojo semi-transparente
    
    def _add_geojson_to_kml(self, placemark, geojson):
        """Convertir geometría GeoJSON a KML"""
        try:
            geom_type = geojson.get('type')
            coordinates = geojson.get('coordinates', [])
            
            if geom_type == 'Polygon':
                polygon = ET.SubElement(placemark, 'Polygon')
                ET.SubElement(polygon, 'extrude').text = '1'
                ET.SubElement(polygon, 'altitudeMode').text = 'relativeToGround'
                
                # Exterior ring
                outer_boundary = ET.SubElement(polygon, 'outerBoundaryIs')
                linear_ring = ET.SubElement(outer_boundary, 'LinearRing')
                
                # Convertir coordenadas
                coord_string = ""
                for coord in coordinates[0]:  # Primera ring (exterior)
                    coord_string += f"{coord[0]},{coord[1]},0 "
                
                ET.SubElement(linear_ring, 'coordinates').text = coord_string.strip()
                
            elif geom_type == 'MultiPolygon':
                # Manejar múltiples polígonos
                for polygon_coords in coordinates:
                    self._add_geojson_to_kml(placemark, {
                        'type': 'Polygon',
                        'coordinates': polygon_coords
                    })
                    
        except Exception as e:
            print(f"Error convirtiendo geometría: {e}")
```

## 📦 **Dependencias Requeridas**

### **requirements.txt** (Agregar)
```txt
reportlab==4.0.4
folium==0.14.0
Pillow==10.0.0
selenium==4.15.0  # Para capturas de mapa (opcional)
```

## 🔧 **Configuración Adicional**

### **Estructura de directorios**
```bash
mkdir -p backend/templates
mkdir -p backend/static/pdf_assets
mkdir -p backend/temp_files
```

### **Variables de entorno** (.env)
```env
PDF_CACHE_ENABLED=true
PDF_CACHE_TTL=3600  # 1 hora
TEMP_FILES_CLEANUP=true
```

## 🚀 **Siguiente Paso**

¿Quieres que implemente alguna parte específica del backend, como:

1. **Comenzar con el endpoint PDF básico**
2. **Implementar el generador KMZ**  
3. **Crear el sistema de mapas estáticos**
4. **Configurar el manejo de archivos temporales**

¿Por dónde empezamos? 
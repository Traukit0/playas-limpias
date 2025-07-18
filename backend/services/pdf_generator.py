from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from io import BytesIO
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

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
                alignment=TA_CENTER,
                textColor=colors.darkblue
            ),
            'subtitulo': ParagraphStyle(
                'subtitulo', 
                parent=self.styles['Heading2'],
                fontSize=16,
                spaceAfter=12,
                textColor=colors.darkblue
            ),
            'normal': ParagraphStyle(
                'normal',
                parent=self.styles['Normal'],
                fontSize=10,
                spaceAfter=6,
                alignment=TA_LEFT
            ),
            'bold': ParagraphStyle(
                'bold',
                parent=self.styles['Normal'],
                fontSize=10,
                spaceAfter=6,
                alignment=TA_LEFT,
                fontName='Helvetica-Bold'
            )
        }
    
    async def generate_analysis_pdf(self, analisis, denuncia, evidencias, resultados, concesiones, usuario, estado):
        """Generar PDF completo del análisis"""
        try:
            logger.info(f"Iniciando generación de PDF para análisis {analisis.id_analisis}")
            
            buffer = BytesIO()
            doc = SimpleDocTemplate(
                buffer, 
                pagesize=A4, 
                rightMargin=72, 
                leftMargin=72, 
                topMargin=72, 
                bottomMargin=72
            )
            
            # Contenido del PDF
            story = []
            
            # 1. PORTADA
            story.extend(self._create_portada(analisis, denuncia, usuario))
            story.append(PageBreak())
            
            # 2. RESUMEN EJECUTIVO  
            story.extend(self._create_resumen_ejecutivo(analisis, evidencias, concesiones, resultados))
            story.append(PageBreak())
            
            # 3. CONCESIONES DETALLADAS
            if concesiones and resultados:
                story.extend(self._create_concesiones_section(concesiones, resultados))
                story.append(PageBreak())
            
            # 4. EVIDENCIAS GPS
            if evidencias:
                story.extend(self._create_evidencias_section(evidencias))
                story.append(PageBreak())
            
            # 5. PARÁMETROS TÉCNICOS
            story.extend(self._create_parametros_section(analisis, denuncia))
            
            # Construir PDF
            doc.build(story)
            
            # Retornar bytes
            buffer.seek(0)
            pdf_bytes = buffer.getvalue()
            buffer.close()
            
            logger.info(f"PDF generado exitosamente para análisis {analisis.id_analisis}")
            return pdf_bytes
            
        except Exception as e:
            logger.error(f"Error generando PDF: {str(e)}")
            raise
    
    def _create_portada(self, analisis, denuncia, usuario):
        """Crear página de portada"""
        content = []
        
        # Título principal
        content.append(Paragraph("REPORTE DE INSPECCIÓN", self.custom_styles['titulo']))
        content.append(Spacer(1, 0.5*inch))
        
        # Información básica
        info_data = [
            ['<b>Campo</b>', '<b>Valor</b>'],
            ['ID de Análisis:', f"#{analisis.id_analisis}"],
            ['Sector:', denuncia.lugar if denuncia else 'N/A'],
            ['Fecha de Inspección:', denuncia.fecha_inspeccion.strftime('%d/%m/%Y') if denuncia and denuncia.fecha_inspeccion else 'N/A'],
            ['Inspector:', usuario.nombre if usuario else 'N/A'],
            ['Fecha de Análisis:', analisis.fecha_analisis.strftime('%d/%m/%Y %H:%M') if analisis.fecha_analisis else 'N/A'],
            ['Método:', analisis.metodo or 'N/A'],
        ]
        
        info_table = Table(info_data, colWidths=[2.5*inch, 3*inch])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        content.append(info_table)
        content.append(Spacer(1, 1*inch))
        
        # Nota sobre el reporte
        nota = """
        Este reporte contiene los resultados del análisis de intersección entre las evidencias GPS 
        recolectadas durante la inspección y las concesiones acuícolas registradas en la base de datos.
        """
        content.append(Paragraph(nota, self.custom_styles['normal']))
        
        return content
    
    def _create_resumen_ejecutivo(self, analisis, evidencias, concesiones, resultados):
        """Crear sección de resumen ejecutivo"""
        content = []
        
        content.append(Paragraph("RESUMEN EJECUTIVO", self.custom_styles['subtitulo']))
        content.append(Spacer(1, 0.2*inch))
        
        # Métricas principales
        titulares_unicos = len(set(c.titular for c in concesiones)) if concesiones else 0
        
        metricas_data = [
            ['<b>Métrica</b>', '<b>Valor</b>'],
            ['Concesiones Intersectadas', str(len(resultados))],
            ['Puntos GPS Recolectados', str(len(evidencias))],
            ['Distancia de Buffer', f"{analisis.distancia_buffer}m"],
            ['Titulares Afectados', str(titulares_unicos)]
        ]
        
        metricas_table = Table(metricas_data, colWidths=[3*inch, 2*inch])
        metricas_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        content.append(metricas_table)
        content.append(Spacer(1, 0.3*inch))
        
        # Resumen textual
        resumen_text = f"""
        El análisis procesó {len(evidencias)} puntos GPS utilizando un buffer de {analisis.distancia_buffer} metros, 
        identificando {len(resultados)} concesiones que intersectan con el área de estudio. 
        Se determinó que {titulares_unicos} titular(es) únicos se ven afectados por esta inspección.
        """
        
        content.append(Paragraph("<b>Resumen:</b>", self.custom_styles['bold']))
        content.append(Paragraph(resumen_text, self.custom_styles['normal']))
        
        return content
    
    def _create_concesiones_section(self, concesiones, resultados):
        """Crear sección de concesiones detalladas"""
        content = []
        
        content.append(Paragraph("CONCESIONES INTERSECTADAS", self.custom_styles['subtitulo']))
        content.append(Spacer(1, 0.2*inch))
        
        # Crear tabla de concesiones
        headers = ['Código Centro', 'Nombre', 'Titular', 'Tipo', 'Región', 'Intersección']
        table_data = [headers]
        
        # Crear un diccionario para búsqueda rápida de resultados
        resultados_dict = {r.id_concesion: r for r in resultados}
        
        for concesion in concesiones:
            resultado = resultados_dict.get(concesion.id_concesion)
            table_data.append([
                concesion.codigo_centro or 'N/A',
                concesion.nombre or 'N/A',
                concesion.titular or 'N/A',
                concesion.tipo or 'N/A',
                concesion.region or 'N/A',
                'Válida' if resultado and resultado.interseccion_valida else 'No Válida'
            ])
        
        # Ajustar ancho de columnas según el contenido
        col_widths = [1*inch, 1.3*inch, 1.5*inch, 1*inch, 1*inch, 0.8*inch]
        concesiones_table = Table(table_data, colWidths=col_widths)
        concesiones_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        content.append(concesiones_table)
        
        return content
    
    def _create_evidencias_section(self, evidencias):
        """Crear sección de evidencias GPS"""
        content = []
        
        content.append(Paragraph("EVIDENCIAS GPS", self.custom_styles['subtitulo']))
        content.append(Spacer(1, 0.2*inch))
        
        # Crear tabla de evidencias
        headers = ['ID', 'Fecha', 'Hora', 'Coordenadas', 'Descripción', 'Foto']
        table_data = [headers]
        
        for ev in evidencias:
            # Extraer coordenadas desde JSON string
            coords_text = 'N/A'
            try:
                if ev.coordenadas_json:
                    import json
                    coords = json.loads(ev.coordenadas_json)
                    if 'coordinates' in coords and len(coords['coordinates']) >= 2:
                        lon = coords['coordinates'][0]
                        lat = coords['coordinates'][1]
                        coords_text = f"{lat:.6f}, {lon:.6f}"
            except (json.JSONDecodeError, KeyError, IndexError) as e:
                logger.warning(f"Error procesando coordenadas para evidencia {ev.id_evidencia}: {e}")
                coords_text = 'Error en coordenadas'
            
            table_data.append([
                str(ev.id_evidencia),
                str(ev.fecha) if ev.fecha else 'N/A',
                str(ev.hora) if ev.hora else 'N/A',
                coords_text,
                (ev.descripcion[:30] + '...') if ev.descripcion and len(ev.descripcion) > 30 else (ev.descripcion or 'N/A'),
                'Sí' if ev.foto_url else 'No'
            ])
        
        col_widths = [0.5*inch, 0.8*inch, 0.8*inch, 1.5*inch, 2*inch, 0.5*inch]
        evidencias_table = Table(table_data, colWidths=col_widths)
        evidencias_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        content.append(evidencias_table)
        
        return content
    
    def _create_parametros_section(self, analisis, denuncia):
        """Crear sección de parámetros técnicos"""
        content = []
        
        content.append(Paragraph("PARÁMETROS TÉCNICOS", self.custom_styles['subtitulo']))
        content.append(Spacer(1, 0.2*inch))
        
        # Información técnica del análisis
        params_data = [
            ['<b>Parámetro</b>', '<b>Valor</b>'],
            ['ID de Análisis', f"#{analisis.id_analisis}"],
            ['ID de Denuncia', f"#{analisis.id_denuncia}"],
            ['Método de Análisis', analisis.metodo or 'N/A'],
            ['Distancia de Buffer', f"{analisis.distancia_buffer} metros"],
            ['Fecha de Análisis', analisis.fecha_analisis.strftime('%d/%m/%Y %H:%M:%S') if analisis.fecha_analisis else 'N/A'],
            ['Observaciones', analisis.observaciones or 'Sin observaciones']
        ]
        
        # Agregar información de la denuncia si está disponible
        if denuncia:
            params_data.extend([
                ['Sector Inspeccionado', denuncia.lugar or 'N/A'],
                ['Fecha de Inspección', denuncia.fecha_inspeccion.strftime('%d/%m/%Y') if denuncia.fecha_inspeccion else 'N/A'],
                ['Fecha de Ingreso', denuncia.fecha_ingreso.strftime('%d/%m/%Y') if denuncia.fecha_ingreso else 'N/A']
            ])
        
        params_table = Table(params_data, colWidths=[2.5*inch, 3.5*inch])
        params_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        content.append(params_table)
        
        # Agregar nota final
        content.append(Spacer(1, 0.5*inch))
        nota_final = f"""
        <b>Nota:</b> Este reporte fue generado automáticamente el {datetime.now().strftime('%d/%m/%Y a las %H:%M:%S')} 
        utilizando los datos almacenados en la base de datos del sistema de inspección de playas.
        """
        content.append(Paragraph(nota_final, self.custom_styles['normal']))
        
        return content 
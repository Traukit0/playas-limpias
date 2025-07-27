from xhtml2pdf import pisa
from jinja2 import Environment, FileSystemLoader, select_autoescape
from io import BytesIO
import logging
from datetime import datetime
import os
from pathlib import Path

logger = logging.getLogger(__name__)

class PDFGenerator:
    def __init__(self):
        """
        Inicializar el generador de PDF con xhtml2pdf y Jinja2
        """
        # Configurar el directorio de templates
        self.template_dir = Path(__file__).parent.parent / "templates" / "pdf"
        
        # Configurar Jinja2 environment
        self.jinja_env = Environment(
            loader=FileSystemLoader(str(self.template_dir)),
            autoescape=select_autoescape(['html', 'xml'])
        )
        
        # Agregar función 'now' para usar en templates
        self.jinja_env.globals['now'] = datetime.now
        
        logger.info("PDFGenerator inicializado con xhtml2pdf")
    
    async def generate_analysis_pdf(self, analisis, denuncia, evidencias, resultados, concesiones, usuario, estado):
        """
        Generar PDF completo del análisis usando xhtml2pdf y templates HTML modernos
        
        Args:
            analisis: Objeto AnalisisDenuncia
            denuncia: Objeto Denuncia
            evidencias: Lista de objetos Evidencia
            resultados: Lista de objetos ResultadoAnalisis
            concesiones: Lista de objetos Concesion
            usuario: Objeto Usuario
            estado: Objeto EstadoDenuncia
            
        Returns:
            bytes: PDF generado
        """
        try:
            logger.info(f"Iniciando generación de PDF para análisis {analisis.id_analisis}")
            
            # Preparar datos para el template
            context_data = self._prepare_template_context(
                analisis, denuncia, evidencias, resultados, concesiones, usuario, estado
            )
            
            # Cargar y renderizar el template
            template = self.jinja_env.get_template('inspection_report_basic_only.html')
            html_content = template.render(**context_data)
            
            # Generar PDF con xhtml2pdf
            pdf_bytes = self._generate_pdf_from_html(html_content)
            
            logger.info(f"PDF generado exitosamente para análisis {analisis.id_analisis} ({len(pdf_bytes)} bytes)")
            return pdf_bytes
            
        except Exception as e:
            logger.error(f"Error generando PDF para análisis {analisis.id_analisis}: {str(e)}")
            raise
    
    def _prepare_template_context(self, analisis, denuncia, evidencias, resultados, concesiones, usuario, estado):
        """
        Preparar el contexto de datos para el template Jinja2
        
        Returns:
            dict: Contexto con todos los datos necesarios para el template
        """
        try:
            # Convertir evidencias para mejor manejo en template
            evidencias_data = []
            if evidencias:
                for evidencia in evidencias:
                    evidencia_dict = {
                        'id_evidencia': evidencia.id_evidencia,
                        'fecha': evidencia.fecha.strftime('%d/%m/%Y') if evidencia.fecha else 'N/A',
                        'hora': evidencia.hora.strftime('%H:%M:%S') if evidencia.hora else 'N/A',
                        'descripcion': evidencia.descripcion or '',
                        'foto_url': evidencia.foto_url or '',
                        'coordenadas': evidencia.coordenadas if hasattr(evidencia, 'coordenadas') else None
                    }
                    evidencias_data.append(evidencia_dict)
            
            # Convertir concesiones para mejor manejo
            concesiones_data = []
            if concesiones:
                for concesion in concesiones:
                    concesion_dict = {
                        'id_concesion': concesion.id_concesion,
                        'codigo_centro': concesion.codigo_centro or 'N/A',
                        'nombre': concesion.nombre or 'N/A',
                        'titular': concesion.titular or 'N/A',
                        'tipo': concesion.tipo or 'N/A',
                        'region': concesion.region or 'N/A'
                    }
                    concesiones_data.append(concesion_dict)
            
            # Convertir resultados (según esquema real de BD)
            resultados_data = []
            if resultados:
                for resultado in resultados:
                    resultado_dict = {
                        'id_concesion': resultado.id_concesion,
                        'interseccion_valida': resultado.interseccion_valida,
                        'distancia_minima': getattr(resultado, 'distancia_minima', None)
                    }
                    resultados_data.append(resultado_dict)
            
            # Preparar contexto completo
            context = {
                'analisis': analisis,
                'denuncia': denuncia,
                'evidencias': evidencias_data,
                'resultados': resultados_data,
                'concesiones': concesiones_data,
                'usuario': usuario,
                'estado': estado,
                'fecha_generacion': datetime.now(),
                # Filtros personalizados para Jinja2
                'titulares_unicos': len(set(c.get('titular', '') for c in concesiones_data)) if concesiones_data else 0
            }
            
            logger.debug(f"Contexto preparado: {len(evidencias_data)} evidencias, {len(concesiones_data)} concesiones")
            return context
            
        except Exception as e:
            logger.error(f"Error preparando contexto del template: {str(e)}")
            raise
    
    def _generate_pdf_from_html(self, html_content):
        """
        Generar PDF desde contenido HTML usando xhtml2pdf
        
        Args:
            html_content (str): Contenido HTML renderizado
            
        Returns:
            bytes: PDF generado
        """
        try:
            # Crear buffer para el PDF
            pdf_buffer = BytesIO()
            
            # Generar PDF con xhtml2pdf
            pisa_status = pisa.pisaDocument(
                src=html_content,
                dest=pdf_buffer,
                encoding='UTF-8'
            )
            
            # Verificar si hubo errores
            if pisa_status.err:
                raise Exception(f"Error generando PDF con xhtml2pdf: {pisa_status.err} errores")
            
            # Obtener bytes del PDF
            pdf_buffer.seek(0)
            pdf_bytes = pdf_buffer.getvalue()
            pdf_buffer.close()
            
            return pdf_bytes
            
        except Exception as e:
            logger.error(f"Error generando PDF con xhtml2pdf: {str(e)}")
            raise
    
    def generate_simple_test_pdf(self):
        """
        Generar un PDF simple para pruebas
        
        Returns:
            bytes: PDF de prueba
        """
        try:
            html_content = f'''<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Test PDF</title>
    <style>
        @page {{ size: A4; margin: 2cm; }}
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }}
        .header {{ background: #1976d2; color: white; padding: 30px; text-align: center; margin-bottom: 30px; }}
        .content {{ background: #f5f5f5; padding: 20px; border: 1px solid #ddd; }}
        h1 {{ margin: 0 0 10px 0; font-size: 24px; }}
        h2 {{ color: #1976d2; margin-top: 0; }}
        ul {{ margin: 16px 0; padding-left: 20px; }}
        li {{ margin: 8px 0; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>PDF Generado con xhtml2pdf</h1>
        <p>Sistema Playas Limpias - Nuevo Generador de PDF</p>
    </div>
    
    <div class="content">
        <h2>¡Implementación Exitosa!</h2>
        <p>Este PDF ha sido generado usando <strong>xhtml2pdf</strong> en lugar de ReportLab.</p>
        <p>Fecha de generación: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}</p>
        
        <h3>Ventajas de xhtml2pdf:</h3>
        <ul>
            <li>✅ PDFs modernos y atractivos visualmente</li>
            <li>✅ Compatible con CSS para diseño moderno</li>
            <li>✅ Muy liviano (sin dependencias externas complejas)</li>
            <li>✅ Compatible con Windows y Linux</li>
            <li>✅ Fácil mantenimiento con templates HTML</li>
            <li>✅ Instalación simple sin librerías GTK+</li>
        </ul>
        
        <p><strong>¡La migración ha sido exitosa!</strong></p>
    </div>
</body>
</html>'''
            
            return self._generate_pdf_from_html(html_content)
            
        except Exception as e:
            logger.error(f"Error generando PDF de prueba: {str(e)}")
            raise 
from xhtml2pdf import pisa
from jinja2 import Environment, FileSystemLoader, select_autoescape
from io import BytesIO
import logging
from datetime import datetime
import os
from pathlib import Path
from config import FOTOS_DIR

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
    
    def _convertir_a_ruta_local(self, foto_url):
        """
        Convierte la foto_url a una ruta de archivo local absoluta para xhtml2pdf.
        
        xhtml2pdf funciona mejor con rutas de archivos locales que con URLs HTTP.
        Este método es escalable y funciona tanto en desarrollo como en producción.
        
        Args:
            foto_url (str): URL o ruta relativa de la foto
            
        Returns:
            str: Ruta absoluta del archivo local, o None si no existe
        """
        if not foto_url or foto_url.strip() == '':
            return None
            
        # Limpiar la entrada
        foto_url = foto_url.strip()
        
        # Obtener la ruta base del directorio de fotos desde configuración
        fotos_base_path = Path(FOTOS_DIR).resolve()
        
        # Caso 1: Ruta que empieza con /fotos/ (formato API)
        if foto_url.startswith('/fotos/'):
            ruta_relativa = foto_url[7:]  # Eliminar '/fotos/'
            ruta_completa = fotos_base_path / ruta_relativa
        
        # Caso 2: Ruta que empieza con fotos/ (formato directo)
        elif foto_url.startswith('fotos/'):
            ruta_relativa = foto_url[6:]  # Eliminar 'fotos/'
            ruta_completa = fotos_base_path / ruta_relativa
        
        # Caso 3: Ya es una ruta absoluta del sistema de archivos
        elif os.path.isabs(foto_url):
            ruta_completa = Path(foto_url).resolve()
        
        # Caso 4: URL HTTP completa (convertir a ruta local si es del mismo servidor)
        elif foto_url.startswith(('http://', 'https://')):
            try:
                from urllib.parse import urlparse
                parsed = urlparse(foto_url)
                if parsed.path.startswith('/fotos/'):
                    ruta_relativa = parsed.path[7:]  # Eliminar '/fotos/'
                    ruta_completa = fotos_base_path / ruta_relativa
                else:
                    logger.warning(f"URL externa no soportada para PDF: {foto_url}")
                    return None
            except Exception as e:
                logger.error(f"Error procesando URL {foto_url}: {e}")
                return None
        
        # Caso 5: Cualquier otro formato, asumir ruta relativa dentro de fotos/
        else:
            ruta_completa = fotos_base_path / foto_url
        
        # Verificar que el archivo existe y está dentro del directorio permitido
        try:
            ruta_completa = ruta_completa.resolve()
            
            # Verificación de seguridad: el archivo debe estar dentro del directorio de fotos
            if not str(ruta_completa).startswith(str(fotos_base_path)):
                logger.warning(f"Ruta de foto fuera del directorio permitido: {ruta_completa}")
                return None
            
            if ruta_completa.exists() and ruta_completa.is_file():
                logger.debug(f"Foto encontrada: {ruta_completa}")
                return str(ruta_completa)
            else:
                logger.warning(f"Archivo de foto no encontrado: {ruta_completa}")
                return None
                
        except Exception as e:
            logger.error(f"Error resolviendo ruta de foto {foto_url}: {e}")
            return None

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
                        'foto_url': self._convertir_a_ruta_local(evidencia.foto_url),
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
            
            # Verificar si existe mapa generado para este análisis
            mapa_resultados_path = None
            if analisis and hasattr(analisis, 'id_analisis') and denuncia and hasattr(denuncia, 'id_denuncia'):
                # Nuevo path: fotos/denuncia_{id_denuncia}/mapa_analisis_{id_analisis}.png
                mapa_path = Path(FOTOS_DIR) / f"denuncia_{denuncia.id_denuncia}" / f"mapa_analisis_{analisis.id_analisis}.png"
                if mapa_path.exists():
                    mapa_resultados_path = str(mapa_path.resolve())
                    logger.debug(f"✅ Mapa encontrado para análisis {analisis.id_analisis}: {mapa_resultados_path}")
                else:
                    logger.warning(f"❌ No se encontró mapa para análisis {analisis.id_analisis}: {mapa_path}")
                    # También buscar en la ubicación antigua por compatibilidad
                    mapa_path_old = Path(FOTOS_DIR) / f"analisis_{analisis.id_analisis}" / "mapa_resultados.png"
                    if mapa_path_old.exists():
                        mapa_resultados_path = str(mapa_path_old.resolve())
                        logger.info(f"⚠️ Usando mapa en ubicación antigua: {mapa_resultados_path}")
            
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
                'mapa_resultados_path': mapa_resultados_path,
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
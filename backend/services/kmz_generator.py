import zipfile
from io import BytesIO
import xml.etree.ElementTree as ET
from xml.dom import minidom
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path
import json
import os

logger = logging.getLogger(__name__)

class KMZGenerator:
    """
    Generador de archivos KMZ para Google Earth.
    
    Características:
    - Compatible con Google Earth Pro y Google Earth Web
    - Soporte para geometrías complejas (Polygon, MultiPolygon)
    - Estilos personalizados para diferentes tipos de datos
    - Inclusión de metadatos y descripciones enriquecidas
    - Manejo de coordenadas WGS84
    - Compatible con Windows y Linux
    """
    
    def __init__(self):
        self.kml_namespace = "http://www.opengis.net/kml/2.2"
        logger.info("KMZGenerator inicializado")
    
    async def generate_analysis_kmz(self, analisis, evidencias, concesiones, buffer_geom):
        """
        Generar archivo KMZ completo para un análisis de inspección
        
        Args:
            analisis: Objeto AnalisisDenuncia
            evidencias: Lista de objetos Evidencia
            concesiones: Lista de objetos Concesion
            buffer_geom: GeoJSON del buffer
            
        Returns:
            bytes: Contenido del archivo KMZ
        """
        try:
            logger.info(f"Iniciando generación de KMZ para análisis {analisis.id_analisis}")
            
            # 1. Crear contenido KML
            kml_content = self._create_kml(analisis, evidencias, concesiones, buffer_geom)
            
            # 2. Crear archivo ZIP (KMZ)
            kmz_buffer = BytesIO()
            
            with zipfile.ZipFile(kmz_buffer, 'w', zipfile.ZIP_DEFLATED) as kmz:
                # Agregar KML principal
                kmz.writestr('doc.kml', kml_content, compress_type=zipfile.ZIP_DEFLATED)
                
                # Agregar fotografías si existen
                await self._add_photos_to_kmz(kmz, evidencias)
            
            kmz_buffer.seek(0)
            kmz_bytes = kmz_buffer.getvalue()
            
            logger.info(f"KMZ generado exitosamente para análisis {analisis.id_analisis} ({len(kmz_bytes)} bytes)")
            return kmz_bytes
            
        except Exception as e:
            logger.error(f"Error generando KMZ para análisis {analisis.id_analisis}: {str(e)}")
            raise
    
    def _create_kml(self, analisis, evidencias, concesiones, buffer_geom):
        """
        Crear contenido KML completo
        
        Returns:
            str: Contenido XML del KML
        """
        # Crear documento KML
        kml = ET.Element('kml', xmlns=self.kml_namespace)
        document = ET.SubElement(kml, 'Document')
        
        # Metadata del documento
        ET.SubElement(document, 'name').text = str(f"Inspección - Análisis #{analisis.id_analisis}")
        ET.SubElement(document, 'description').text = str(f"""
            <![CDATA[
            <h3>Análisis de Inspección</h3>
            <p><b>ID de Análisis:</b> {analisis.id_analisis}</p>
            <p><b>Fecha de Análisis:</b> {analisis.fecha_analisis.strftime('%d/%m/%Y %H:%M:%S')}</p>
            <p><b>Distancia de Buffer:</b> {analisis.distancia_buffer}m</p>
            <p><b>Método:</b> {analisis.metodo}</p>
            <p><b>Evidencias GPS:</b> {len(evidencias)}</p>
            <p><b>Concesiones Intersectadas:</b> {len(concesiones)}</p>
            ]]>
        """)
        
        # Agregar estilos personalizados
        self._add_styles(document)
        
        # Agregar ListStyle para mejor navegación
        list_style = ET.SubElement(document, 'ListStyle')
        ET.SubElement(list_style, 'listItemType').text = 'check'
        ET.SubElement(list_style, 'bgColor').text = 'ffffffff'
        
        # Carpeta de evidencias GPS
        if evidencias:
            evidencias_folder = ET.SubElement(document, 'Folder')
            ET.SubElement(evidencias_folder, 'name').text = 'Evidencias GPS'
            ET.SubElement(evidencias_folder, 'description').text = str(f'Puntos GPS recolectados durante la inspección ({len(evidencias)} puntos)')
            
            for evidencia in evidencias:
                if hasattr(evidencia, 'coordenadas') and evidencia.coordenadas:
                    self._add_evidencia_placemark(evidencias_folder, evidencia)
        
        # Buffer
        if buffer_geom:
            buffer_folder = ET.SubElement(document, 'Folder')
            ET.SubElement(buffer_folder, 'name').text = 'Área de Buffer'
            ET.SubElement(buffer_folder, 'description').text = str(f'Área de análisis con buffer de {analisis.distancia_buffer}m')
            
            self._add_buffer_placemark(buffer_folder, analisis, buffer_geom)
        
        # Concesiones
        if concesiones:
            concesiones_folder = ET.SubElement(document, 'Folder')
            ET.SubElement(concesiones_folder, 'name').text = 'Concesiones Intersectadas'
            ET.SubElement(concesiones_folder, 'description').text = str(f'Concesiones que intersectan con el área de buffer ({len(concesiones)} concesiones)')
            
            for concesion in concesiones:
                if hasattr(concesion, 'geom') and concesion.geom:
                    self._add_concesion_placemark(concesiones_folder, concesion)
        
        # Convertir a string XML formateado
        try:
            rough_string = ET.tostring(kml, 'unicode')
            reparsed = minidom.parseString(rough_string)
            return reparsed.toprettyxml(indent="  ")
        except Exception as e:
            logger.error(f"Error serializando KML: {e}")
            # Fallback: retornar XML simple sin formatear
            return ET.tostring(kml, 'unicode')
    
    def _add_styles(self, document):
        """Agregar estilos personalizados para diferentes elementos"""
        
        # Estilo para evidencias GPS (círculos amarillos pequeños)
        evidencia_style = ET.SubElement(document, 'Style', id='evidencia_style')
        icon_style = ET.SubElement(evidencia_style, 'IconStyle')
        ET.SubElement(icon_style, 'color').text = str('ff00ffff')  # Amarillo (ABGR)
        ET.SubElement(icon_style, 'scale').text = str('1.2')  # Escala más pequeña
        # Usar ícono de círculo correcto según documentación oficial
        icon_element = ET.SubElement(icon_style, 'Icon')
        ET.SubElement(icon_element, 'href').text = str('http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png')
        # BalloonStyle para mejor interactividad
        balloon_style = ET.SubElement(evidencia_style, 'BalloonStyle')
        ET.SubElement(balloon_style, 'text').text = str('$[description]')
        ET.SubElement(balloon_style, 'bgColor').text = str('ffffffff')  # Fondo blanco
        ET.SubElement(balloon_style, 'textColor').text = str('ff000000')  # Texto negro
        
        # Estilo para buffer (línea verde, con relleno muy transparente para interactividad)
        buffer_style = ET.SubElement(document, 'Style', id='buffer_style')
        line_style = ET.SubElement(buffer_style, 'LineStyle')
        ET.SubElement(line_style, 'color').text = str('ff00ff00')  # Verde (ABGR)
        ET.SubElement(line_style, 'width').text = str('3')
        poly_style = ET.SubElement(buffer_style, 'PolyStyle')
        ET.SubElement(poly_style, 'color').text = str('0a00ff00')  # Verde muy transparente (10% opacidad)
        ET.SubElement(poly_style, 'fill').text = str('1')  # Con relleno para interactividad
        ET.SubElement(poly_style, 'outline').text = str('1')  # Con contorno
        # BalloonStyle para mejor interactividad
        balloon_style = ET.SubElement(buffer_style, 'BalloonStyle')
        ET.SubElement(balloon_style, 'text').text = str('$[description]')
        ET.SubElement(balloon_style, 'bgColor').text = str('ffffffff')  # Fondo blanco
        ET.SubElement(balloon_style, 'textColor').text = str('ff000000')  # Texto negro
        
        # Estilo para concesiones válidas (rojo, con relleno muy transparente para interactividad)
        concesion_valida_style = ET.SubElement(document, 'Style', id='concesion_valida_style')
        line_style = ET.SubElement(concesion_valida_style, 'LineStyle')
        ET.SubElement(line_style, 'color').text = str('ff0000ff')  # Rojo (ABGR)
        ET.SubElement(line_style, 'width').text = str('2')
        poly_style = ET.SubElement(concesion_valida_style, 'PolyStyle')
        ET.SubElement(poly_style, 'color').text = str('0a0000ff')  # Rojo muy transparente (10% opacidad)
        ET.SubElement(poly_style, 'fill').text = str('1')  # Con relleno para interactividad
        ET.SubElement(poly_style, 'outline').text = str('1')  # Con contorno
        # BalloonStyle para mejor interactividad
        balloon_style = ET.SubElement(concesion_valida_style, 'BalloonStyle')
        ET.SubElement(balloon_style, 'text').text = str('$[description]')
        ET.SubElement(balloon_style, 'bgColor').text = str('ffffffff')  # Fondo blanco
        ET.SubElement(balloon_style, 'textColor').text = str('ff000000')  # Texto negro
        
        # Estilo para concesiones no válidas (rojo, con relleno muy transparente para interactividad)
        concesion_invalida_style = ET.SubElement(document, 'Style', id='concesion_invalida_style')
        line_style = ET.SubElement(concesion_invalida_style, 'LineStyle')
        ET.SubElement(line_style, 'color').text = str('ff0000ff')  # Rojo (ABGR)
        ET.SubElement(line_style, 'width').text = str('2')
        poly_style = ET.SubElement(concesion_invalida_style, 'PolyStyle')
        ET.SubElement(poly_style, 'color').text = str('0a0000ff')  # Rojo muy transparente (10% opacidad)
        ET.SubElement(poly_style, 'fill').text = str('1')  # Con relleno para interactividad
        ET.SubElement(poly_style, 'outline').text = str('1')  # Con contorno
        # BalloonStyle para mejor interactividad
        balloon_style = ET.SubElement(concesion_invalida_style, 'BalloonStyle')
        ET.SubElement(balloon_style, 'text').text = str('$[description]')
        ET.SubElement(balloon_style, 'bgColor').text = str('ffffffff')  # Fondo blanco
        ET.SubElement(balloon_style, 'textColor').text = str('ff000000')  # Texto negro
    
    def _add_evidencia_placemark(self, folder, evidencia):
        """Agregar placemark para una evidencia GPS"""
        try:
            placemark = ET.SubElement(folder, 'Placemark')
            ET.SubElement(placemark, 'name').text = str(f"Evidencia #{evidencia.id_evidencia}")
            
            # Descripción enriquecida
            fecha_str = evidencia.fecha.strftime('%d/%m/%Y') if hasattr(evidencia.fecha, 'strftime') else str(evidencia.fecha)
            hora_str = evidencia.hora.strftime('%H:%M:%S') if hasattr(evidencia.hora, 'strftime') else str(evidencia.hora)
            lat = float(evidencia.coordenadas['coordinates'][1])
            lon = float(evidencia.coordenadas['coordinates'][0])
            
            descripcion = f"""
            <![CDATA[
            <h4>Evidencia #{evidencia.id_evidencia}</h4>
            <table>
                <tr><td><b>Fecha:</b></td><td>{fecha_str}</td></tr>
                <tr><td><b>Hora:</b></td><td>{hora_str}</td></tr>
                <tr><td><b>Coordenadas:</b></td><td>{lat:.6f}, {lon:.6f}</td></tr>
            </table>
            """
            if hasattr(evidencia, 'descripcion') and evidencia.descripcion:
                descripcion += f"<p><b>Descripción:</b> {str(evidencia.descripcion)}</p>"
            if hasattr(evidencia, 'foto_url') and evidencia.foto_url:
                # Incluir la foto en la descripción del KML
                # La ruta debe ser relativa al KMZ, no al sistema de archivos
                foto_url = evidencia.foto_url
                
                # Remover slash inicial si existe
                if foto_url.startswith('/'):
                    foto_url = foto_url[1:]
                
                # Extraer solo el nombre del archivo de la ruta
                nombre_archivo = Path(foto_url).name
                foto_filename = f"fotos/evidencia_{evidencia.id_evidencia}_{nombre_archivo}"
                descripcion += f"<p>📷 <b>Fotografía:</b></p>"
                descripcion += f"<img src='{foto_filename}' width='300' style='max-width:100%; height:auto;' />"
            descripcion += "]]>"
            
            ET.SubElement(placemark, 'description').text = str(descripcion)
            ET.SubElement(placemark, 'styleUrl').text = '#evidencia_style'
            
            # Punto simple
            point = ET.SubElement(placemark, 'Point')
            coords = f"{lon},{lat},0"
            ET.SubElement(point, 'coordinates').text = str(coords)
            
        except Exception as e:
            logger.error(f"Error agregando evidencia {evidencia.id_evidencia}: {e}")
    
    def _add_buffer_placemark(self, folder, analisis, buffer_geom):
        """Agregar placemark para el buffer"""
        try:
            placemark = ET.SubElement(folder, 'Placemark')
            ET.SubElement(placemark, 'name').text = str(f"Buffer {analisis.distancia_buffer}m")
            ET.SubElement(placemark, 'description').text = str(f"""
            <![CDATA[
            <h4>Área de Buffer</h4>
            <p><b>Distancia:</b> {analisis.distancia_buffer}m</p>
            <p><b>Método:</b> {analisis.metodo}</p>
            <p>Esta área representa la zona de análisis alrededor de los puntos GPS recolectados.</p>
            ]]>
            """)
            ET.SubElement(placemark, 'styleUrl').text = '#buffer_style'
            
            # Convertir GeoJSON a KML geometry
            self._add_geojson_to_kml(placemark, buffer_geom)
            
        except Exception as e:
            logger.error(f"Error agregando buffer: {e}")
    
    def _add_concesion_placemark(self, folder, concesion):
        """Agregar placemark para una concesión"""
        try:
            placemark = ET.SubElement(folder, 'Placemark')
            ET.SubElement(placemark, 'name').text = str(concesion.codigo_centro or f"Concesión #{concesion.id_concesion}")
            
            # Determinar estilo basado en intersección válida
            # Por ahora usamos válida, pero esto debería venir de los resultados
            style_id = '#concesion_valida_style'
            
            # Descripción enriquecida
            descripcion = f"""
            <![CDATA[
            <h4>{concesion.codigo_centro or 'Concesión'}</h4>
            <table>
                <tr><td><b>Nombre:</b></td><td>{concesion.nombre or 'N/A'}</td></tr>
                <tr><td><b>Titular:</b></td><td>{concesion.titular or 'N/A'}</td></tr>
                <tr><td><b>Tipo:</b></td><td>{concesion.tipo or 'N/A'}</td></tr>
                <tr><td><b>Región:</b></td><td>{concesion.region or 'N/A'}</td></tr>
            </table>
            ]]>
            """
            
            ET.SubElement(placemark, 'description').text = str(descripcion)
            ET.SubElement(placemark, 'styleUrl').text = style_id
            
            # Convertir GeoJSON a KML geometry
            if hasattr(concesion, 'geom') and concesion.geom:
                self._add_geojson_to_kml(placemark, concesion.geom)
            else:
                logger.warning(f"Concesión {concesion.id_concesion} sin geometría válida")
            
        except Exception as e:
            logger.error(f"Error agregando concesión {concesion.id_concesion}: {e}")
    
    def _add_geojson_to_kml(self, placemark, geojson):
        """
        Convertir geometría GeoJSON a elementos KML
        
        Args:
            placemark: Elemento Placemark donde agregar la geometría
            geojson: Diccionario GeoJSON
        """
        try:
            if isinstance(geojson, str):
                geojson = json.loads(geojson)
            
            if not geojson or not isinstance(geojson, dict):
                logger.warning("Geometría GeoJSON inválida o vacía")
                return
            
            geom_type = geojson.get('type')
            coordinates = geojson.get('coordinates', [])
            
            if not coordinates:
                logger.warning(f"Geometría sin coordenadas: {geom_type}")
                return
            
            if geom_type == 'Polygon':
                self._add_polygon_to_kml(placemark, coordinates)
            elif geom_type == 'MultiPolygon':
                self._add_multipolygon_to_kml(placemark, coordinates)
            elif geom_type == 'Point':
                self._add_point_to_kml(placemark, coordinates)
            else:
                logger.warning(f"Tipo de geometría no soportado: {geom_type}")
                
        except Exception as e:
            logger.error(f"Error convirtiendo geometría GeoJSON a KML: {e}")
            logger.debug(f"Geometría problemática: {geojson}")
    
    def _add_polygon_to_kml(self, placemark, coordinates):
        """Agregar polígono simple a KML"""
        try:
            if not coordinates or len(coordinates) == 0:
                logger.warning("Polígono sin coordenadas")
                return
            
            polygon = ET.SubElement(placemark, 'Polygon')
            # Remover extrude y altitudeMode para mejor compatibilidad
            # ET.SubElement(polygon, 'extrude').text = '1'
            # ET.SubElement(polygon, 'altitudeMode').text = 'relativeToGround'
            
            # Anillo exterior
            outer_boundary = ET.SubElement(polygon, 'outerBoundaryIs')
            linear_ring = ET.SubElement(outer_boundary, 'LinearRing')
            
            # Convertir coordenadas
            coord_string = ""
            for coord in coordinates[0]:  # Primer anillo (exterior)
                if len(coord) >= 2:
                    coord_string += f"{float(coord[0])},{float(coord[1])},0 "
            
            ET.SubElement(linear_ring, 'coordinates').text = str(coord_string.strip())
            
            # Anillos interiores (huecos)
            for i in range(1, len(coordinates)):
                inner_boundary = ET.SubElement(polygon, 'innerBoundaryIs')
                linear_ring = ET.SubElement(inner_boundary, 'LinearRing')
                
                coord_string = ""
                for coord in coordinates[i]:
                    if len(coord) >= 2:
                        coord_string += f"{float(coord[0])},{float(coord[1])},0 "
                
                ET.SubElement(linear_ring, 'coordinates').text = str(coord_string.strip())
                
        except Exception as e:
            logger.error(f"Error agregando polígono: {e}")
            logger.debug(f"Coordenadas problemáticas: {coordinates}")
    
    def _add_multipolygon_to_kml(self, placemark, coordinates):
        """Agregar multipolígono a KML"""
        try:
            # Para MultiPolygon, crear múltiples Placemarks
            for i, polygon_coords in enumerate(coordinates):
                if i == 0:
                    # Usar el placemark existente para el primer polígono
                    self._add_polygon_to_kml(placemark, polygon_coords)
                else:
                    # Crear placemarks adicionales para polígonos adicionales
                    # Por simplicidad, solo agregamos el primer polígono
                    # En una implementación más completa, se crearían placemarks separados
                    break
                    
        except Exception as e:
            logger.error(f"Error agregando multipolígono: {e}")
    
    def _add_point_to_kml(self, placemark, coordinates):
        """Agregar punto a KML"""
        try:
            if not coordinates or len(coordinates) < 2:
                logger.warning("Punto sin coordenadas válidas")
                return
            
            point = ET.SubElement(placemark, 'Point')
            coords = f"{float(coordinates[0])},{float(coordinates[1])},0"
            ET.SubElement(point, 'coordinates').text = coords
            
        except Exception as e:
            logger.error(f"Error agregando punto: {e}")
            logger.debug(f"Coordenadas problemáticas: {coordinates}")
    
    async def _add_photos_to_kmz(self, kmz, evidencias):
        """
        Agregar fotos de evidencias al archivo KMZ
        
        Args:
            kmz: Archivo ZIP del KMZ
            evidencias: Lista de objetos Evidencia
        """
        try:
            import os
            from pathlib import Path
            
            for evidencia in evidencias:
                if hasattr(evidencia, 'foto_url') and evidencia.foto_url:
                    # Obtener la ruta de la foto desde la base de datos
                    foto_url = evidencia.foto_url
                    
                    # Remover slash inicial si existe
                    if foto_url.startswith('/'):
                        foto_url = foto_url[1:]
                    
                    # Construir ruta completa del archivo en el sistema
                    foto_path = Path(foto_url)
                    
                    # Verificar que el archivo existe
                    if foto_path.exists():
                        try:
                            # Leer el archivo de foto
                            with open(foto_path, 'rb') as foto_file:
                                foto_content = foto_file.read()
                            
                            # Crear nombre de archivo para el KMZ (sin duplicar 'fotos/')
                            # La ruta en el KMZ debe ser: fotos/evidencia_X_nombre.jpg
                            nombre_archivo = foto_path.name
                            foto_filename = f"fotos/evidencia_{evidencia.id_evidencia}_{nombre_archivo}"
                            
                            # Agregar al KMZ
                            kmz.writestr(foto_filename, foto_content, compress_type=zipfile.ZIP_DEFLATED)
                            
                            logger.info(f"Foto agregada al KMZ: {foto_filename}")
                            
                        except Exception as e:
                            logger.warning(f"No se pudo agregar foto para evidencia {evidencia.id_evidencia}: {e}")
                    else:
                        logger.warning(f"Archivo de foto no encontrado: {foto_path}")
                        
        except Exception as e:
            logger.error(f"Error agregando fotos al KMZ: {e}") 
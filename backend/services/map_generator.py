import os
import logging
import tempfile
import shutil
from pathlib import Path
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text
import json

# Configuración de logging
logger = logging.getLogger(__name__)

try:
    import staticmaps
    STATICMAPS_AVAILABLE = True
except ImportError:
    STATICMAPS_AVAILABLE = False
    logger.warning("py-staticmaps no está instalado. La generación de mapas estará deshabilitada.")

try:
    from PIL import Image, ImageDraw, ImageFont
    PILLOW_AVAILABLE = True
except ImportError:
    PILLOW_AVAILABLE = False
    logger.warning("Pillow no está disponible para generar marcadores personalizados.")

from config import FOTOS_DIR

class MapGenerator:
    """
    Generador de mapas estáticos para análisis de inspecciones.
    Crea mapas PNG con buffer, concesiones y evidencias GPS.
    """
    
    def __init__(self):
        self.fotos_dir = Path(FOTOS_DIR)
        self.map_width = 1024
        self.map_height = 900
        self.temp_markers = []  # Lista para mantener track de marcadores temporales

        logger.info(f"MapGenerator inicializado. FOTOS_DIR: {self.fotos_dir}")
        logger.info(f"STATICMAPS_AVAILABLE: {STATICMAPS_AVAILABLE}")
        logger.info(f"PILLOW_AVAILABLE: {PILLOW_AVAILABLE}")
        if STATICMAPS_AVAILABLE:
            logger.info("✅ py-staticmaps está disponible")
        else:
            logger.error("❌ py-staticmaps NO está disponible")
    
    def _crear_marcador_codigo_centro(self, codigo_centro: str, interseccion_valida: bool) -> Optional[str]:
        """
        Crea una imagen PNG personalizada con el código de centro para usar como marcador.
        
        Args:
            codigo_centro: El código del centro de cultivo
            interseccion_valida: Si la intersección es válida (para definir colores)
            
        Returns:
            Path absoluto al archivo de imagen temporal o None si falla
        """
        if not PILLOW_AVAILABLE:
            logger.warning("Pillow no disponible, no se puede crear marcador personalizado")
            return None
            
        try:
            # Configurar colores según validez
            if interseccion_valida:
                bg_color = "#FF0000"  # Rojo para válidas
                text_color = "#FFFFFF"  # Texto blanco
            else:
                bg_color = "#FFA500"  # Naranja para no válidas
                text_color = "#000000"  # Texto negro
            
            # Configurar dimensiones del marcador (un poco más grande para mejor legibilidad)
            width, height = 70, 28
            border_radius = 4
            
            # Crear imagen con transparencia
            img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
            draw = ImageDraw.Draw(img)
            
            # Dibujar rectángulo redondeado como fondo
            draw.rounded_rectangle(
                [(0, 0), (width-1, height-1)], 
                radius=border_radius, 
                fill=bg_color, 
                outline="#000000", 
                width=1
            )
            
            # Truncar código si es muy largo
            codigo_display = codigo_centro[:8] if len(codigo_centro) > 8 else codigo_centro
            
            # Intentar usar una fuente del sistema con tamaño más grande
            try:
                # Intentar fuente Arial/DejaVu en tamaño 12 para mejor visibilidad
                font = ImageFont.truetype("arial.ttf", 12)
            except:
                try:
                    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 12)
                except:
                    try:
                        # Fuente por defecto con tamaño aumentado si es posible
                        font = ImageFont.load_default()
                    except:
                        font = None
            
            # Calcular posición del texto para centrarlo
            if font:
                bbox = draw.textbbox((0, 0), codigo_display, font=font)
                text_width = bbox[2] - bbox[0]
                text_height = bbox[3] - bbox[1]
            else:
                # Estimación si no hay fuente disponible
                text_width = len(codigo_display) * 6
                text_height = 10
            
            text_x = (width - text_width) // 2
            text_y = (height - text_height) // 2
            
            # Dibujar texto
            draw.text((text_x, text_y), codigo_display, fill=text_color, font=font)
            
            # Crear archivo temporal
            temp_file = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
            temp_path = temp_file.name
            temp_file.close()
            
            # Guardar imagen
            img.save(temp_path, 'PNG')
            
            # Agregar a lista para limpieza posterior
            self.temp_markers.append(temp_path)
            
            logger.debug(f"Marcador personalizado creado: {temp_path} para código {codigo_centro}")
            return temp_path
            
        except Exception as e:
            logger.error(f"Error creando marcador personalizado para {codigo_centro}: {e}")
            return None
    
    def _limpiar_marcadores_temporales(self):
        """
        Limpia los archivos temporales de marcadores personalizados.
        """
        for temp_path in self.temp_markers:
            try:
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
                    logger.debug(f"Archivo temporal eliminado: {temp_path}")
            except Exception as e:
                logger.warning(f"No se pudo eliminar archivo temporal {temp_path}: {e}")
        self.temp_markers.clear()
        
    def generar_mapa_analisis(self, id_analisis: int, db: Session) -> Optional[str]:
        """
        Genera un mapa estático para un análisis específico.
        
        Args:
            id_analisis: ID del análisis
            db: Sesión de base de datos
            
        Returns:
            str: Ruta absoluta al archivo de imagen generado, o None si hay error
        """
        if not STATICMAPS_AVAILABLE:
            logger.error("py-staticmaps no está disponible")
            return None
            
        try:
            # Obtener datos del análisis
            logger.info(f"🔍 Iniciando generación de mapa para análisis {id_analisis}")
            datos_analisis = self._obtener_datos_analisis(db, id_analisis)
            if not datos_analisis:
                logger.error(f"❌ No se encontraron datos para análisis {id_analisis}")
                return None
            
            logger.info(f"📊 Datos obtenidos - Evidencias: {len(datos_analisis.get('evidencias', []))}, "
                       f"Concesiones: {len(datos_analisis.get('concesiones', []))}, "
                       f"Buffer: {'✅' if datos_analisis.get('buffer_geom') else '❌'}")
                
            # Crear contexto del mapa
            context = staticmaps.Context()
            context.set_tile_provider(staticmaps.tile_provider_OSM)
            
            # Agregar buffer (polígono azul)
            if datos_analisis['buffer_geom']:
                self._agregar_buffer(context, datos_analisis['buffer_geom'])
            
            # Agregar concesiones (polígonos rojos/naranjas)
            if datos_analisis['concesiones']:
                self._agregar_concesiones(context, datos_analisis['concesiones'])
            
            # Agregar evidencias GPS (marcadores azules)
            if datos_analisis['evidencias']:
                self._agregar_evidencias(context, datos_analisis['evidencias'])
            
            # Crear directorio en la carpeta de denuncia (mantener organización)
            denuncia_dir = self.fotos_dir / f"denuncia_{datos_analisis['id_denuncia']}"
            denuncia_dir.mkdir(parents=True, exist_ok=True)
            
            # Renderizar mapa
            mapa_path = denuncia_dir / f"mapa_analisis_{id_analisis}.png"
            
            image = context.render_pillow(self.map_width, self.map_height)
            image.save(str(mapa_path))
            
            # Verificar que se guardó correctamente
            if mapa_path.exists():
                size_mb = mapa_path.stat().st_size / (1024 * 1024)
                logger.info(f"✅ Mapa generado exitosamente: {mapa_path} ({size_mb:.2f} MB)")
                resultado = str(mapa_path)
            else:
                logger.error(f"❌ Error: El archivo no se guardó correctamente")
                resultado = None
            
            # Limpiar marcadores temporales
            self._limpiar_marcadores_temporales()
            return resultado
            
        except Exception as e:
            logger.error(f"Error generando mapa para análisis {id_analisis}: {e}")
            # Limpiar marcadores temporales en caso de error
            self._limpiar_marcadores_temporales()
            return None
    
    def _obtener_datos_analisis(self, db: Session, id_analisis: int) -> Optional[Dict[str, Any]]:
        """
        Obtiene todos los datos necesarios para generar el mapa.
        """
        try:
            # Obtener datos del análisis y buffer
            analisis_query = text("""
                SELECT 
                    a.id_denuncia,
                    a.distancia_buffer,
                    ST_AsGeoJSON(a.buffer_geom) as buffer_geom_json
                FROM analisis_denuncia a
                WHERE a.id_analisis = :id_analisis
            """)
            analisis_result = db.execute(analisis_query, {"id_analisis": id_analisis}).fetchone()
            
            if not analisis_result:
                return None
            
            # Obtener evidencias GPS
            evidencias_query = text("""
                SELECT 
                    id_evidencia,
                    ST_X(coordenadas) as lon,
                    ST_Y(coordenadas) as lat,
                    descripcion
                FROM evidencias 
                WHERE id_denuncia = :id_denuncia
                ORDER BY id_evidencia
            """)
            evidencias_result = db.execute(evidencias_query, {"id_denuncia": analisis_result.id_denuncia}).fetchall()
            
            # Obtener concesiones intersectadas
            concesiones_query = text("""
                SELECT 
                    c.id_concesion,
                    c.nombre,
                    c.codigo_centro,
                    c.titular,
                    r.interseccion_valida,
                    ST_AsGeoJSON(c.geom) as geom_json
                FROM resultado_analisis r
                JOIN concesiones c ON r.id_concesion = c.id_concesion
                WHERE r.id_analisis = :id_analisis
            """)
            concesiones_result = db.execute(concesiones_query, {"id_analisis": id_analisis}).fetchall()
            
            return {
                'id_denuncia': analisis_result.id_denuncia,  # 🆕 Agregar ID de denuncia
                'buffer_geom': json.loads(analisis_result.buffer_geom_json) if analisis_result.buffer_geom_json else None,
                'evidencias': [
                    {
                        'id_evidencia': ev.id_evidencia,
                        'lon': float(ev.lon),
                        'lat': float(ev.lat),
                        'descripcion': ev.descripcion or f"Evidencia #{ev.id_evidencia}"
                    }
                    for ev in evidencias_result
                ],
                'concesiones': [
                    {
                        'id_concesion': c.id_concesion,
                        'nombre': c.nombre,
                        'codigo_centro': c.codigo_centro,
                        'titular': c.titular,
                        'interseccion_valida': c.interseccion_valida,
                        'geom': json.loads(c.geom_json) if c.geom_json else None
                    }
                    for c in concesiones_result
                ]
            }
            
        except Exception as e:
            logger.error(f"Error obteniendo datos del análisis {id_analisis}: {e}")
            return None
    
    def _agregar_buffer(self, context: 'staticmaps.Context', buffer_geom: Dict[str, Any]):
        """
        Agrega el buffer como polígono azul semi-transparente.
        """
        try:
            if buffer_geom['type'] == 'MultiPolygon':
                for polygon_coords in buffer_geom['coordinates']:
                    self._agregar_poligono_simple(context, polygon_coords, 
                                                color=staticmaps.BLUE, 
                                                fill_color=staticmaps.parse_color("#0000FF40"))
            elif buffer_geom['type'] == 'Polygon':
                self._agregar_poligono_simple(context, buffer_geom['coordinates'], 
                                            color=staticmaps.BLUE, 
                                            fill_color=staticmaps.parse_color("#0000FF40"))
        except Exception as e:
            logger.error(f"Error agregando buffer al mapa: {e}")
    
    def _agregar_concesiones(self, context: 'staticmaps.Context', concesiones: List[Dict[str, Any]]):
        """
        Agrega concesiones como polígonos rojos (válidas) o naranjas (no válidas).
        """
        for concesion in concesiones:
            try:
                geom = concesion.get('geom')
                if not geom:
                    continue
                    
                # Color según validez de intersección
                if concesion['interseccion_valida']:
                    color = staticmaps.RED
                    fill_color = staticmaps.parse_color("#FF000060")
                else:
                    color = staticmaps.parse_color("#FFA500")  # Orange
                    fill_color = staticmaps.parse_color("#FFA50060")
                
                if geom['type'] == 'MultiPolygon':
                    for polygon_coords in geom['coordinates']:
                        self._agregar_poligono_simple(context, polygon_coords, color, fill_color)
                elif geom['type'] == 'Polygon':
                    self._agregar_poligono_simple(context, geom['coordinates'], color, fill_color)
                    
                # Agregar marcador personalizado con código de centro
                centroide = self._calcular_centroide(geom)
                if centroide and concesion.get('codigo_centro'):
                    codigo_centro = str(concesion['codigo_centro'])
                    
                    # Crear marcador personalizado con el código de centro
                    marker_path = self._crear_marcador_codigo_centro(
                        codigo_centro, 
                        concesion['interseccion_valida']
                    )
                    
                    if marker_path:
                        # Usar ImageMarker con la imagen personalizada
                        marker = staticmaps.ImageMarker(
                            staticmaps.create_latlng(centroide[1], centroide[0]),
                            marker_path,
                            origin_x=35,  # Centro horizontal de la imagen (70px / 2)
                            origin_y=14   # Centro vertical de la imagen (28px / 2)
                        )
                        context.add_object(marker)
                        logger.debug(f"Marcador personalizado agregado para concesión {codigo_centro}")
                    else:
                        # Fallback: usar marcador básico si falla la creación del personalizado
                        marker_color = staticmaps.RED if concesion['interseccion_valida'] else staticmaps.parse_color("#FFA500")
                        marker = staticmaps.Marker(
                            staticmaps.create_latlng(centroide[1], centroide[0]),
                            color=marker_color,
                            size=8
                        )
                        context.add_object(marker)
                        logger.warning(f"Usando marcador básico para concesión {codigo_centro} (fallback)")
                    
            except Exception as e:
                logger.error(f"Error agregando concesión {concesion.get('id_concesion', 'unknown')}: {e}")
    
    def _agregar_evidencias(self, context: 'staticmaps.Context', evidencias: List[Dict[str, Any]]):
        """
        Agrega evidencias GPS como marcadores azules numerados.
        """
        for evidencia in evidencias:
            try:
                marker = staticmaps.Marker(
                    staticmaps.create_latlng(evidencia['lat'], evidencia['lon']),
                    color=staticmaps.BLUE,
                    size=12
                )
                context.add_object(marker)
            except Exception as e:
                logger.error(f"Error agregando evidencia {evidencia.get('id_evidencia', 'unknown')}: {e}")
    
    def _agregar_poligono_simple(self, context: 'staticmaps.Context', coordinates: List, 
                                color: str, fill_color: str):
        """
        Agrega un polígono simple al contexto del mapa.
        """
        try:
            # Tomar el anillo exterior (primer elemento)
            exterior_ring = coordinates[0]
            
            # Convertir coordenadas
            latlngs = [
                staticmaps.create_latlng(coord[1], coord[0])  # [lon, lat] -> lat, lon
                for coord in exterior_ring
            ]
            
            # Crear área
            area = staticmaps.Area(
                latlngs,
                fill_color=fill_color,
                color=color,
                width=2
            )
            context.add_object(area)
            
        except Exception as e:
            logger.error(f"Error agregando polígono: {e}")
    
    def _calcular_centroide(self, geom: Dict[str, Any]) -> Optional[List[float]]:
        """
        Calcula el centroide aproximado de una geometría.
        """
        try:
            coordinates = []
            
            if geom['type'] == 'Polygon':
                coordinates = geom['coordinates'][0]  # Anillo exterior
            elif geom['type'] == 'MultiPolygon':
                coordinates = geom['coordinates'][0][0]  # Primer polígono, anillo exterior
            
            if not coordinates:
                return None
                
            # Centroide simple (promedio de coordenadas)
            lon_sum = sum(coord[0] for coord in coordinates)
            lat_sum = sum(coord[1] for coord in coordinates)
            count = len(coordinates)
            
            return [lon_sum / count, lat_sum / count]
            
        except Exception as e:
            logger.error(f"Error calculando centroide: {e}")
            return None 
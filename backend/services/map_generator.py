import os
import logging
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
        logger.info(f"MapGenerator inicializado. FOTOS_DIR: {self.fotos_dir}")
        logger.info(f"STATICMAPS_AVAILABLE: {STATICMAPS_AVAILABLE}")
        if STATICMAPS_AVAILABLE:
            logger.info("✅ py-staticmaps está disponible")
        else:
            logger.error("❌ py-staticmaps NO está disponible")
        
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
            
            # py-staticmaps calcula automáticamente el mejor zoom y centro
            # para ajustarse a todos los elementos agregados
            image = context.render_pillow(self.map_width, self.map_height)
            image.save(str(mapa_path))
            
            # Verificar que se guardó correctamente
            if mapa_path.exists():
                size_mb = mapa_path.stat().st_size / (1024 * 1024)
                logger.info(f"✅ Mapa generado exitosamente: {mapa_path} ({size_mb:.2f} MB)")
                return str(mapa_path)
            else:
                logger.error(f"❌ Error: El archivo no se guardó correctamente")
                return None
            
        except Exception as e:
            logger.error(f"Error generando mapa para análisis {id_analisis}: {e}")
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
                    
                # Agregar marcador con código de centro
                centroide = self._calcular_centroide(geom)
                if centroide:
                    # Marcador invisible para el texto (simulamos tooltip)
                    marker = staticmaps.Marker(
                        staticmaps.create_latlng(centroide[1], centroide[0]),
                        color=staticmaps.WHITE,
                        size=1
                    )
                    context.add_object(marker)
                    
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
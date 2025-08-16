from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from db import SessionLocal
from models.denuncias import Denuncia
from models.evidencias import Evidencia
from models.concesiones import Concesion
from models.analisis import AnalisisDenuncia, ResultadoAnalisis
from security.auth import verificar_token
from typing import List, Optional
import json
import logging
import time
from logging_utils import log_event

router = APIRouter()
logger = logging.getLogger(__name__)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/denuncias", dependencies=[Depends(verificar_token)])
def obtener_denuncias_mapa(
    bounds: Optional[str] = Query(None, description="Bounds del mapa: lat1,lng1,lat2,lng2"),
    zoom: Optional[int] = Query(None, description="Nivel de zoom actual"),
    db: Session = Depends(get_db)
):
    """
    Obtiene denuncias para visualización en mapa con clustering automático
    """
    start = time.perf_counter()
    
    try:
        # Si no hay bounds, retornar todas las denuncias
        if not bounds:
            # Consulta básica sin filtros espaciales - simplificada
            query = text("""
                SELECT 
                    d.id_denuncia,
                    d.lugar,
                    d.fecha_inspeccion,
                    d.fecha_ingreso,
                    d.observaciones,
                    ST_AsGeoJSON(e.coordenadas) as geometry,
                    1 as total_evidencias
                FROM denuncias d
                LEFT JOIN evidencias e ON d.id_denuncia = e.id_denuncia
                WHERE e.coordenadas IS NOT NULL
                LIMIT 100
            """)
            logger.info(f"Ejecutando consulta sin bounds: {query}")
            result = db.execute(query).fetchall()
            logger.info(f"Resultados obtenidos: {len(result)} filas")
        else:
            # Parsear bounds - formato: west,south,east,north
            try:
                lng1, lat1, lng2, lat2 = map(float, bounds.split(','))
            except ValueError:
                raise HTTPException(status_code=400, detail="Formato de bounds inválido")
            
            # Consulta simplificada sin clustering por ahora
            query = text("""
                SELECT 
                    d.id_denuncia,
                    d.lugar,
                    d.fecha_inspeccion,
                    d.fecha_ingreso,
                    d.observaciones,
                    ST_AsGeoJSON(e.coordenadas) as geometry,
                    1 as total_evidencias
                FROM denuncias d
                LEFT JOIN evidencias e ON d.id_denuncia = e.id_denuncia
                WHERE ST_Intersects(e.coordenadas, ST_MakeEnvelope(:lng1, :lat1, :lng2, :lat2, 4326))
                AND e.coordenadas IS NOT NULL
                LIMIT 100
            """)
            
            logger.info(f"Ejecutando consulta con bounds: {bounds}, lat1={lat1}, lng1={lng1}, lat2={lat2}, lng2={lng2}")
            result = db.execute(query, {
                "lng1": lng1, "lat1": lat1, 
                "lng2": lng2, "lat2": lat2
            }).fetchall()
            logger.info(f"Resultados obtenidos: {len(result)} filas")
        
        # Convertir a GeoJSON
        features = []
        logger.info(f"Procesando {len(result)} filas de resultados")
        for i, row in enumerate(result):
            try:
                geometry = json.loads(row.geometry) if row.geometry else None
                if geometry:
                    feature = {
                        "type": "Feature",
                        "geometry": geometry,
                        "properties": {
                            "id_denuncia": getattr(row, 'id_denuncia', None),
                            "lugar": getattr(row, 'lugar', 'Sin ubicación'),
                            "fecha_inspeccion": getattr(row, 'fecha_inspeccion', None),
                            "fecha_ingreso": getattr(row, 'fecha_ingreso', None),
                            "observaciones": getattr(row, 'observaciones', ''),
                            "total_evidencias": getattr(row, 'total_evidencias', 0),
                            "count": getattr(row, 'count', 1),
                            "fecha_inicio": getattr(row, 'fecha_inicio', None),
                            "fecha_fin": getattr(row, 'fecha_fin', None),
                            "lugares": getattr(row, 'lugares', ''),
                            "title": f"Denuncia #{getattr(row, 'id_denuncia', 'N/A')}",
                            "description": getattr(row, 'lugar', 'Sin ubicación')
                        }
                    }
                    features.append(feature)
                    if i < 3:  # Log solo los primeros 3 para debug
                        logger.info(f"Feature {i+1}: {feature['properties']['title']} en {geometry['coordinates']}")
            except Exception as e:
                logger.warning(f"Error procesando denuncia {i}: {e}")
                continue
        
        geojson = {
            "type": "FeatureCollection",
            "features": features
        }
        
        duration_ms = int((time.perf_counter() - start) * 1000)
        log_event(logger, "INFO", "map_denuncias_loaded", 
                  features_count=len(features), duration_ms=duration_ms)
        
        return geojson
        
    except Exception as e:
        logger.error(f"Error cargando denuncias para mapa: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/evidencias", dependencies=[Depends(verificar_token)])
def obtener_evidencias_mapa(
    bounds: Optional[str] = Query(None, description="Bounds del mapa: lat1,lng1,lat2,lng2"),
    id_denuncia: Optional[int] = Query(None, description="ID de denuncia específica"),
    db: Session = Depends(get_db)
):
    """
    Obtiene evidencias para visualización en mapa
    """
    start = time.perf_counter()
    
    try:
        if id_denuncia:
            # Evidencias de una denuncia específica
            query = text("""
                SELECT 
                    e.id_evidencia,
                    e.id_denuncia,
                    e.descripcion,
                    e.fecha,
                    e.hora,
                    e.foto_url,
                    ST_AsGeoJSON(e.coordenadas) as geometry
                FROM evidencias e
                WHERE e.id_denuncia = :id_denuncia
                ORDER BY e.fecha, e.hora
            """)
            result = db.execute(query, {"id_denuncia": id_denuncia}).fetchall()
        elif bounds:
            # Evidencias dentro de bounds - formato: west,south,east,north
            try:
                lng1, lat1, lng2, lat2 = map(float, bounds.split(','))
            except ValueError:
                raise HTTPException(status_code=400, detail="Formato de bounds inválido")
            
            query = text("""
                SELECT 
                    e.id_evidencia,
                    e.id_denuncia,
                    e.descripcion,
                    e.fecha,
                    e.hora,
                    e.foto_url,
                    ST_AsGeoJSON(e.coordenadas) as geometry
                FROM evidencias e
                WHERE ST_Intersects(e.coordenadas, ST_MakeEnvelope(:lng1, :lat1, :lng2, :lat2, 4326))
                ORDER BY e.fecha, e.hora
            """)
            result = db.execute(query, {
                "lng1": lng1, "lat1": lat1, 
                "lng2": lng2, "lat2": lat2
            }).fetchall()
        else:
            # Todas las evidencias (limitado para performance)
            query = text("""
                SELECT 
                    e.id_evidencia,
                    e.id_denuncia,
                    e.descripcion,
                    e.fecha,
                    e.hora,
                    e.foto_url,
                    ST_AsGeoJSON(e.coordenadas) as geometry
                FROM evidencias e
                ORDER BY e.fecha DESC, e.hora DESC
                LIMIT 1000
            """)
            result = db.execute(query).fetchall()
        
        # Convertir a GeoJSON
        features = []
        for row in result:
            try:
                geometry = json.loads(row.geometry) if row.geometry else None
                if geometry:
                    feature = {
                        "type": "Feature",
                        "geometry": geometry,
                        "properties": {
                            "id_evidencia": row.id_evidencia,
                            "id_denuncia": row.id_denuncia,
                            "descripcion": row.descripcion or '',
                            "fecha": row.fecha.isoformat() if row.fecha else None,
                            "hora": row.hora.isoformat() if row.hora else None,
                            "foto_url": row.foto_url,
                            "title": f"Evidencia #{row.id_evidencia}",
                            "description": row.descripcion or 'Sin descripción'
                        }
                    }
                    features.append(feature)
            except Exception as e:
                logger.warning(f"Error procesando evidencia: {e}")
                continue
        
        geojson = {
            "type": "FeatureCollection",
            "features": features
        }
        
        duration_ms = int((time.perf_counter() - start) * 1000)
        log_event(logger, "INFO", "map_evidencias_loaded", 
                  features_count=len(features), duration_ms=duration_ms)
        
        return geojson
        
    except Exception as e:
        logger.error(f"Error cargando evidencias para mapa: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/concesiones", dependencies=[Depends(verificar_token)])
def obtener_concesiones_mapa(
    bounds: Optional[str] = Query(None, description="Bounds del mapa: lat1,lng1,lat2,lng2"),
    region: Optional[str] = Query(None, description="Filtrar por región"),
    db: Session = Depends(get_db)
):
    """
    Obtiene concesiones para visualización en mapa
    """
    start = time.perf_counter()
    
    try:
        if bounds:
            try:
                lng1, lat1, lng2, lat2 = map(float, bounds.split(','))
            except ValueError:
                raise HTTPException(status_code=400, detail="Formato de bounds inválido")
            
            if region:
                query = text("""
                    SELECT 
                        c.id_concesion,
                        c.codigo_centro,
                        c.titular,
                        c.tipo,
                        c.nombre,
                        c.region,
                        ST_AsGeoJSON(c.geom) as geometry
                    FROM concesiones c
                    WHERE ST_Intersects(c.geom, ST_MakeEnvelope(:lng1, :lat1, :lng2, :lat2, 4326))
                    AND c.region = :region
                """)
                result = db.execute(query, {
                    "lng1": lng1, "lat1": lat1, 
                    "lng2": lng2, "lat2": lat2,
                    "region": region
                }).fetchall()
            else:
                query = text("""
                    SELECT 
                        c.id_concesion,
                        c.codigo_centro,
                        c.titular,
                        c.tipo,
                        c.nombre,
                        c.region,
                        ST_AsGeoJSON(c.geom) as geometry
                    FROM concesiones c
                    WHERE ST_Intersects(c.geom, ST_MakeEnvelope(:lng1, :lat1, :lng2, :lat2, 4326))
                """)
                result = db.execute(query, {
                    "lng1": lng1, "lat1": lat1, 
                    "lng2": lng2, "lat2": lat2
                }).fetchall()
        else:
            # Todas las concesiones
            if region:
                query = text("""
                    SELECT 
                        c.id_concesion,
                        c.codigo_centro,
                        c.titular,
                        c.tipo,
                        c.nombre,
                        c.region,
                        ST_AsGeoJSON(c.geom) as geometry
                    FROM concesiones c
                    WHERE c.region = :region
                """)
                result = db.execute(query, {"region": region}).fetchall()
            else:
                query = text("""
                    SELECT 
                        c.id_concesion,
                        c.codigo_centro,
                        c.titular,
                        c.tipo,
                        c.nombre,
                        c.region,
                        ST_AsGeoJSON(c.geom) as geometry
                    FROM concesiones c
                """)
                result = db.execute(query).fetchall()
        
        # Convertir a GeoJSON
        features = []
        for row in result:
            try:
                geometry = json.loads(row.geometry) if row.geometry else None
                if geometry:
                    feature = {
                        "type": "Feature",
                        "geometry": geometry,
                        "properties": {
                            "id_concesion": row.id_concesion,
                            "codigo_centro": row.codigo_centro,
                            "titular": row.titular,
                            "tipo": row.tipo,
                            "nombre": row.nombre,
                            "region": row.region,
                            "title": f"Concesión {row.codigo_centro}",
                            "description": f"{row.nombre} - {row.titular}"
                        }
                    }
                    features.append(feature)
            except Exception as e:
                logger.warning(f"Error procesando concesión: {e}")
                continue
        
        geojson = {
            "type": "FeatureCollection",
            "features": features
        }
        
        duration_ms = int((time.perf_counter() - start) * 1000)
        log_event(logger, "INFO", "map_concesiones_loaded", 
                  features_count=len(features), duration_ms=duration_ms)
        
        return geojson
        
    except Exception as e:
        logger.error(f"Error cargando concesiones para mapa: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/analisis", dependencies=[Depends(verificar_token)])
def obtener_analisis_mapa(
    bounds: Optional[str] = Query(None, description="Bounds del mapa: lat1,lng1,lat2,lng2"),
    db: Session = Depends(get_db)
):
    """
    Obtiene análisis geoespaciales para visualización en mapa
    """
    start = time.perf_counter()
    
    try:
        if bounds:
            try:
                lng1, lat1, lng2, lat2 = map(float, bounds.split(','))
            except ValueError:
                raise HTTPException(status_code=400, detail="Formato de bounds inválido")
            
            query = text("""
                SELECT 
                    a.id_analisis,
                    a.id_denuncia,
                    a.fecha_analisis,
                    a.distancia_buffer,
                    a.metodo,
                    a.observaciones,
                    ST_AsGeoJSON(a.buffer_geom) as geometry,
                    COUNT(ra.id_resultado) as total_concesiones
                FROM analisis_denuncia a
                LEFT JOIN resultado_analisis ra ON a.id_analisis = ra.id_analisis
                WHERE ST_Intersects(a.buffer_geom, ST_MakeEnvelope(:lng1, :lat1, :lng2, :lat2, 4326))
                GROUP BY a.id_analisis, a.id_denuncia, a.fecha_analisis, a.distancia_buffer, a.metodo, a.observaciones, a.buffer_geom
            """)
            result = db.execute(query, {
                "lng1": lng1, "lat1": lat1, 
                "lng2": lng2, "lat2": lat2
            }).fetchall()
        else:
            # Todos los análisis
            query = text("""
                SELECT 
                    a.id_analisis,
                    a.id_denuncia,
                    a.fecha_analisis,
                    a.distancia_buffer,
                    a.metodo,
                    a.observaciones,
                    ST_AsGeoJSON(a.buffer_geom) as geometry,
                    COUNT(ra.id_resultado) as total_concesiones
                FROM analisis_denuncia a
                LEFT JOIN resultado_analisis ra ON a.id_analisis = ra.id_analisis
                GROUP BY a.id_analisis, a.id_denuncia, a.fecha_analisis, a.distancia_buffer, a.metodo, a.observaciones, a.buffer_geom
            """)
            result = db.execute(query).fetchall()
        
        # Convertir a GeoJSON
        features = []
        for row in result:
            try:
                geometry = json.loads(row.geometry) if row.geometry else None
                if geometry:
                    feature = {
                        "type": "Feature",
                        "geometry": geometry,
                        "properties": {
                            "id_analisis": row.id_analisis,
                            "id_denuncia": row.id_denuncia,
                            "fecha_analisis": row.fecha_analisis.isoformat() if row.fecha_analisis else None,
                            "distancia_buffer": float(row.distancia_buffer) if row.distancia_buffer else 0,
                            "metodo": row.metodo,
                            "observaciones": row.observaciones,
                            "total_concesiones": row.total_concesiones,
                            "title": f"Análisis #{row.id_analisis}",
                            "description": f"Buffer: {row.distancia_buffer}m - {row.total_concesiones} concesiones"
                        }
                    }
                    features.append(feature)
            except Exception as e:
                logger.warning(f"Error procesando análisis: {e}")
                continue
        
        geojson = {
            "type": "FeatureCollection",
            "features": features
        }
        
        duration_ms = int((time.perf_counter() - start) * 1000)
        log_event(logger, "INFO", "map_analisis_loaded", 
                  features_count=len(features), duration_ms=duration_ms)
        
        return geojson
        
    except Exception as e:
        logger.error(f"Error cargando análisis para mapa: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/estadisticas", dependencies=[Depends(verificar_token)])
def obtener_estadisticas_mapa(
    bounds: Optional[str] = Query(None, description="Bounds del mapa: lat1,lng1,lat2,lng2"),
    db: Session = Depends(get_db)
):
    """
    Obtiene estadísticas para el área visible en el mapa
    """
    start = time.perf_counter()
    
    try:
        if bounds:
            try:
                lng1, lat1, lng2, lat2 = map(float, bounds.split(','))
            except ValueError:
                raise HTTPException(status_code=400, detail="Formato de bounds inválido")
            
            # Estadísticas dentro del área
            stats_query = text("""
                SELECT 
                    COUNT(DISTINCT d.id_denuncia) as total_denuncias,
                    COUNT(DISTINCT e.id_evidencia) as total_evidencias,
                    COUNT(DISTINCT c.id_concesion) as total_concesiones,
                    COUNT(DISTINCT a.id_analisis) as total_analisis,
                    MIN(d.fecha_ingreso) as fecha_primera_denuncia,
                    MAX(d.fecha_ingreso) as fecha_ultima_denuncia
                FROM denuncias d
                LEFT JOIN evidencias e ON d.id_denuncia = e.id_denuncia
                LEFT JOIN concesiones c ON ST_Intersects(c.geom, ST_MakeEnvelope(:lng1, :lat1, :lng2, :lat2, 4326))
                LEFT JOIN analisis_denuncia a ON d.id_denuncia = a.id_denuncia
                WHERE ST_Intersects(e.coordenadas, ST_MakeEnvelope(:lng1, :lat1, :lng2, :lat2, 4326))
            """)
            
            result = db.execute(stats_query, {
                "lng1": lng1, "lat1": lat1, 
                "lng2": lng2, "lat2": lat2
            }).fetchone()
        else:
            # Estadísticas globales
            stats_query = text("""
                SELECT 
                    COUNT(DISTINCT d.id_denuncia) as total_denuncias,
                    COUNT(DISTINCT e.id_evidencia) as total_evidencias,
                    COUNT(DISTINCT c.id_concesion) as total_concesiones,
                    COUNT(DISTINCT a.id_analisis) as total_analisis,
                    MIN(d.fecha_ingreso) as fecha_primera_denuncia,
                    MAX(d.fecha_ingreso) as fecha_ultima_denuncia
                FROM denuncias d
                LEFT JOIN evidencias e ON d.id_denuncia = e.id_denuncia
                LEFT JOIN concesiones c ON 1=1
                LEFT JOIN analisis_denuncia a ON d.id_denuncia = a.id_denuncia
            """)
            
            result = db.execute(stats_query).fetchone()
        
        stats = {
            "total_denuncias": result.total_denuncias or 0,
            "total_evidencias": result.total_evidencias or 0,
            "total_concesiones": result.total_concesiones or 0,
            "total_analisis": result.total_analisis or 0,
            "fecha_primera_denuncia": result.fecha_primera_denuncia.isoformat() if result.fecha_primera_denuncia else None,
            "fecha_ultima_denuncia": result.fecha_ultima_denuncia.isoformat() if result.fecha_ultima_denuncia else None
        }
        
        duration_ms = int((time.perf_counter() - start) * 1000)
        log_event(logger, "INFO", "map_stats_loaded", 
                  stats=stats, duration_ms=duration_ms)
        
        return stats
        
    except Exception as e:
        logger.error(f"Error cargando estadísticas para mapa: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

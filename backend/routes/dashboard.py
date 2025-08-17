from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from db import SessionLocal
from routes.auth import get_current_user
from models.usuarios import Usuario
from typing import Dict, Any
from pydantic import BaseModel
from datetime import datetime, timedelta
import json

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class DashboardStatsResponse(BaseModel):
    total_denuncias: int
    denuncias_este_mes: int
    denuncias_pendientes: int
    denuncias_completadas: int
    ultimo_analisis: Dict[str, Any] | None
    actividad_mensual: list

@router.get("/stats", response_model=DashboardStatsResponse)
def obtener_estadisticas_dashboard(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene estadísticas generales para el dashboard
    """
    try:
        # Estadísticas básicas
        stats_query = text("""
            SELECT 
                COUNT(*) as total_denuncias,
                COUNT(CASE WHEN fecha_ingreso >= date_trunc('month', CURRENT_DATE) THEN 1 END) as denuncias_este_mes,
                COUNT(CASE WHEN id_estado = 1 THEN 1 END) as denuncias_pendientes,
                COUNT(CASE WHEN id_estado = 3 THEN 1 END) as denuncias_completadas
            FROM denuncias
            WHERE id_usuario = :user_id
        """)
        
        stats_result = db.execute(stats_query, {"user_id": current_user.id_usuario}).fetchone()
        
        # Último análisis con coordenadas
        ultimo_analisis_query = text("""
            SELECT 
                ad.id_analisis,
                ad.fecha_analisis,
                d.lugar,
                ST_AsGeoJSON(ST_Centroid(ad.buffer_geom)) as coordenadas,
                ST_AsGeoJSON(ad.buffer_geom) as buffer_geom,
                ad.distancia_buffer,
                ad.metodo,
                COUNT(ra.id_concesion) as concesiones_afectadas
            FROM analisis_denuncia ad
            INNER JOIN denuncias d ON ad.id_denuncia = d.id_denuncia
            LEFT JOIN resultado_analisis ra ON ad.id_analisis = ra.id_analisis
            WHERE d.id_usuario = :user_id
            GROUP BY ad.id_analisis, ad.fecha_analisis, d.lugar, ad.buffer_geom, ad.distancia_buffer, ad.metodo
            ORDER BY ad.fecha_analisis DESC
            LIMIT 1
        """)
        
        ultimo_analisis_result = db.execute(ultimo_analisis_query, {"user_id": current_user.id_usuario}).fetchone()
        
        # Actividad mensual (últimos 8 meses)
        actividad_query = text("""
            SELECT 
                to_char(date_trunc('month', fecha_ingreso), 'Mon') as mes,
                COUNT(*) as total
            FROM denuncias
            WHERE id_usuario = :user_id
            AND fecha_ingreso >= date_trunc('month', CURRENT_DATE - INTERVAL '7 months')
            GROUP BY date_trunc('month', fecha_ingreso)
            ORDER BY date_trunc('month', fecha_ingreso)
        """)
        
        actividad_result = db.execute(actividad_query, {"user_id": current_user.id_usuario}).fetchall()
        
        # Procesar último análisis
        ultimo_analisis = None
        if ultimo_analisis_result:
            coords_json = json.loads(ultimo_analisis_result.coordenadas)
            coordenadas = coords_json['coordinates']
            buffer_geom_json = json.loads(ultimo_analisis_result.buffer_geom)
            ultimo_analisis = {
                "id_analisis": ultimo_analisis_result.id_analisis,
                "fecha_analisis": ultimo_analisis_result.fecha_analisis.isoformat(),
                "lugar": ultimo_analisis_result.lugar,
                "coordenadas": coordenadas,
                "buffer_geom": buffer_geom_json,
                "distancia_buffer": ultimo_analisis_result.distancia_buffer,
                "metodo": ultimo_analisis_result.metodo,
                "concesiones_afectadas": ultimo_analisis_result.concesiones_afectadas
            }
        
        # Procesar actividad mensual
        actividad_mensual = []
        for row in actividad_result:
            actividad_mensual.append({
                "mes": row.mes,
                "total": row.total
            })
        
        return DashboardStatsResponse(
            total_denuncias=stats_result.total_denuncias,
            denuncias_este_mes=stats_result.denuncias_este_mes,
            denuncias_pendientes=stats_result.denuncias_pendientes,
            denuncias_completadas=stats_result.denuncias_completadas,
            ultimo_analisis=ultimo_analisis,
            actividad_mensual=actividad_mensual
        )
        
    except Exception as e:
        print(f"Error obteniendo estadísticas del dashboard: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/ultimo-analisis/concesiones")
def obtener_concesiones_ultimo_analisis(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene las concesiones afectadas del último análisis del usuario
    """
    try:
        # Primero obtener el último análisis
        ultimo_analisis_query = text("""
            SELECT ad.id_analisis
            FROM analisis_denuncia ad
            INNER JOIN denuncias d ON ad.id_denuncia = d.id_denuncia
            WHERE d.id_usuario = :user_id
            ORDER BY ad.fecha_analisis DESC
            LIMIT 1
        """)
        
        ultimo_analisis_result = db.execute(ultimo_analisis_query, {"user_id": current_user.id_usuario}).fetchone()
        
        if not ultimo_analisis_result:
            return {"concesiones": [], "evidencias": []}
        
        id_analisis = ultimo_analisis_result.id_analisis
        
        # Obtener concesiones afectadas
        concesiones_query = text("""
            SELECT 
                c.id_concesion,
                c.codigo_centro,
                c.titular,
                c.tipo,
                c.nombre,
                c.region,
                ST_AsGeoJSON(c.geom) as geom,
                ra.interseccion_valida,
                ra.distancia_minima
            FROM resultado_analisis ra
            INNER JOIN concesiones c ON ra.id_concesion = c.id_concesion
            WHERE ra.id_analisis = :id_analisis
            ORDER BY c.titular, c.nombre
        """)
        
        concesiones_result = db.execute(concesiones_query, {"id_analisis": id_analisis}).fetchall()
        
        # Obtener evidencias del análisis
        evidencias_query = text("""
            SELECT 
                e.id_evidencia,
                e.fecha,
                e.hora,
                e.descripcion,
                e.foto_url,
                ST_AsGeoJSON(e.coordenadas) as coordenadas
            FROM evidencias e
            INNER JOIN analisis_denuncia ad ON e.id_denuncia = ad.id_denuncia
            WHERE ad.id_analisis = :id_analisis
            ORDER BY e.fecha, e.hora
        """)
        
        evidencias_result = db.execute(evidencias_query, {"id_analisis": id_analisis}).fetchall()
        
        # Procesar concesiones
        concesiones = []
        for row in concesiones_result:
            geom_json = json.loads(row.geom)
            concesiones.append({
                "id_concesion": row.id_concesion,
                "codigo_centro": row.codigo_centro,
                "titular": row.titular,
                "tipo": row.tipo,
                "nombre": row.nombre,
                "region": row.region,
                "geom": geom_json,
                "interseccion_valida": row.interseccion_valida,
                "distancia_minima": float(row.distancia_minima) if row.distancia_minima else None
            })
        
        # Procesar evidencias
        evidencias = []
        for row in evidencias_result:
            coords_json = json.loads(row.coordenadas)
            evidencias.append({
                "id_evidencia": row.id_evidencia,
                "fecha": row.fecha.isoformat(),
                "hora": str(row.hora),
                "descripcion": row.descripcion,
                "foto_url": row.foto_url,
                "coordenadas": coords_json
            })
        
        return {
            "concesiones": concesiones,
            "evidencias": evidencias
        }
        
    except Exception as e:
        print(f"Error obteniendo concesiones del último análisis: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

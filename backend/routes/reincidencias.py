from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from db import SessionLocal
from routes.auth import get_current_user
from models.usuarios import Usuario
from typing import List
from pydantic import BaseModel

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ReincidenciaResponse(BaseModel):
    titular: str
    centros_count: int
    denuncias_count: int
    centros_denunciados: str
    ultima_denuncia: str | None
    region: str | None
    tipo_principal: str | None

@router.get("/", response_model=List[ReincidenciaResponse])
def obtener_reincidencias(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene análisis completo de reincidencias por empresa
    """
    try:
        # Consulta simplificada para obtener reincidencias
        query = text("""
            SELECT 
                c.titular,
                COUNT(DISTINCT c.id_concesion) as centros_count,
                COUNT(DISTINCT d.id_denuncia) as denuncias_count,
                STRING_AGG(DISTINCT c.codigo_centro::text, ', ') as centros_denunciados,
                MAX(d.fecha_ingreso) as ultima_denuncia,
                COALESCE(c.region, 'No especificada') as region,
                COALESCE(c.tipo, 'No especificado') as tipo_principal
            FROM concesiones c
            INNER JOIN resultado_analisis ra ON c.id_concesion = ra.id_concesion
            INNER JOIN analisis_denuncia ad ON ra.id_analisis = ad.id_analisis
            INNER JOIN denuncias d ON ad.id_denuncia = d.id_denuncia
            GROUP BY c.titular, c.region, c.tipo
            HAVING COUNT(DISTINCT d.id_denuncia) > 0
            ORDER BY denuncias_count DESC, centros_count DESC, titular
        """)
        
        result = db.execute(query).fetchall()
        
        reincidencias = []
        for row in result:
            reincidencias.append(ReincidenciaResponse(
                titular=row.titular,
                centros_count=row.centros_count,
                denuncias_count=row.denuncias_count,
                centros_denunciados=row.centros_denunciados,
                ultima_denuncia=row.ultima_denuncia.isoformat() if row.ultima_denuncia else None,
                region=row.region,
                tipo_principal=row.tipo_principal
            ))
        
        return reincidencias
        
    except Exception as e:
        print(f"Error obteniendo reincidencias: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/estadisticas")
def obtener_estadisticas_reincidencias(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene estadísticas generales de reincidencias
    """
    try:
        # Estadísticas generales
        stats_query = text("""
            SELECT 
                COUNT(DISTINCT c.titular) as total_empresas,
                COUNT(DISTINCT c.id_concesion) as total_centros,
                COUNT(DISTINCT d.id_denuncia) as total_denuncias,
                ROUND(AVG(denuncias_por_empresa), 1) as promedio_denuncias
            FROM (
                SELECT 
                    c.titular,
                    COUNT(DISTINCT d.id_denuncia) as denuncias_por_empresa
                FROM concesiones c
                LEFT JOIN resultado_analisis ra ON c.id_concesion = ra.id_concesion
                LEFT JOIN analisis_denuncia ad ON ra.id_analisis = ad.id_analisis
                LEFT JOIN denuncias d ON ad.id_denuncia = d.id_denuncia
                WHERE d.id_denuncia IS NOT NULL
                GROUP BY c.titular
                HAVING COUNT(DISTINCT d.id_denuncia) > 0
            ) empresas_con_denuncias
            CROSS JOIN concesiones c
            CROSS JOIN denuncias d
            WHERE d.id_denuncia IS NOT NULL
        """)
        
        stats_result = db.execute(stats_query).fetchone()
        
        # Distribución por nivel de riesgo
        riesgo_query = text("""
            SELECT 
                CASE 
                    WHEN denuncias_count >= 5 OR (denuncias_count::float / NULLIF(centros_count, 0)) >= 2 THEN 'alto'
                    WHEN denuncias_count >= 3 OR (denuncias_count::float / NULLIF(centros_count, 0)) >= 1 THEN 'medio'
                    ELSE 'bajo'
                END as nivel_riesgo,
                COUNT(*) as cantidad
            FROM (
                SELECT 
                    c.titular,
                    COUNT(DISTINCT c.id_concesion) as centros_count,
                    COUNT(DISTINCT d.id_denuncia) as denuncias_count
                FROM concesiones c
                LEFT JOIN resultado_analisis ra ON c.id_concesion = ra.id_concesion
                LEFT JOIN analisis_denuncia ad ON ra.id_analisis = ad.id_analisis
                LEFT JOIN denuncias d ON ad.id_denuncia = d.id_denuncia
                WHERE d.id_denuncia IS NOT NULL
                GROUP BY c.titular
                HAVING COUNT(DISTINCT d.id_denuncia) > 0
            ) empresas_riesgo
            GROUP BY nivel_riesgo
        """)
        
        riesgo_result = db.execute(riesgo_query).fetchall()
        
        riesgo_stats = {
            'alto': 0,
            'medio': 0,
            'bajo': 0
        }
        
        for row in riesgo_result:
            riesgo_stats[row.nivel_riesgo] = row.cantidad
        
        return {
            "total_empresas": stats_result.total_empresas,
            "total_centros": stats_result.total_centros,
            "total_denuncias": stats_result.total_denuncias,
            "promedio_denuncias_por_empresa": stats_result.promedio_denuncias,
            "distribucion_riesgo": riesgo_stats
        }
        
    except Exception as e:
        print(f"Error obteniendo estadísticas: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/centros-cultivo")
def obtener_centros_cultivo_reincidentes(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene centros de cultivo con información de reincidencias y coordenadas
    """
    try:
        import json
        
        query = text("""
            SELECT 
                c.id_concesion,
                c.nombre,
                c.titular,
                c.tipo,
                c.region,
                ST_AsGeoJSON(ST_Centroid(c.geom)) as coordenadas,
                COUNT(DISTINCT d.id_denuncia) as denuncias_count
            FROM concesiones c
            LEFT JOIN resultado_analisis ra ON c.id_concesion = ra.id_concesion
            LEFT JOIN analisis_denuncia ad ON ra.id_analisis = ad.id_analisis
            LEFT JOIN denuncias d ON ad.id_denuncia = d.id_denuncia
            WHERE d.id_denuncia IS NOT NULL
            GROUP BY c.id_concesion, c.nombre, c.titular, c.tipo, c.region, c.geom
            ORDER BY denuncias_count DESC, c.titular, c.nombre
        """)
        
        result = db.execute(query).fetchall()
        
        centros = []
        for row in result:
            # Calcular nivel de riesgo
            denuncias_count = row.denuncias_count
            riesgo_level = 'bajo'
            if denuncias_count >= 5:
                riesgo_level = 'alto'
            elif denuncias_count >= 3:
                riesgo_level = 'medio'
            
            # Parsear coordenadas
            coords_json = json.loads(row.coordenadas)
            coordenadas = coords_json['coordinates']
            
            centros.append({
                "id_concesion": row.id_concesion,
                "nombre": row.nombre,
                "titular": row.titular,
                "tipo": row.tipo,
                "region": row.region,
                "coordenadas": coordenadas,
                "denuncias_count": denuncias_count,
                "riesgo_level": riesgo_level
            })
        
        return {"centros": centros}
        
    except Exception as e:
        print(f"Error obteniendo centros de cultivo: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

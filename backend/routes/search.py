from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from typing import List, Optional
from db import SessionLocal
from routes.auth import get_current_user
from models.usuarios import Usuario

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

router = APIRouter()

@router.get("/search")
async def search(
    q: str = Query(..., description="Término de búsqueda"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Buscar en concesiones y denuncias, incluyendo análisis de reincidencias
    """
    if not q or len(q.strip()) < 2:
        raise HTTPException(status_code=400, detail="El término de búsqueda debe tener al menos 2 caracteres")
    
    search_term = f"%{q.strip()}%"
    
    try:
        # 1. Buscar concesiones
        concesiones_query = text("""
            SELECT 
                c.id_concesion,
                c.codigo_centro,
                c.titular,
                c.nombre,
                c.tipo,
                c.region,
                ST_AsGeoJSON(c.geom) as geometry,
                COUNT(DISTINCT d.id_denuncia) as denuncias_count,
                COUNT(DISTINCT ra.id_resultado) as analisis_count
            FROM concesiones c
            LEFT JOIN resultado_analisis ra ON c.id_concesion = ra.id_concesion
            LEFT JOIN analisis_denuncia ad ON ra.id_analisis = ad.id_analisis
            LEFT JOIN denuncias d ON ad.id_denuncia = d.id_denuncia
            WHERE 
                c.codigo_centro::text ILIKE :search_term OR
                c.titular ILIKE :search_term OR
                c.nombre ILIKE :search_term
            GROUP BY c.id_concesion, c.codigo_centro, c.titular, c.nombre, c.tipo, c.region, c.geom
            ORDER BY denuncias_count DESC, c.titular, c.nombre
        """)
        
        concesiones_result = db.execute(concesiones_query, {"search_term": search_term})
        concesiones = []
        
        for row in concesiones_result:
            concesion = {
                "id_concesion": row.id_concesion,
                "codigo_centro": row.codigo_centro,
                "titular": row.titular,
                "nombre": row.nombre,
                "tipo": row.tipo,
                "region": row.region,
                "geometry": row.geometry,
                "denuncias_count": row.denuncias_count,
                "analisis_count": row.analisis_count,
                "type": "concesion"
            }
            concesiones.append(concesion)
        
        # 2. Buscar denuncias
        denuncias_query = text("""
            SELECT 
                d.id_denuncia,
                d.lugar,
                d.fecha_inspeccion,
                d.observaciones,
                ed.estado,
                COUNT(DISTINCT e.id_evidencia) as evidencias_count,
                COUNT(DISTINCT ra.id_resultado) as concesiones_afectadas_count
            FROM denuncias d
            LEFT JOIN estados_denuncia ed ON d.id_estado = ed.id_estado
            LEFT JOIN evidencias e ON d.id_denuncia = e.id_evidencia
            LEFT JOIN analisis_denuncia ad ON d.id_denuncia = ad.id_analisis
            LEFT JOIN resultado_analisis ra ON ad.id_analisis = ra.id_analisis
            WHERE d.lugar ILIKE :search_term
            GROUP BY d.id_denuncia, d.lugar, d.fecha_inspeccion, d.observaciones, ed.estado
            ORDER BY d.fecha_inspeccion DESC
        """)
        
        denuncias_result = db.execute(denuncias_query, {"search_term": search_term})
        denuncias = []
        
        for row in denuncias_result:
            denuncia = {
                "id_denuncia": row.id_denuncia,
                "lugar": row.lugar,
                "fecha_inspeccion": row.fecha_inspeccion.isoformat() if row.fecha_inspeccion else None,
                "observaciones": row.observaciones,
                "estado": row.estado,
                "evidencias_count": row.evidencias_count,
                "concesiones_afectadas_count": row.concesiones_afectadas_count,
                "type": "denuncia"
            }
            denuncias.append(denuncia)
        
        # 3. Análisis de reincidencias por titular
        reincidencias_titular_query = text("""
            SELECT 
                c.titular,
                COUNT(DISTINCT c.id_concesion) as centros_count,
                COUNT(DISTINCT d.id_denuncia) as denuncias_count,
                STRING_AGG(DISTINCT c.nombre, ', ') as centros_denunciados
            FROM concesiones c
            LEFT JOIN resultado_analisis ra ON c.id_concesion = ra.id_concesion
            LEFT JOIN analisis_denuncia ad ON ra.id_analisis = ad.id_analisis
            LEFT JOIN denuncias d ON ad.id_denuncia = d.id_denuncia
            WHERE 
                c.codigo_centro::text ILIKE :search_term OR
                c.titular ILIKE :search_term OR
                c.nombre ILIKE :search_term
            GROUP BY c.titular
            HAVING COUNT(DISTINCT d.id_denuncia) > 0
            ORDER BY denuncias_count DESC, centros_count DESC
        """)
        
        reincidencias_result = db.execute(reincidencias_titular_query, {"search_term": search_term})
        reincidencias = []
        
        for row in reincidencias_result:
            reincidencia = {
                "titular": row.titular,
                "centros_count": row.centros_count,
                "denuncias_count": row.denuncias_count,
                "centros_denunciados": row.centros_denunciados,
                "type": "reincidencia"
            }
            reincidencias.append(reincidencia)
        
        return {
            "query": q,
            "concesiones": concesiones,
            "denuncias": denuncias,
            "reincidencias": reincidencias,
            "total_concesiones": len(concesiones),
            "total_denuncias": len(denuncias),
            "total_reincidencias": len(reincidencias)
        }
        
    except Exception as e:
        print(f"Error en búsqueda: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor durante la búsqueda")



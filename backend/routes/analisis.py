from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import SessionLocal
from models.analisis import AnalisisDenuncia, ResultadoAnalisis
from models.denuncias import Denuncia
from models.evidencias import Evidencia
from models.concesiones import Concesion
from schemas.analisis import AnalisisCreate, AnalisisResponse, ResultadoAnalisisResponse
from security.auth import verificar_token
from sqlalchemy import text
from datetime import datetime
from typing import List

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=AnalisisResponse, dependencies=[Depends(verificar_token)])
def ejecutar_analisis(data: AnalisisCreate, db: Session = Depends(get_db)):
    denuncia = db.query(Denuncia).filter(Denuncia.id_denuncia == data.id_denuncia).first()
    if not denuncia:
        raise HTTPException(status_code=404, detail="Denuncia no encontrada")

    # Crear registro del análisis
    nuevo_analisis = AnalisisDenuncia(
        id_denuncia=data.id_denuncia,
        fecha_analisis=datetime.utcnow(),
        distancia_buffer=data.distancia_buffer,
        metodo=data.metodo,
        observaciones=data.observaciones
    )
    db.add(nuevo_analisis)
    db.commit()
    db.refresh(nuevo_analisis)

    # Generar el buffer de todas las evidencias de esta denuncia
    buffer_sql = text(f"""
        WITH puntos AS (
            SELECT ST_Transform(coordenadas, 3857) AS geom
            FROM evidencias
            WHERE id_denuncia = :id_denuncia
        ),
        union_puntos AS (
            SELECT ST_Union(geom) AS geom FROM puntos
        ),
        buffer AS (
            SELECT ST_Transform(ST_Buffer(geom, :radio), 4326) AS geom FROM union_puntos
        )
        SELECT
            c.id_concesion,
            ST_Intersects(c.geom, b.geom) AS interseccion_valida,
            ST_Distance(ST_Centroid(c.geom), b.geom) AS distancia_minima
        FROM concesiones c, buffer b;
    """)

    resultados_sql = db.execute(buffer_sql, {
        "id_denuncia": data.id_denuncia,
        "radio": data.distancia_buffer
    }).fetchall()

    resultados = []
    for row in resultados_sql:
        resultado = ResultadoAnalisis(
            id_analisis=nuevo_analisis.id_analisis,
            id_concesion=row.id_concesion,
            interseccion_valida=row.interseccion_valida,
            distancia_minima=row.distancia_minima
        )
        db.add(resultado)
        resultados.append(ResultadoAnalisisResponse(
            id_concesion=row.id_concesion,
            interseccion_valida=row.interseccion_valida,
            distancia_minima=row.distancia_minima
        ))

    db.commit()

    return AnalisisResponse(
        id_analisis=nuevo_analisis.id_analisis,
        id_denuncia=nuevo_analisis.id_denuncia,
        fecha_analisis=nuevo_analisis.fecha_analisis,
        distancia_buffer=nuevo_analisis.distancia_buffer,
        metodo=nuevo_analisis.metodo,
        observaciones=nuevo_analisis.observaciones,
        resultados=resultados
    )

@router.get("/", response_model=List[AnalisisResponse], dependencies=[Depends(verificar_token)])
def listar_analisis(db: Session = Depends(get_db)):
    # Obtener todos los análisis
    analisis = db.query(AnalisisDenuncia).all()
    respuesta = []

    for a in analisis:
        resultados = db.query(ResultadoAnalisis).filter(ResultadoAnalisis.id_analisis == a.id_analisis).all()
        r_list = [
            ResultadoAnalisisResponse(
                id_concesion=r.id_concesion,
                interseccion_valida=r.interseccion_valida,
                distancia_minima=r.distancia_minima
            ) for r in resultados
        ]

        respuesta.append(AnalisisResponse(
            id_analisis=a.id_analisis,
            id_denuncia=a.id_denuncia,
            fecha_analisis=a.fecha_analisis,
            distancia_buffer=a.distancia_buffer,
            metodo=a.metodo,
            observaciones=a.observaciones,
            resultados=r_list
        ))

    return respuesta

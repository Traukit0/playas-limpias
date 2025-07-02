from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from db import SessionLocal
from models.analisis import AnalisisDenuncia, ResultadoAnalisis
from models.denuncias import Denuncia
from schemas.analisis import AnalisisCreate, AnalisisResponse, ResultadoAnalisisResponse
from security.auth import verificar_token
from services.geoprocessing.buffer import generar_buffer_union
from services.geoprocessing.interseccion import intersectar_concesiones
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

    # Crear registro de análisis
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

    # Generar buffer y obtener intersecciones
    buffer_geom = generar_buffer_union(db, data.id_denuncia, data.distancia_buffer)
    nuevo_analisis.buffer_geom = buffer_geom
    intersecciones = intersectar_concesiones(db, buffer_geom)

    resultados = []
    for row in intersecciones:
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
    # Obtener el WKT del buffer_geom desde la BD
    buffer_text = db.execute(
        text("SELECT ST_AsText(buffer_geom) FROM analisis_denuncia WHERE id_analisis = :id"),
        {"id": nuevo_analisis.id_analisis}
    ).scalar()

    return AnalisisResponse(
        id_analisis=nuevo_analisis.id_analisis,
        id_denuncia=nuevo_analisis.id_denuncia,
        fecha_analisis=nuevo_analisis.fecha_analisis,
        distancia_buffer=nuevo_analisis.distancia_buffer,
        metodo=nuevo_analisis.metodo,
        observaciones=nuevo_analisis.observaciones,
        resultados=resultados,
        buffer_wkt=buffer_text
    )

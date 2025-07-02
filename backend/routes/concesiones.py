from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from db import SessionLocal
from models.concesiones import Concesion
from schemas.concesiones import ConcesionResponseGeoJSON
from security.auth import verificar_token
from typing import List
import json

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[ConcesionResponseGeoJSON], dependencies=[Depends(verificar_token)])
def listar_concesiones(db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT
            id_concesion,
            titular,
            tipo,
            nombre,
            region,
            ST_AsGeoJSON(geom) AS geojson
        FROM concesiones
    """)).fetchall()

    resultado = []
    for row in rows:
        resultado.append(ConcesionResponseGeoJSON(
            id_concesion=row.id_concesion,
            titular=row.titular,
            tipo=row.tipo,
            nombre=row.nombre,
            region=row.region,
            geom=json.loads(row.geojson)
        ))
    return resultado

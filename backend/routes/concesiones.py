from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db import SessionLocal
from models.concesiones import Concesion
from schemas.concesiones import ConcesionResponse
from security.auth import verificar_token
from typing import List
from sqlalchemy import text

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[ConcesionResponse], dependencies=[Depends(verificar_token)])
def listar_concesiones(db: Session = Depends(get_db)):
    # Se usa raw SQL para extraer geom como WKT
    rows = db.execute(text("""
        SELECT
            id_concesion,
            titular,
            tipo,
            nombre,
            region,
            ST_AsText(geom) AS wkt
        FROM concesiones
    """)).fetchall()

    resultado = []
    for row in rows:
        resultado.append(ConcesionResponse(
            id_concesion=row.id_concesion,
            titular=row.titular,
            tipo=row.tipo,
            nombre=row.nombre,
            region=row.region,
            wkt=row.wkt
        ))
    return resultado

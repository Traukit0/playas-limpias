from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from db import SessionLocal
from models.evidencias import Evidencia
from models.denuncias import Denuncia
from schemas.evidencias import EvidenciaCreateGeoJSON, EvidenciaResponseGeoJSON
from geoalchemy2.shape import from_shape
from shapely.geometry import shape
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

@router.post("/", response_model=EvidenciaResponseGeoJSON, dependencies=[Depends(verificar_token)])
def crear_evidencia(evidencia: EvidenciaCreateGeoJSON, db: Session = Depends(get_db)):
    denuncia = db.query(Denuncia).filter(Denuncia.id_denuncia == evidencia.id_denuncia).first()
    if not denuncia:
        raise HTTPException(status_code=404, detail="Denuncia no encontrada")

    punto = from_shape(shape(evidencia.coordenadas), srid=4326)

    nueva = Evidencia(
        id_denuncia=evidencia.id_denuncia,
        coordenadas=punto,
        descripcion=evidencia.descripcion,
        foto_url=evidencia.foto_url
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)

    coords_json = db.execute(
        text("SELECT ST_AsGeoJSON(coordenadas) FROM evidencias WHERE id_evidencia = :id"),
        {"id": nueva.id_evidencia}
    ).scalar()

    return EvidenciaResponseGeoJSON(
        id_evidencia=nueva.id_evidencia,
        id_denuncia=nueva.id_denuncia,
        coordenadas=json.loads(coords_json),
        descripcion=nueva.descripcion,
        foto_url=nueva.foto_url
    )

@router.get("/", response_model=List[EvidenciaResponseGeoJSON], dependencies=[Depends(verificar_token)])
def listar_evidencias(db: Session = Depends(get_db)):
    evidencias = db.query(Evidencia).all()
    resultado = []
    for e in evidencias:
        coords_json = db.execute(
            text("SELECT ST_AsGeoJSON(coordenadas) FROM evidencias WHERE id_evidencia = :id"),
            {"id": e.id_evidencia}
        ).scalar()
        resultado.append(EvidenciaResponseGeoJSON(
            id_evidencia=e.id_evidencia,
            id_denuncia=e.id_denuncia,
            coordenadas=json.loads(coords_json),
            descripcion=e.descripcion,
            foto_url=e.foto_url
        ))
    return resultado

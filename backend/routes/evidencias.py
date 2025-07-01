from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import SessionLocal
from models.evidencias import Evidencia
from models.denuncias import Denuncia
from schemas.evidencias import EvidenciaCreate, EvidenciaResponse
from geoalchemy2.shape import from_shape
from shapely.geometry import Point
from security.auth import verificar_token
from typing import List

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=EvidenciaResponse, dependencies=[Depends(verificar_token)])
def crear_evidencia(evidencia: EvidenciaCreate, db: Session = Depends(get_db)):
    denuncia = db.query(Denuncia).filter(Denuncia.id_denuncia == evidencia.id_denuncia).first()
    if not denuncia:
        raise HTTPException(status_code=404, detail="Denuncia no encontrada")

    punto = from_shape(Point(evidencia.lon, evidencia.lat), srid=4326)

    nueva = Evidencia(
        id_denuncia=evidencia.id_denuncia,
        coordenadas=punto,
        descripcion=evidencia.descripcion,
        foto_url=evidencia.foto_url
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return EvidenciaResponse(
        id_evidencia=nueva.id_evidencia,
        id_denuncia=nueva.id_denuncia,
        lat=evidencia.lat,
        lon=evidencia.lon,
        descripcion=nueva.descripcion,
        foto_url=nueva.foto_url
    )

@router.get("/", response_model=List[EvidenciaResponse], dependencies=[Depends(verificar_token)])
def listar_evidencias(db: Session = Depends(get_db)):
    evidencias = db.query(Evidencia).all()
    resultado = []
    for e in evidencias:
        coords = db.execute(e.coordenadas.ST_AsText()).scalar()
        if coords:
            # WKT: POINT(lon lat)
            _, lonlat = coords.split("(")
            lon, lat = map(float, lonlat.strip(")").split())
            resultado.append(EvidenciaResponse(
                id_evidencia=e.id_evidencia,
                id_denuncia=e.id_denuncia,
                lon=lon,
                lat=lat,
                descripcion=e.descripcion,
                foto_url=e.foto_url
            ))
    return resultado

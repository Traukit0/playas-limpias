from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import text
from db import SessionLocal
from models.evidencias import Evidencia
from models.denuncias import Denuncia
from schemas.evidencias import EvidenciaCreateGeoJSON, EvidenciaResponseGeoJSON, SubidaFotosResponse, ListaFotosResponse, FotoInfo
from geoalchemy2.shape import from_shape
from shapely.geometry import shape
from security.auth import verificar_token
from services.foto_service import FotoService
from typing import List
import json
from services.geoprocessing.gpx.gpx_parser import procesar_gpx_waypoints

router = APIRouter()
foto_service = FotoService()

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
        fecha=evidencia.fecha,
        hora=evidencia.hora,
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
        fecha=nueva.fecha,
        hora=nueva.hora,
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
            fecha=e.fecha,
            hora=e.hora,
            descripcion=e.descripcion,
            foto_url=e.foto_url
        ))
    return resultado

@router.post("/upload_gpx", dependencies=[Depends(verificar_token)])
def subir_archivo_gpx(id_denuncia: int, archivo_gpx: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Sube un archivo GPX (waypoints) y los almacena como evidencias georreferenciadas.
    Cada waypoint incluye fecha y hora extraídas del timestamp del archivo GPX.
    """
    # Validar que la denuncia existe
    denuncia = db.query(Denuncia).filter(Denuncia.id_denuncia == id_denuncia).first()
    if not denuncia:
        raise HTTPException(status_code=404, detail="Denuncia no encontrada")
    
    # Validar extensión del archivo
    if not archivo_gpx.filename.endswith(".gpx"):
        raise HTTPException(status_code=400, detail="El archivo debe tener extensión .gpx")

    resultado = procesar_gpx_waypoints(archivo_gpx, id_denuncia, db)
    return resultado

@router.post("/upload_fotos/{id_denuncia}", response_model=SubidaFotosResponse, dependencies=[Depends(verificar_token)])
def subir_fotos_denuncia(
    id_denuncia: int, 
    archivos: List[UploadFile] = File(...), 
    db: Session = Depends(get_db)
):
    """
    Sube múltiples fotos para una denuncia y las asocia automáticamente a evidencias GPS por timestamp EXIF.
    
    Requisitos:
    - La denuncia debe existir
    - Debe haber evidencias GPS (archivo GPX ya procesado)
    - Las fotos deben tener formato JPG o PNG
    - Las fotos se comprimirán automáticamente a 1920x1080
    - Se asociarán por timestamp EXIF a la evidencia GPS más cercana en tiempo
    """
    resultado = foto_service.subir_fotos_denuncia(db, id_denuncia, archivos)
    return SubidaFotosResponse(**resultado)

@router.get("/fotos/{id_denuncia}", response_model=ListaFotosResponse, dependencies=[Depends(verificar_token)])
def listar_fotos_denuncia(id_denuncia: int, db: Session = Depends(get_db)):
    """
    Lista todas las fotos asociadas a una denuncia específica.
    
    Retorna:
    - Información de cada foto (ruta, descripción, coordenadas GPS)
    - Total de fotos encontradas
    """
    # Verificar que la denuncia existe
    denuncia = db.query(Denuncia).filter(Denuncia.id_denuncia == id_denuncia).first()
    if not denuncia:
        raise HTTPException(status_code=404, detail="Denuncia no encontrada")
    
    fotos = foto_service.listar_fotos_denuncia(db, id_denuncia)
    
    return ListaFotosResponse(
        fotos=[FotoInfo(**foto) for foto in fotos],
        total=len(fotos)
    )
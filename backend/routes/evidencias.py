from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
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
import logging
import time
from logging_utils import log_event
import json as pyjson
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
        coordenadas=pyjson.loads(coords_json),
        fecha=nueva.fecha,
        hora=nueva.hora,
        descripcion=nueva.descripcion,
        foto_url=nueva.foto_url
    )

@router.get("/", response_model=List[EvidenciaResponseGeoJSON], dependencies=[Depends(verificar_token)])
def listar_evidencias(id_denuncia: int = Query(None), db: Session = Depends(get_db)):
    if id_denuncia is not None:
        evidencias = db.query(Evidencia).filter(Evidencia.id_denuncia == id_denuncia).all()
    else:
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
            coordenadas=pyjson.loads(coords_json),
            fecha=e.fecha,
            hora=e.hora,
            descripcion=e.descripcion,
            foto_url=e.foto_url
        ))
    return resultado

@router.post("/upload_gpx", dependencies=[Depends(verificar_token)])
def subir_archivo_gpx(
    id_denuncia: int = Form(...),  # Ahora se recibe como campo de formulario
    utc_offset: int = Form(...),
    archivo_gpx: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Sube un archivo GPX (waypoints) y los almacena como evidencias georreferenciadas.
    Cada waypoint incluye fecha y hora extraídas del timestamp del archivo GPX.
    El parámetro utc_offset indica la diferencia horaria a aplicar a los timestamps (por ejemplo, -3 o -4).
    """
    # Validar que la denuncia existe
    denuncia = db.query(Denuncia).filter(Denuncia.id_denuncia == id_denuncia).first()
    if not denuncia:
        raise HTTPException(status_code=404, detail="Denuncia no encontrada")
    
    # Validar extensión del archivo
    if not archivo_gpx.filename.endswith(".gpx"):
        raise HTTPException(status_code=400, detail="El archivo debe tener extensión .gpx")

    start = time.perf_counter()
    resultado = procesar_gpx_waypoints(archivo_gpx, id_denuncia, db, utc_offset)
    # Extraer cantidad de waypoints desde el mensaje de detalle si está disponible
    waypoints_count = None
    try:
        detalle = resultado.get("detalle") if isinstance(resultado, dict) else None
        if isinstance(detalle, str) and "waypoints" in detalle:
            # p.ej. "12 waypoints procesados..."
            import re
            m = re.search(r"(\d+)\s+waypoints", detalle)
            if m:
                waypoints_count = int(m.group(1))
    except Exception:
        waypoints_count = None
    log_event(logging.getLogger("wizard"), "INFO", "wizard_step2_gpx_uploaded",
              denuncia_id=id_denuncia, filename=archivo_gpx.filename, utc_offset=utc_offset,
              waypoints_count=waypoints_count, duration_ms=int((time.perf_counter()-start)*1000))
    return resultado

@router.post("/upload_fotos/{id_denuncia}", response_model=SubidaFotosResponse, dependencies=[Depends(verificar_token)])
def subir_fotos_denuncia(
    id_denuncia: int, 
    archivos: List[UploadFile] = File(...), 
    descripciones: List[str] = Form(...),
    db: Session = Depends(get_db)
):
    """
    Sube múltiples fotos para una denuncia y las asocia automáticamente a evidencias GPS por timestamp EXIF.
    Cada foto debe tener una descripción individual (campo 'descripciones').
    
    Ejemplo en Swagger:
    - NOTA: NO ES FUNCIONAL EN SWAGGER, SE DEBE EJECUTAR DESDE POSTMAN!!! ACÁ NO FUNCIONARÁ POR LA VESIÓN DE SWAGGER!!
    - archivos: [foto1.jpg, foto2.jpg]
    - descripciones: ["Descripción 1", "Descripción 2"]
    
    Requisitos:
    - La denuncia debe existir
    - Debe haber evidencias GPS (archivo GPX ya procesado)
    - Las fotos deben tener formato JPG o PNG
    - Las fotos se comprimirán automáticamente a 1920x1080
    - Se asociarán por timestamp EXIF a la evidencia GPS más cercana en tiempo
    - Cada foto debe tener una descripción
    """
    # Validación robusta para evitar problemas futuros con el frontend
    # Si descripciones llega como un solo string (por error del cliente), intentar decodificar como JSON o dividir solo por saltos de línea
    if len(descripciones) == 1 and len(archivos) > 1:
        desc = descripciones[0]
        # Intentar JSON
        try:
            posibles = pyjson.loads(desc)
            if isinstance(posibles, list) and len(posibles) == len(archivos):
                descripciones = posibles
            else:
                raise ValueError
        except Exception:
            # Intentar dividir solo por saltos de línea (lo que Swagger/FastAPI suelen hacer)
            posibles = [d for d in desc.split('\n') if d.strip()]
            if len(posibles) == len(archivos):
                descripciones = posibles
            else:
                raise HTTPException(status_code=400, detail="El campo 'descripciones' debe ser un array real o un string separado por saltos de línea (uno por foto). No se aceptan separadores por comas. Si usas Swagger, agrega cada comentario como un campo individual o separa por salto de línea.")
    if len(archivos) != len(descripciones):
        raise HTTPException(status_code=400, detail="Debe enviar una descripción por cada foto (campos 'descripciones' y 'archivos' deben tener la misma cantidad de elementos).")
    start = time.perf_counter()
    resultado = foto_service.subir_fotos_denuncia(db, id_denuncia, archivos, descripciones)
    try:
        processed = int(resultado.get("fotos_procesadas", 0))
        associated = int(resultado.get("fotos_asociadas", 0))
        errors = len(resultado.get("errores", [])) if isinstance(resultado.get("errores"), list) else 0
    except Exception:
        processed = associated = errors = 0
    log_event(logging.getLogger("wizard"), "INFO", "wizard_step3_photos_uploaded",
              denuncia_id=id_denuncia, files_count=len(archivos), processed=processed,
              associated=associated, errors_count=errors,
              duration_ms=int((time.perf_counter()-start)*1000))
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
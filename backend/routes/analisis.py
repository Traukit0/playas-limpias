from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from db import SessionLocal
from models.analisis import AnalisisDenuncia, ResultadoAnalisis
from models.denuncias import Denuncia
from models.concesiones import Concesion
from models.evidencias import Evidencia
from models.usuarios import Usuario
from models.estados import EstadoDenuncia
from schemas.analisis import AnalisisCreate, AnalisisResponseGeoJSON, ResultadoAnalisisResponse, AnalisisPreviewRequest, AnalisisPreviewResponse, ResultadoAnalisisResponse
from security.auth import verificar_token
from services.geoprocessing.buffer import generar_buffer_union
from services.geoprocessing.interseccion import intersectar_concesiones
from datetime import datetime
from typing import List
import json
import tempfile
import os
import logging

# Configurar logger
logger = logging.getLogger(__name__)

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=AnalisisResponseGeoJSON, dependencies=[Depends(verificar_token)])
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

    buffer_geojson = db.execute(
        text("SELECT ST_AsGeoJSON(buffer_geom) FROM analisis_denuncia WHERE id_analisis = :id"),
        {"id": nuevo_analisis.id_analisis}
    ).scalar()

    return AnalisisResponseGeoJSON(
        id_analisis=nuevo_analisis.id_analisis,
        id_denuncia=nuevo_analisis.id_denuncia,
        fecha_analisis=nuevo_analisis.fecha_analisis,
        distancia_buffer=nuevo_analisis.distancia_buffer,
        metodo=nuevo_analisis.metodo,
        observaciones=nuevo_analisis.observaciones,
        resultados=resultados,
        buffer_geom=json.loads(buffer_geojson)
    )

@router.post("/preview", response_model=AnalisisPreviewResponse, dependencies=[Depends(verificar_token)])
def previsualizar_analisis(data: AnalisisPreviewRequest, db: Session = Depends(get_db)):
    """
    Devuelve una previsualización del buffer y las concesiones intersectadas sin guardar en la base de datos.
    """
    denuncia = db.query(Denuncia).filter(Denuncia.id_denuncia == data.id_denuncia).first()
    if not denuncia:
        raise HTTPException(status_code=404, detail="Denuncia no encontrada")

    buffer_geom = generar_buffer_union(db, data.id_denuncia, data.distancia_buffer)
    intersecciones = intersectar_concesiones(db, buffer_geom)

    buffer_geojson = db.execute(
        text("SELECT ST_AsGeoJSON(:geom)"),
        {"geom": buffer_geom}
    ).scalar()

    resultados = [
        ResultadoAnalisisResponse(
            id_concesion=r.id_concesion,
            interseccion_valida=r.interseccion_valida,
            distancia_minima=r.distancia_minima
        )
        for r in intersecciones
    ]

    return AnalisisPreviewResponse(
        buffer_geom=json.loads(buffer_geojson),
        resultados=resultados
    )

@router.get("/{id_analisis}/pdf", dependencies=[Depends(verificar_token)])
async def generar_pdf_analisis(
    id_analisis: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Genera y descarga PDF completo del análisis
    """
    try:
        # 1. Verificar que el análisis existe
        analisis = db.query(AnalisisDenuncia).filter(
            AnalisisDenuncia.id_analisis == id_analisis
        ).first()
        
        if not analisis:
            raise HTTPException(status_code=404, detail="Análisis no encontrado")
        
        # 2. Obtener datos relacionados
        denuncia = db.query(Denuncia).filter(
            Denuncia.id_denuncia == analisis.id_denuncia
        ).first()
        
        # Obtener evidencias con coordenadas convertidas
        evidencias_raw = db.query(Evidencia).filter(
            Evidencia.id_denuncia == analisis.id_denuncia
        ).all()
        
        # Convertir coordenadas a formato legible
        evidencias = []
        for ev in evidencias_raw:
            try:
                # Convertir coordenadas usando ST_AsGeoJSON
                coords_result = db.execute(
                    text("SELECT ST_AsGeoJSON(:geom)"),
                    {"geom": ev.coordenadas}
                ).scalar()
                
                # Crear objeto procesado
                ev_dict = {
                    'id_evidencia': ev.id_evidencia,
                    'id_denuncia': ev.id_denuncia,
                    'coordenadas_json': coords_result,
                    'descripcion': ev.descripcion,
                    'foto_url': ev.foto_url,
                    'fecha': ev.fecha,
                    'hora': ev.hora
                }
                evidencias.append(type('Evidencia', (), ev_dict))
            except Exception as e:
                logger.warning(f"Error procesando evidencia {ev.id_evidencia}: {e}")
                # Agregar evidencia sin coordenadas en caso de error
                ev_dict = {
                    'id_evidencia': ev.id_evidencia,
                    'id_denuncia': ev.id_denuncia,
                    'coordenadas_json': None,
                    'descripcion': ev.descripcion,
                    'foto_url': ev.foto_url,
                    'fecha': ev.fecha,
                    'hora': ev.hora
                }
                evidencias.append(type('Evidencia', (), ev_dict))
        
        resultados = db.query(ResultadoAnalisis).filter(
            ResultadoAnalisis.id_analisis == id_analisis
        ).all()
        
        concesiones_ids = [r.id_concesion for r in resultados]
        concesiones = []
        if concesiones_ids:
            concesiones = db.query(Concesion).filter(
                Concesion.id_concesion.in_(concesiones_ids)
            ).all()
        
        usuario = None
        if denuncia and denuncia.id_usuario:
            usuario = db.query(Usuario).filter(
                Usuario.id_usuario == denuncia.id_usuario
            ).first()
        
        estado = None
        if denuncia and denuncia.id_estado:
            estado = db.query(EstadoDenuncia).filter(
                EstadoDenuncia.id_estado == denuncia.id_estado
            ).first()
        
        # 3. Generar PDF (por ahora, crear PDF básico de prueba)
        from services.pdf_generator import PDFGenerator
        
        pdf_generator = PDFGenerator()
        pdf_bytes = await pdf_generator.generate_analysis_pdf(
            analisis=analisis,
            denuncia=denuncia,
            evidencias=evidencias,
            resultados=resultados,
            concesiones=concesiones,
            usuario=usuario,
            estado=estado
        )
        
        # 4. Crear archivo temporal
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            temp_file.write(pdf_bytes)
            temp_path = temp_file.name
        
        # 5. Función de limpieza
        def cleanup():
            try:
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
            except Exception as e:
                logger.warning(f"Error eliminando archivo temporal: {e}")
        
        # 6. Programar limpieza
        background_tasks.add_task(cleanup)
        
        # 7. Retornar archivo para descarga
        sector_name = denuncia.lugar if denuncia else "sector"
        filename = f"inspeccion_{sector_name.replace(' ', '_')}_{id_analisis}.pdf"
        
        return FileResponse(
            path=temp_path,
            media_type="application/pdf",
            filename=filename
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generando PDF para análisis {id_analisis}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generando PDF: {str(e)}")

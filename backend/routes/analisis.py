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
from services.map_generator import MapGenerator
from services.kmz_generator import KMZGenerator
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
    
    # Generar mapa estático del análisis
    try:
        map_generator = MapGenerator()
        mapa_path = map_generator.generar_mapa_analisis(nuevo_analisis.id_analisis, db)
        if mapa_path:
            logger.info(f"Mapa generado exitosamente para análisis {nuevo_analisis.id_analisis}: {mapa_path}")
        else:
            logger.warning(f"No se pudo generar mapa para análisis {nuevo_analisis.id_analisis}")
    except Exception as e:
        logger.error(f"Error generando mapa para análisis {nuevo_analisis.id_analisis}: {e}")

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
        
        # Convertir coordenadas usando consulta SQL correcta para WKBElement
        evidencias = []
        for ev in evidencias_raw:
            try:
                # Convertir WKBElement a coordenadas legibles usando ST_X y ST_Y
                coords_query = db.execute(
                    text("SELECT ST_X(coordenadas) as lon, ST_Y(coordenadas) as lat FROM evidencias WHERE id_evidencia = :id"),
                    {"id": ev.id_evidencia}
                ).fetchone()
                
                if coords_query:
                    # Crear diccionario GeoJSON manualmente
                    coordenadas_dict = {
                        "type": "Point",
                        "coordinates": [float(coords_query.lon), float(coords_query.lat)]
                    }
                else:
                    coordenadas_dict = None
                
                # Crear objeto procesado compatible con el nuevo PDFGenerator
                ev_dict = {
                    'id_evidencia': ev.id_evidencia,
                    'id_denuncia': ev.id_denuncia,
                    'coordenadas': coordenadas_dict,
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
                    'coordenadas': None,
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

@router.get("/{id_analisis}/kmz", dependencies=[Depends(verificar_token)])
async def generar_kmz_analisis(
    id_analisis: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Genera y descarga archivo KMZ para Google Earth
    """
    try:
        # 1. Verificar que el análisis existe
        analisis = db.query(AnalisisDenuncia).filter(
            AnalisisDenuncia.id_analisis == id_analisis
        ).first()
        
        if not analisis:
            raise HTTPException(status_code=404, detail="Análisis no encontrado")
        
        # 2. Obtener evidencias con coordenadas convertidas
        evidencias_raw = db.query(Evidencia).filter(
            Evidencia.id_denuncia == analisis.id_denuncia
        ).all()
        
        # Convertir coordenadas usando consulta SQL correcta para WKBElement
        evidencias = []
        for ev in evidencias_raw:
            try:
                # Convertir WKBElement a coordenadas legibles usando ST_X y ST_Y
                coords_query = db.execute(
                    text("SELECT ST_X(coordenadas) as lon, ST_Y(coordenadas) as lat FROM evidencias WHERE id_evidencia = :id"),
                    {"id": ev.id_evidencia}
                ).fetchone()
                
                if coords_query:
                    # Crear diccionario GeoJSON manualmente
                    coordenadas_dict = {
                        "type": "Point",
                        "coordinates": [float(coords_query.lon), float(coords_query.lat)]
                    }
                else:
                    coordenadas_dict = None
                
                # Crear objeto procesado compatible con KMZGenerator
                ev_dict = {
                    'id_evidencia': ev.id_evidencia,
                    'id_denuncia': ev.id_denuncia,
                    'coordenadas': coordenadas_dict,
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
                    'coordenadas': None,
                    'descripcion': ev.descripcion,
                    'foto_url': ev.foto_url,
                    'fecha': ev.fecha,
                    'hora': ev.hora
                }
                evidencias.append(type('Evidencia', (), ev_dict))
        
        # 3. Obtener concesiones intersectadas con geometrías
        resultados = db.query(ResultadoAnalisis).filter(
            ResultadoAnalisis.id_analisis == id_analisis
        ).all()
        
        concesiones_ids = [r.id_concesion for r in resultados]
        concesiones = []
        if concesiones_ids:
            # Obtener concesiones con geometrías GeoJSON
            concesiones_query = text("""
                SELECT 
                    c.id_concesion,
                    c.nombre,
                    c.codigo_centro,
                    c.titular,
                    c.tipo,
                    c.region,
                    ST_AsGeoJSON(c.geom) as geom_json
                FROM concesiones c
                WHERE c.id_concesion = ANY(:concesiones_ids)
            """)
            
            concesiones_result = db.execute(concesiones_query, {"concesiones_ids": concesiones_ids}).fetchall()
            
            for row in concesiones_result:
                try:
                    # Parsear geometría GeoJSON
                    geom_dict = json.loads(row.geom_json) if row.geom_json else None
                    
                    # Log para debugging
                    if geom_dict:
                        logger.info(f"Concesión {row.id_concesion}: geometría tipo {geom_dict.get('type', 'unknown')}")
                    else:
                        logger.warning(f"Concesión {row.id_concesion}: sin geometría")
                    
                    # Crear objeto concesión con geometría procesada
                    concesion_dict = {
                        'id_concesion': row.id_concesion,
                        'nombre': row.nombre,
                        'codigo_centro': row.codigo_centro,
                        'titular': row.titular,
                        'tipo': row.tipo,
                        'region': row.region,
                        'geom': geom_dict
                    }
                    concesiones.append(type('Concesion', (), concesion_dict))
                except Exception as e:
                    logger.warning(f"Error procesando concesión {row.id_concesion}: {e}")
                    # Agregar concesión sin geometría en caso de error
                    concesion_dict = {
                        'id_concesion': row.id_concesion,
                        'nombre': row.nombre,
                        'codigo_centro': row.codigo_centro,
                        'titular': row.titular,
                        'tipo': row.tipo,
                        'region': row.region,
                        'geom': None
                    }
                    concesiones.append(type('Concesion', (), concesion_dict))
        
        # 4. Obtener buffer geometry
        buffer_geojson = db.execute(
            text("SELECT ST_AsGeoJSON(buffer_geom) FROM analisis_denuncia WHERE id_analisis = :id"),
            {"id": analisis.id_analisis}
        ).scalar()
        
        buffer_geom = None
        if buffer_geojson:
            try:
                buffer_geom = json.loads(buffer_geojson)
            except (json.JSONDecodeError, TypeError) as e:
                logger.warning(f"Error parseando buffer_geom para análisis {analisis.id_analisis}: {e}")
                buffer_geom = None
        
        # 5. Generar KMZ
        kmz_generator = KMZGenerator()
        kmz_bytes = await kmz_generator.generate_analysis_kmz(
            analisis=analisis,
            evidencias=evidencias,
            concesiones=concesiones,
            buffer_geom=buffer_geom
        )
        
        # 6. Crear archivo temporal
        with tempfile.NamedTemporaryFile(delete=False, suffix=".kmz") as temp_file:
            temp_file.write(kmz_bytes)
            temp_path = temp_file.name
        
        # 7. Función de limpieza
        def cleanup():
            try:
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
            except Exception as e:
                logger.warning(f"Error eliminando archivo temporal: {e}")
        
        # 8. Programar limpieza
        background_tasks.add_task(cleanup)
        
        # 9. Retornar archivo para descarga
        filename = f"inspeccion_analisis_{id_analisis}.kmz"
        
        return FileResponse(
            path=temp_path,
            media_type="application/vnd.google-earth.kmz",
            filename=filename
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generando KMZ para análisis {id_analisis}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generando KMZ: {str(e)}")

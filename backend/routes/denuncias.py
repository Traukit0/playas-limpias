from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from db import SessionLocal
from models.denuncias import Denuncia
from models.usuarios import Usuario
from models.estados import EstadoDenuncia
from models.evidencias import Evidencia
from models.analisis import AnalisisDenuncia
from schemas.denuncias import DenunciaCreate, DenunciaResponse, DenunciaDetalleResponse
from schemas.evidencias import EvidenciaResponseGeoJSON, FotoInfo
from schemas.analisis import AnalisisResponseGeoJSON, ResultadoAnalisisResponse
from security.auth import verificar_token
from typing import List, Optional
from pydantic import BaseModel
import json

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Schema para cambio de estado
class CambioEstadoRequest(BaseModel):
    id_estado: int
    observaciones: Optional[str] = None

@router.post("/", response_model=DenunciaResponse, dependencies=[Depends(verificar_token)])
def crear_denuncia(denuncia: DenunciaCreate, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == denuncia.id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    denuncia_data = denuncia.dict()
    if denuncia_data.get('fecha_ingreso') is None:
        denuncia_data.pop('fecha_ingreso', None)
    
    nueva = Denuncia(**denuncia_data)
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva

@router.get("/", response_model=List[DenunciaResponse], dependencies=[Depends(verificar_token)])
def listar_denuncias(db: Session = Depends(get_db)):
    return db.query(Denuncia).all()

@router.get("/mis-denuncias", response_model=List[DenunciaResponse])
def obtener_mis_denuncias(
    usuario_actual: Usuario = Depends(verificar_token),
    db: Session = Depends(get_db)
):
    """
    Obtiene las denuncias del usuario autenticado
    """
    denuncias = db.query(Denuncia).filter(
        Denuncia.id_usuario == usuario_actual.id_usuario
    ).order_by(Denuncia.fecha_ingreso.desc()).all()
    
    return denuncias

@router.get("/{id_denuncia}/detalles", response_model=DenunciaDetalleResponse)
def obtener_detalles_denuncia(
    id_denuncia: int,
    usuario_actual: Usuario = Depends(verificar_token),
    db: Session = Depends(get_db)
):
    """
    Obtiene los detalles completos de una denuncia específica
    """
    # Verificar que la denuncia existe y pertenece al usuario
    denuncia = db.query(Denuncia).filter(
        Denuncia.id_denuncia == id_denuncia,
        Denuncia.id_usuario == usuario_actual.id_usuario
    ).first()
    
    if not denuncia:
        raise HTTPException(
            status_code=404, 
            detail="Denuncia no encontrada o no tienes permisos para acceder a ella"
        )
    
    # Obtener evidencias de la denuncia
    evidencias = db.query(Evidencia).filter(
        Evidencia.id_denuncia == id_denuncia
    ).all()
    
    # Convertir evidencias a GeoJSON
    evidencias_geojson = []
    for evidencia in evidencias:
        try:
            coords_json = db.execute(
                text("SELECT ST_AsGeoJSON(coordenadas) FROM evidencias WHERE id_evidencia = :id"),
                {"id": evidencia.id_evidencia}
            ).scalar()
            
            evidencias_geojson.append(EvidenciaResponseGeoJSON(
                id_evidencia=evidencia.id_evidencia,
                id_denuncia=evidencia.id_denuncia,
                coordenadas=json.loads(coords_json),
                fecha=evidencia.fecha,
                hora=evidencia.hora,
                descripcion=evidencia.descripcion,
                foto_url=evidencia.foto_url
            ))
        except Exception as e:
            print(f"Error procesando evidencia {evidencia.id_evidencia}: {e}")
            # Continuar con la siguiente evidencia
            continue
    
    # Obtener análisis de la denuncia
    analisis_list = db.query(AnalisisDenuncia).filter(
        AnalisisDenuncia.id_denuncia == id_denuncia
    ).all()
    
    # Convertir análisis a respuesta GeoJSON
    analisis_geojson = []
    for analisis in analisis_list:
        try:
            # Obtener resultados del análisis con datos de concesiones
            resultados_sql = text("""
                SELECT 
                    ra.id_concesion,
                    ra.interseccion_valida,
                    ra.distancia_minima,
                    c.codigo_centro,
                    c.nombre,
                    c.titular,
                    c.tipo,
                    c.region
                FROM resultado_analisis ra
                LEFT JOIN concesiones c ON ra.id_concesion = c.id_concesion
                WHERE ra.id_analisis = :id_analisis
            """)
            
            resultados = db.execute(resultados_sql, {"id_analisis": analisis.id_analisis}).fetchall()
            
            resultados_response = [
                ResultadoAnalisisResponse(
                    id_concesion=row.id_concesion,
                    interseccion_valida=row.interseccion_valida,
                    distancia_minima=row.distancia_minima,
                    codigo_centro=str(row.codigo_centro) if row.codigo_centro else None,
                    nombre=row.nombre,
                    titular=row.titular,
                    tipo=row.tipo,
                    region=row.region
                ) for row in resultados
            ]
            
            # Obtener buffer geom como GeoJSON
            buffer_geojson = None
            if analisis.buffer_geom:
                try:
                    # Usar el método correcto de GeoAlchemy2 para obtener WKB
                    buffer_wkb = bytes(analisis.buffer_geom)
                    buffer_json = db.execute(
                        text("SELECT ST_AsGeoJSON(ST_GeomFromWKB(:buffer_wkb))"),
                        {"buffer_wkb": buffer_wkb}
                    ).scalar()
                    if buffer_json:
                        buffer_geojson = json.loads(buffer_json)
                except Exception as e:
                    print(f"Error convirtiendo buffer geom: {e}")
                    # No hacer rollback, solo continuar sin buffer_geom
                    buffer_geojson = None
            
            analisis_geojson.append(AnalisisResponseGeoJSON(
                id_analisis=analisis.id_analisis,
                id_denuncia=analisis.id_denuncia,
                fecha_analisis=analisis.fecha_analisis,
                distancia_buffer=analisis.distancia_buffer,
                metodo=analisis.metodo,
                observaciones=analisis.observaciones,
                resultados=resultados_response,
                buffer_geom=buffer_geojson
            ))
        except Exception as e:
            print(f"Error procesando análisis {analisis.id_analisis}: {e}")
            # Continuar con el siguiente análisis
            continue
    
    # Obtener fotos de la denuncia
    fotos_sql = text("""
        SELECT 
            e.id_evidencia,
            e.foto_url,
            e.descripcion,
            e.fecha,
            e.hora,
            ST_X(e.coordenadas) as lat,
            ST_Y(e.coordenadas) as lng
        FROM evidencias e
        WHERE e.id_denuncia = :id_denuncia AND e.foto_url IS NOT NULL
        ORDER BY e.fecha, e.hora
    """)
    
    try:
        fotos_result = db.execute(fotos_sql, {"id_denuncia": id_denuncia}).fetchall()
        
        fotos = [
            FotoInfo(
                id_evidencia=row.id_evidencia,
                foto_url=row.foto_url,
                descripcion=row.descripcion,
                fecha=row.fecha,
                hora=row.hora,
                coordenadas={"lat": row.lat, "lng": row.lng}
            ) for row in fotos_result
        ]
    except Exception as e:
        print(f"Error obteniendo fotos: {e}")
        # Si hay error, continuar con lista vacía
        fotos = []
    
    # Crear respuesta detallada
    return DenunciaDetalleResponse(
        id_denuncia=denuncia.id_denuncia,
        id_usuario=denuncia.id_usuario,
        id_estado=denuncia.id_estado,
        fecha_inspeccion=denuncia.fecha_inspeccion,
        fecha_ingreso=denuncia.fecha_ingreso,
        lugar=denuncia.lugar,
        observaciones=denuncia.observaciones,
        evidencias=evidencias_geojson,
        analisis=analisis_geojson,
        fotos=fotos,
        total_evidencias=len(evidencias_geojson),
        total_analisis=len(analisis_geojson),
        total_fotos=len(fotos)
    )

@router.put("/{id_denuncia}/estado", response_model=DenunciaResponse)
def cambiar_estado_denuncia(
    id_denuncia: int,
    cambio_estado: CambioEstadoRequest,
    usuario_actual: Usuario = Depends(verificar_token),
    db: Session = Depends(get_db)
):
    """
    Cambia el estado de una denuncia (solo si pertenece al usuario autenticado)
    """
    # Verificar que la denuncia existe y pertenece al usuario
    denuncia = db.query(Denuncia).filter(
        Denuncia.id_denuncia == id_denuncia,
        Denuncia.id_usuario == usuario_actual.id_usuario
    ).first()
    
    if not denuncia:
        raise HTTPException(
            status_code=404, 
            detail="Denuncia no encontrada o no tienes permisos para modificarla"
        )
    
    # Verificar que el estado existe
    estado = db.query(EstadoDenuncia).filter(
        EstadoDenuncia.id_estado == cambio_estado.id_estado
    ).first()
    
    if not estado:
        raise HTTPException(
            status_code=404,
            detail="Estado no encontrado"
        )
    
    # Actualizar el estado y observaciones
    denuncia.id_estado = cambio_estado.id_estado
    if cambio_estado.observaciones:
        denuncia.observaciones = cambio_estado.observaciones
    
    db.commit()
    db.refresh(denuncia)
    
    return denuncia

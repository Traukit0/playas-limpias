from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class AnalisisCreate(BaseModel):
    id_denuncia: int
    distancia_buffer: float
    metodo: Optional[str] = None
    observaciones: Optional[str] = None

class ResultadoAnalisisResponse(BaseModel):
    id_concesion: int
    interseccion_valida: bool
    distancia_minima: Optional[float]
    codigo_centro: Optional[str] = None
    nombre: Optional[str] = None
    titular: Optional[str] = None
    tipo: Optional[str] = None
    region: Optional[str] = None

class AnalisisResponseGeoJSON(BaseModel):
    id_analisis: int
    id_denuncia: int
    fecha_analisis: Optional[datetime]
    distancia_buffer: float
    metodo: Optional[str]
    observaciones: Optional[str]
    resultados: List[ResultadoAnalisisResponse]
    buffer_geom: Optional[Dict[str, Any]] = None

    class Config:
        orm_mode = True

class AnalisisPreviewRequest(BaseModel):
    id_denuncia: int
    distancia_buffer: float

class AnalisisPreviewResponse(BaseModel):
    buffer_geom: dict  # GeoJSON Polygon
    resultados: List[ResultadoAnalisisResponse]
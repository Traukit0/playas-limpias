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

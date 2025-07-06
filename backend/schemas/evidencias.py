from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import date, time

class EvidenciaCreateGeoJSON(BaseModel):
    id_denuncia: int
    coordenadas: Dict[str, Any] = Field(..., description="Geometría en formato GeoJSON (Point)")
    fecha: date
    hora: time
    descripcion: Optional[str] = None
    foto_url: Optional[str] = None

class EvidenciaResponseGeoJSON(EvidenciaCreateGeoJSON):
    id_evidencia: int

    class Config:
        orm_mode = True

class FotoDetalle(BaseModel):
    archivo: str
    evidencia_id: int
    timestamp_foto: str
    ruta: str

class SubidaFotosResponse(BaseModel):
    fotos_procesadas: int
    fotos_asociadas: int
    errores: List[str]
    detalles: List[FotoDetalle]

class FotoInfo(BaseModel):
    id_evidencia: int
    foto_url: str
    descripcion: Optional[str]
    fecha: date
    hora: time
    coordenadas: Dict[str, float]

class ListaFotosResponse(BaseModel):
    fotos: List[FotoInfo]
    total: int

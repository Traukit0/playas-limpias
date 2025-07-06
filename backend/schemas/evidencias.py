from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
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

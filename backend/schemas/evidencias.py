from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class EvidenciaCreateGeoJSON(BaseModel):
    id_denuncia: int
    coordenadas: Dict[str, Any] = Field(..., description="Geometría en formato GeoJSON (Point)")
    descripcion: Optional[str] = None
    foto_url: Optional[str] = None

class EvidenciaResponseGeoJSON(EvidenciaCreateGeoJSON):
    id_evidencia: int

    class Config:
        orm_mode = True

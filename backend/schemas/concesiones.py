from pydantic import BaseModel
from typing import Optional, Dict, Any

class ConcesionResponseGeoJSON(BaseModel):
    id_concesion: int
    codigo_centro: int
    titular: str
    tipo: Optional[str]
    nombre: Optional[str]
    region: Optional[str]
    geom: Dict[str, Any]  # GeoJSON

    class Config:
        orm_mode = True

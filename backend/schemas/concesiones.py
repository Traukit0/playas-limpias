from pydantic import BaseModel
from typing import Optional

class ConcesionResponse(BaseModel):
    id_concesion: int
    titular: str
    tipo: Optional[str]
    nombre: Optional[str]
    region: Optional[str]
    wkt: str  # Polygon en formato texto legible (WKT)

    class Config:
        orm_mode = True

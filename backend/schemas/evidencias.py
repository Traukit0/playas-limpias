from pydantic import BaseModel, Field
from typing import Optional

class EvidenciaBase(BaseModel):
    id_denuncia: int
    lon: float = Field(..., description="Longitud en formato decimal")
    lat: float = Field(..., description="Latitud en formato decimal")
    descripcion: Optional[str] = None
    foto_url: Optional[str] = None

class EvidenciaCreate(EvidenciaBase):
    pass

class EvidenciaResponse(EvidenciaBase):
    id_evidencia: int

    class Config:
        orm_mode = True

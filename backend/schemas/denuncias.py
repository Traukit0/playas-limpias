from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class DenunciaBase(BaseModel):
    id_usuario: int
    id_estado: Optional[int] = None
    fecha_inspeccion: datetime
    lugar: Optional[str] = None
    observaciones: Optional[str] = None

class DenunciaCreate(DenunciaBase):
    pass

class DenunciaResponse(DenunciaBase):
    id_denuncia: int
    fecha_ingreso: Optional[datetime]

    class Config:
        orm_mode = True

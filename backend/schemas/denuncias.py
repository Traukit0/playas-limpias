from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any
from schemas.evidencias import EvidenciaResponseGeoJSON, FotoInfo
from schemas.analisis import AnalisisResponseGeoJSON

class DenunciaBase(BaseModel):
    id_usuario: int
    id_estado: Optional[int] = None
    fecha_inspeccion: datetime
    fecha_ingreso: Optional[datetime] = None
    lugar: Optional[str] = None
    observaciones: Optional[str] = None

class DenunciaCreate(DenunciaBase):
    pass

class DenunciaResponse(DenunciaBase):
    id_denuncia: int
    fecha_ingreso: Optional[datetime]

    class Config:
        orm_mode = True

class DenunciaDetalleResponse(DenunciaResponse):
    """
    Respuesta detallada de una denuncia incluyendo evidencias y análisis
    """
    evidencias: List[EvidenciaResponseGeoJSON] = []
    analisis: List[AnalisisResponseGeoJSON] = []
    fotos: List[FotoInfo] = []
    total_evidencias: int = 0
    total_analisis: int = 0
    total_fotos: int = 0

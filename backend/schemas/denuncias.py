from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any
from schemas.evidencias import EvidenciaResponseGeoJSON, FotoInfo
from schemas.analisis import AnalisisResponseGeoJSON, ResultadoAnalisisResponse

class DenunciaBase(BaseModel):
    id_usuario: int
    id_estado: Optional[int] = None
    fecha_inspeccion: datetime
    fecha_ingreso: Optional[datetime] = None
    lugar: Optional[str] = None
    observaciones: Optional[str] = None

class DenunciaCreate(DenunciaBase):
    pass

class DenunciaResponse(BaseModel):
    id_denuncia: int
    id_usuario: int
    id_estado: int
    fecha_inspeccion: datetime
    fecha_ingreso: datetime
    lugar: Optional[str] = None
    observaciones: Optional[str] = None

    class Config:
        from_attributes = True

class DenunciaHistorialResponse(BaseModel):
    id_denuncia: int
    id_usuario: int
    id_estado: int
    fecha_inspeccion: datetime
    fecha_ingreso: datetime
    lugar: Optional[str] = None
    observaciones: Optional[str] = None
    usuario: Optional[dict] = None
    total_evidencias: int = 0
    total_concesiones_afectadas: int = 0

    class Config:
        from_attributes = True

class DenunciaDetalleResponse(BaseModel):
    id_denuncia: int
    id_usuario: int
    id_estado: int
    fecha_inspeccion: datetime
    fecha_ingreso: datetime
    lugar: Optional[str] = None
    observaciones: Optional[str] = None
    evidencias: List[EvidenciaResponseGeoJSON] = []
    analisis: List[AnalisisResponseGeoJSON] = []
    fotos: List[FotoInfo] = []
    total_evidencias: int = 0
    total_analisis: int = 0
    total_fotos: int = 0

    class Config:
        from_attributes = True

from sqlalchemy import Column, Integer, ForeignKey, Text, TIMESTAMP
from db import Base

class Denuncia(Base):
    __tablename__ = "denuncias"

    id_denuncia = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    id_estado = Column(Integer, ForeignKey("estados_denuncia.id_estado"), nullable=True)
    fecha_inspeccion = Column(TIMESTAMP, nullable=False)
    fecha_ingreso = Column(TIMESTAMP)
    lugar = Column(Text, nullable=True)
    observaciones = Column(Text, nullable=True)

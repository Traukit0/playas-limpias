from sqlalchemy import Column, Integer, ForeignKey, Text
from geoalchemy2 import Geometry
from db import Base

class Evidencia(Base):
    __tablename__ = "evidencias"

    id_evidencia = Column(Integer, primary_key=True, index=True)
    id_denuncia = Column(Integer, ForeignKey("denuncias.id_denuncia"), nullable=False)
    coordenadas = Column(Geometry(geometry_type="POINT", srid=4326), nullable=False)
    descripcion = Column(Text)
    foto_url = Column(Text)

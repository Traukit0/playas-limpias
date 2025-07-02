from sqlalchemy import Column, Integer, Text
from geoalchemy2 import Geometry
from db import Base

class Concesion(Base):
    __tablename__ = "concesiones"

    id_concesion = Column(Integer, primary_key=True, index=True)
    codigo_centro = Column(Integer, nullable=False)
    titular = Column(Text, nullable=False)
    tipo = Column(Text)
    nombre = Column(Text)
    region = Column(Text)
    geom = Column(Geometry(geometry_type="MULTIPOLYGON", srid=4326), nullable=False)

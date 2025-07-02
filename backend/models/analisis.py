from sqlalchemy import Column, Integer, ForeignKey, Text, TIMESTAMP, Numeric, Boolean
from db import Base
from geoalchemy2 import Geometry

class AnalisisDenuncia(Base):
    __tablename__ = "analisis_denuncia"

    id_analisis = Column(Integer, primary_key=True, index=True)
    id_denuncia = Column(Integer, ForeignKey("denuncias.id_denuncia"), nullable=False)
    fecha_analisis = Column(TIMESTAMP)
    distancia_buffer = Column(Numeric, nullable=False)
    metodo = Column(Text)
    observaciones = Column(Text)
    buffer_geom = Column(Geometry(geometry_type="POLYGON", srid=4326))

class ResultadoAnalisis(Base):
    __tablename__ = "resultado_analisis"

    id_resultado = Column(Integer, primary_key=True, index=True)
    id_analisis = Column(Integer, ForeignKey("analisis_denuncia.id_analisis"), nullable=False)
    id_concesion = Column(Integer, ForeignKey("concesiones.id_concesion"), nullable=False)
    interseccion_valida = Column(Boolean)
    distancia_minima = Column(Numeric)

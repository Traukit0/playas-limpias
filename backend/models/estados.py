from sqlalchemy import Column, Integer, Text
from db import Base

class EstadoDenuncia(Base):
    __tablename__ = "estados_denuncia"

    id_estado = Column(Integer, primary_key=True, index=True)
    estado = Column(Text, unique=True, nullable=False)

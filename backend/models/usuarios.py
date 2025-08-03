from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from db import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id_usuario = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=True)  # Nullable para migración
    fecha_registro = Column(DateTime(timezone=True), server_default=func.now())
    activo = Column(Boolean, default=True)
    ultimo_acceso = Column(DateTime(timezone=True), nullable=True)

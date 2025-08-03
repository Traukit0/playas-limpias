from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

class UsuarioBase(BaseModel):
    nombre: str
    email: EmailStr

class UsuarioCreate(UsuarioBase):
    pass

class UsuarioResponse(UsuarioBase):
    id_usuario: int
    fecha_registro: datetime
    activo: bool
    ultimo_acceso: Optional[datetime] = None

    class Config:
        from_attributes = True  # Updated for Pydantic v2

# Schemas para autenticación
class UsuarioRegister(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)

class UsuarioLogin(BaseModel):
    email: EmailStr
    password: str

class UsuarioAuth(BaseModel):
    id_usuario: int
    nombre: str
    email: str
    activo: bool
    fecha_registro: datetime
    ultimo_acceso: Optional[datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: UsuarioAuth

class TokenData(BaseModel):
    email: Optional[str] = None

class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6, max_length=100)

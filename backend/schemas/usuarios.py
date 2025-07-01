from pydantic import BaseModel, EmailStr

class UsuarioBase(BaseModel):
    nombre: str
    email: EmailStr

class UsuarioCreate(UsuarioBase):
    pass

class UsuarioResponse(UsuarioBase):
    id_usuario: int

    class Config:
        orm_mode = True

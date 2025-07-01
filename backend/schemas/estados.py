from pydantic import BaseModel

class EstadoDenunciaResponse(BaseModel):
    id_estado: int
    estado: str

    class Config:
        orm_mode = True

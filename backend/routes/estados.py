from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from db import SessionLocal
from models.estados import EstadoDenuncia
from schemas.estados import EstadoDenunciaResponse
from security.auth import verificar_token
from typing import List

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[EstadoDenunciaResponse], dependencies=[Depends(verificar_token)])
def listar_estados(id_estado: int = Query(None), db: Session = Depends(get_db)):
    if id_estado is not None:
        estados = db.query(EstadoDenuncia).filter(EstadoDenuncia.id_estado == id_estado).all()
    else:
        estados = db.query(EstadoDenuncia).all()
    return estados

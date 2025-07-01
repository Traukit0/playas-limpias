from fastapi import APIRouter, Depends
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
def listar_estados(db: Session = Depends(get_db)):
    return db.query(EstadoDenuncia).all()

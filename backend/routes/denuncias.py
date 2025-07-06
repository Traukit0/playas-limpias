from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import SessionLocal
from models.denuncias import Denuncia
from models.usuarios import Usuario
from schemas.denuncias import DenunciaCreate, DenunciaResponse
from security.auth import verificar_token
from typing import List

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=DenunciaResponse, dependencies=[Depends(verificar_token)])
def crear_denuncia(denuncia: DenunciaCreate, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == denuncia.id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    denuncia_data = denuncia.dict()
    if denuncia_data.get('fecha_ingreso') is None:
        denuncia_data.pop('fecha_ingreso', None)
    
    nueva = Denuncia(**denuncia_data)
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva

@router.get("/", response_model=List[DenunciaResponse], dependencies=[Depends(verificar_token)])
def listar_denuncias(db: Session = Depends(get_db)):
    return db.query(Denuncia).all()

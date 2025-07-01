from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import SessionLocal
from models.usuarios import Usuario
from schemas.usuarios import UsuarioCreate, UsuarioResponse
from security.auth import verificar_token
from typing import List

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=UsuarioResponse, dependencies=[Depends(verificar_token)])
def crear_usuario(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    db_usuario = db.query(Usuario).filter(Usuario.email == usuario.email).first()
    if db_usuario:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    nuevo_usuario = Usuario(**usuario.dict())
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario

@router.get("/", response_model=List[UsuarioResponse], dependencies=[Depends(verificar_token)])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(Usuario).all()

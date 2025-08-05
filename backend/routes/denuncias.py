from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import SessionLocal
from models.denuncias import Denuncia
from models.usuarios import Usuario
from models.estados import EstadoDenuncia
from schemas.denuncias import DenunciaCreate, DenunciaResponse
from security.auth import verificar_token
from typing import List
from pydantic import BaseModel

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Schema para cambio de estado
class CambioEstadoRequest(BaseModel):
    id_estado: int

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

@router.get("/mis-denuncias", response_model=List[DenunciaResponse])
def obtener_mis_denuncias(
    usuario_actual: Usuario = Depends(verificar_token),
    db: Session = Depends(get_db)
):
    """
    Obtiene las denuncias del usuario autenticado
    """
    denuncias = db.query(Denuncia).filter(
        Denuncia.id_usuario == usuario_actual.id_usuario
    ).order_by(Denuncia.fecha_ingreso.desc()).all()
    
    return denuncias

@router.put("/{id_denuncia}/estado", response_model=DenunciaResponse)
def cambiar_estado_denuncia(
    id_denuncia: int,
    cambio_estado: CambioEstadoRequest,
    usuario_actual: Usuario = Depends(verificar_token),
    db: Session = Depends(get_db)
):
    """
    Cambia el estado de una denuncia (solo si pertenece al usuario autenticado)
    """
    # Verificar que la denuncia existe y pertenece al usuario
    denuncia = db.query(Denuncia).filter(
        Denuncia.id_denuncia == id_denuncia,
        Denuncia.id_usuario == usuario_actual.id_usuario
    ).first()
    
    if not denuncia:
        raise HTTPException(
            status_code=404, 
            detail="Denuncia no encontrada o no tienes permisos para modificarla"
        )
    
    # Verificar que el estado existe
    estado = db.query(EstadoDenuncia).filter(
        EstadoDenuncia.id_estado == cambio_estado.id_estado
    ).first()
    
    if not estado:
        raise HTTPException(
            status_code=404,
            detail="Estado no encontrado"
        )
    
    # Actualizar el estado
    denuncia.id_estado = cambio_estado.id_estado
    db.commit()
    db.refresh(denuncia)
    
    return denuncia

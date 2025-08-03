from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import and_
from db import SessionLocal
from models.usuarios import Usuario
from security.utils import verify_token

security = HTTPBearer()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Token estático de prueba para compatibilidad temporal
TOKENS_VALIDOS = {"testtoken123": "usuario_prueba"}

def verificar_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    Middleware de verificación de token que soporta tanto JWT como token hardcodeado
    para compatibilidad durante la transición
    """
    token = credentials.credentials
    
    # Primero intentar verificar como JWT
    email = verify_token(token)
    if email:
        # Es un JWT válido, buscar usuario en base de datos
        user = db.query(Usuario).filter(
            and_(Usuario.email == email, Usuario.activo == True)
        ).first()
        
        if user:
            return user
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario no encontrado o inactivo"
            )
    
    # Si no es JWT válido, verificar token hardcodeado (compatibilidad temporal)
    if token in TOKENS_VALIDOS:
        # Retornar usuario de prueba para compatibilidad
        return TOKENS_VALIDOS[token]
    
    # Token inválido
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o expirado"
    )

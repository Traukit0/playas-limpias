from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timedelta, timezone
from db import SessionLocal
from models.usuarios import Usuario
from schemas.usuarios import (
    UsuarioRegister, 
    UsuarioLogin, 
    Token, 
    UsuarioAuth,
    ChangePassword
)
from security.utils import (
    hash_password, 
    verify_password, 
    create_access_token, 
    verify_token,
    get_token_expiration_time
)
import logging
import time
from logging_utils import log_event, mask_email

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Usuario:
    """
    Dependency para obtener el usuario actual desde el token JWT
    """
    token = credentials.credentials
    email = verify_token(token)
    
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(Usuario).filter(
        and_(Usuario.email == email, Usuario.activo == True)
    ).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado o inactivo",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Actualizar último acceso
    user.ultimo_acceso = datetime.now(timezone.utc)
    db.commit()
    
    return user

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UsuarioRegister, db: Session = Depends(get_db)):
    """
    Registro de nuevo usuario
    """
    # Verificar si el email ya existe
    start = time.perf_counter()
    existing_user = db.query(Usuario).filter(Usuario.email == user_data.email).first()
    if existing_user:
        # Log de conflicto por email ya registrado
        log_event(logger, "INFO", "user_register_conflict", email_mask=mask_email(user_data.email))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    # Crear usuario
    hashed_password = hash_password(user_data.password)
    new_user = Usuario(
        nombre=user_data.nombre,
        email=user_data.email,
        password_hash=hashed_password,
        fecha_registro=datetime.now(timezone.utc),
        activo=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    logger.info(f"Usuario registrado: {new_user.email}")
    log_event(logger, "INFO", "user_register_success",
              email_mask=mask_email(new_user.email), user_id=new_user.id_usuario,
              duration_ms=int((time.perf_counter()-start)*1000))
    
    # Generar token
    access_token = create_access_token(data={"sub": new_user.email})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=get_token_expiration_time(),
        user=UsuarioAuth.from_orm(new_user)
    )

@router.post("/login", response_model=Token)
async def login_user(user_credentials: UsuarioLogin, db: Session = Depends(get_db)):
    """
    Login de usuario existente
    """
    start = time.perf_counter()
    # Buscar usuario por email
    user = db.query(Usuario).filter(
        and_(Usuario.email == user_credentials.email, Usuario.activo == True)
    ).first()
    
    if not user or not verify_password(user_credentials.password, user.password_hash):
        log_event(logger, "INFO", "user_login_failed",
                  email_mask=mask_email(user_credentials.email), reason="invalid_credentials",
                  duration_ms=int((time.perf_counter()-start)*1000))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Actualizar último acceso
    user.ultimo_acceso = datetime.now(timezone.utc)
    db.commit()
    
    logger.info(f"Usuario autenticado: {user.email}")
    log_event(logger, "INFO", "user_login_success",
              email_mask=mask_email(user.email), user_id=user.id_usuario,
              duration_ms=int((time.perf_counter()-start)*1000))
    
    # Generar token
    access_token = create_access_token(data={"sub": user.email})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=get_token_expiration_time(),
        user=UsuarioAuth.from_orm(user)
    )

@router.get("/me", response_model=UsuarioAuth)
async def get_current_user_info(current_user: Usuario = Depends(get_current_user)):
    """
    Obtener información del usuario actual
    """
    return UsuarioAuth.from_orm(current_user)

@router.post("/refresh", response_model=Token)
async def refresh_token(current_user: Usuario = Depends(get_current_user)):
    """
    Renovar token de acceso
    """
    access_token = create_access_token(data={"sub": current_user.email})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=get_token_expiration_time(),
        user=UsuarioAuth.from_orm(current_user)
    )

@router.put("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    password_data: ChangePassword,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cambiar contraseña del usuario actual
    """
    # Verificar contraseña actual
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contraseña actual incorrecta"
        )
    
    # Actualizar contraseña
    current_user.password_hash = hash_password(password_data.new_password)
    db.commit()
    
    logger.info(f"Contraseña cambiada para usuario: {current_user.email}")
    log_event(logger, "INFO", "user_change_password_success",
              user_id=current_user.id_usuario)
    
    return {"message": "Contraseña actualizada exitosamente"}

@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout_user():
    """
    Logout del usuario (en implementación JWT stateless, solo informativo)
    """
    return {"message": "Sesión cerrada exitosamente"}
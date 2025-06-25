from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

# Token estático de prueba
TOKENS_VALIDOS = {"testtoken123": "usuario_prueba"}

def verificar_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    if token not in TOKENS_VALIDOS:
        raise HTTPException(status_code=403, detail="Token inválido o expirado")
    return TOKENS_VALIDOS[token]

# Configuración adicional para autenticación
# Este archivo complementa config.py con variables específicas de auth

import os
from dotenv import load_dotenv

load_dotenv()

# Configuración JWT
JWT_SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production-playas-limpias-2025")
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Configuración de seguridad
BCRYPT_ROUNDS = 12  # Número de rounds para hashing de passwords

# Configuraciones por ambiente
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

if ENVIRONMENT == "production":
    # Configuraciones más estrictas para producción
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 15  # Tokens más cortos en prod
    BCRYPT_ROUNDS = 14  # Más rounds en prod
    
    # Validar que SECRET_KEY sea segura en producción
    if JWT_SECRET_KEY == "dev-secret-key-change-in-production-playas-limpias-2025":
        raise ValueError("⚠️ SECURITY WARNING: Debes cambiar SECRET_KEY en producción!")

# Configuración de rate limiting (para implementar a futuro)
RATE_LIMIT_AUTH_REQUESTS = 5  # máximo 5 intentos de login por minuto
RATE_LIMIT_AUTH_WINDOW = 60   # ventana de 60 segundos
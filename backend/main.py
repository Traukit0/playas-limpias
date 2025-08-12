from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routes import usuarios, denuncias, evidencias, concesiones, analisis, estados, auth
import os
import time
import uuid
import logging
from logging_config import setup_logging

setup_logging()
app = FastAPI()

# Configuración CORS para el frontend en localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], #Esto se debe cambiar al pasar a prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montar archivos estáticos para las fotos
if os.path.exists("fotos"):
    app.mount("/fotos", StaticFiles(directory="fotos"), name="fotos")

# Incluir rutas
app.include_router(auth.router, prefix="/auth", tags=["Autenticación"])
app.include_router(usuarios.router, prefix="/usuarios", tags=["Usuarios"])
app.include_router(denuncias.router, prefix="/denuncias", tags=["Denuncias"])
app.include_router(evidencias.router, prefix="/evidencias", tags=["Evidencias"])
app.include_router(concesiones.router, prefix="/concesiones", tags=["Concesiones"])
app.include_router(analisis.router, prefix="/analisis", tags=["Análisis Geoespacial"])
app.include_router(estados.router, prefix="/estados_denuncia", tags=["Catálogos"])

# Middleware de access log simple (request_id, duración, status)
access_logger = logging.getLogger("access")


@app.middleware("http")
async def access_log_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    start = time.perf_counter()
    response = None
    try:
        response = await call_next(request)
        return response
    finally:
        duration_ms = int((time.perf_counter() - start) * 1000)
        user_agent = request.headers.get("user-agent", "-")
        client_ip = request.client.host if request.client else "-"
        status = response.status_code if response else 500
        path = request.url.path
        method = request.method
        access_logger.info(
            f'event="http_access" method="{method}" path="{path}" status="{status}" '
            f'duration_ms="{duration_ms}" request_id="{request_id}" ip="{client_ip}" ua="{user_agent}"'
        )

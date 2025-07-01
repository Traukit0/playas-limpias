from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import usuarios, denuncias, evidencias, concesiones, analisis

app = FastAPI()

# Configuración CORS para el frontend en localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], #Esto se debe cambiar al pasar a prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rutas
app.include_router(usuarios.router, prefix="/usuarios", tags=["Usuarios"])
app.include_router(denuncias.router, prefix="/denuncias", tags=["Denuncias"])
app.include_router(evidencias.router, prefix="/evidencias", tags=["Evidencias"])
app.include_router(concesiones.router, prefix="/concesiones", tags=["Concesiones"])
app.include_router(analisis.router, prefix="/analisis", tags=["Análisis Geoespacial"])

from dotenv import load_dotenv
import os
from pathlib import Path

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Configuración de directorios
BASE_DIR = Path(__file__).parent
FOTOS_DIR = os.getenv("FOTOS_DIR", str(BASE_DIR / "fotos"))

# Configuración del servidor para URLs (usado solo cuando sea necesario)
SERVER_HOST = os.getenv("SERVER_HOST", "localhost")
SERVER_PORT = os.getenv("SERVER_PORT", "8000")
SERVER_PROTOCOL = os.getenv("SERVER_PROTOCOL", "http")
BASE_URL = f"{SERVER_PROTOCOL}://{SERVER_HOST}:{SERVER_PORT}"

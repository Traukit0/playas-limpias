import logging
import os
from logging.handlers import RotatingFileHandler
from pathlib import Path


# Directorio de logs dentro de /app (WORKDIR)
LOG_DIR = Path(__file__).parent / "logs" / "backend"
LOG_DIR.mkdir(parents=True, exist_ok=True)
LOG_PATH = LOG_DIR / "app.log"


def setup_logging(level: str | None = None) -> None:
    """Configura logging simple a archivo local con rotación.

    - Ruta: ./logs/backend/app.log
    - Rotación: 5MB, 5 backups
    - Formato: simple key=value amigable para lectura humana
    """
    log_level_name = (level or os.getenv("LOG_LEVEL", "INFO")).upper()

    formatter = logging.Formatter(
        fmt="ts=%(asctime)s level=%(levelname)s module=%(name)s msg=%(message)s"
    )

    file_handler = RotatingFileHandler(
        LOG_PATH, maxBytes=5_000_000, backupCount=5, encoding="utf-8"
    )
    file_handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.setLevel(log_level_name)

    # Evitar duplicados si se recarga el módulo
    root_logger.handlers.clear()
    root_logger.addHandler(file_handler)



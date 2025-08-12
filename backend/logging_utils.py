from __future__ import annotations

import logging
from typing import Any


def mask_email(email: str) -> str:
    """Enmascara un email: john@example.com -> j***@example.com"""
    try:
        local, domain = email.split("@", 1)
        if not local:
            return f"*@{domain}"
        visible = local[0]
        return f"{visible}***@{domain}"
    except Exception:
        return "***"


def kv(**fields: Any) -> str:
    """Convierte pares clave/valor en un string key="value" separado por espacios."""
    parts: list[str] = []
    for key, value in fields.items():
        if value is None:
            continue
        # Normalizar a string seguro en una línea
        text = str(value).replace("\n", " ").replace('"', "'")
        parts.append(f'{key}="{text}"')
    return " ".join(parts)


def log_event(logger: logging.Logger, level: str, event: str, **fields: Any) -> None:
    """Emite un evento de log homogéneo con formato key=value.

    level: INFO|WARNING|ERROR|DEBUG (case-insensitive)
    event: nombre del evento (p.ej. user_login_success)
    fields: datos adicionales (ids, contadores, duraciones)
    """
    line = f'event="{event}" ' + kv(**fields)
    level_method = getattr(logger, level.lower(), logger.info)
    level_method(line)



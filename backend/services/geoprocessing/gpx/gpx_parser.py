from fastapi import UploadFile
from sqlalchemy.orm import Session
from models.evidencias import Evidencia
from geoalchemy2.shape import from_shape
from shapely.geometry import Point
import gpxpy
import datetime
import logging
import time
import json as _json
from logging_utils import log_event

def procesar_gpx_waypoints(gpx_file: UploadFile, id_denuncia: int, db: Session, utc_offset: int):
    """
    Parsea un archivo GPX (solo waypoints) y los guarda como evidencias georreferenciadas en la BD.
    Ajusta la hora de cada waypoint según el utc_offset proporcionado.
    """
    start = time.perf_counter()
    logger = logging.getLogger("wizard")

    # Región objetivo y SRID esperado (para evidencia de control CR3)
    LAT_MIN, LAT_MAX = -45.0, -40.0
    LON_MIN, LON_MAX = -75.0, -71.0
    EPSG = "EPSG:4326"

    contenido = gpx_file.file.read().decode("utf-8")
    gpx = gpxpy.parse(contenido)

    contador = 0
    dentro_region = 0
    fuera_region = 0
    min_lat = None
    max_lat = None
    min_lon = None
    max_lon = None
    muestras_fuera = []  # type: ignore[var-annotated]
    for wpt in gpx.waypoints:
        lat, lon = wpt.latitude, wpt.longitude
        tiempo = wpt.time  # datetime.datetime
        nombre = wpt.name if wpt.name else "Waypoint"
        descripcion = None

        # Estadísticos y verificación de región objetivo
        try:
            min_lat = lat if min_lat is None else min(min_lat, lat)
            max_lat = lat if max_lat is None else max(max_lat, lat)
            min_lon = lon if min_lon is None else min(min_lon, lon)
            max_lon = lon if max_lon is None else max(max_lon, lon)

            inside = (LAT_MIN <= lat <= LAT_MAX) and (LON_MIN <= lon <= LON_MAX)
            if inside:
                dentro_region += 1
            else:
                fuera_region += 1
                if len(muestras_fuera) < 5:
                    muestras_fuera.append({"lat": lat, "lon": lon, "nombre": nombre})

            # Log granular (DEBUG) por waypoint; no altera el flujo si el logger está en INFO
            log_event(
                logger,
                "DEBUG",
                "gpx_waypoint_bounds_check",
                denuncia_id=id_denuncia,
                lat=lat,
                lon=lon,
                inside_region=inside,
                epsg=EPSG,
                waypoint_name=nombre,
            )
        except Exception:
            # Nunca afectar el procesamiento por errores de logging/estadísticos
            pass

        punto = from_shape(Point(lon, lat), srid=4326)

        # Extraer fecha y hora del waypoint y ajustar por utc_offset
        if tiempo:
            tiempo_ajustado = tiempo + datetime.timedelta(hours=utc_offset)
            fecha = tiempo_ajustado.date()
            hora = tiempo_ajustado.time()
        else:
            fecha = datetime.date.today()
            hora = datetime.time(0, 0, 0)

        evidencia = Evidencia(
            id_denuncia=id_denuncia,
            coordenadas=punto,
            fecha=fecha,
            hora=hora,
            descripcion=descripcion,
            foto_url=None  # se asignará después si corresponde
        )
        db.add(evidencia)
        contador += 1

    db.commit()
    # Log de resumen del procesamiento para evidenciar control CR3
    try:
        log_event(
            logger,
            "INFO",
            "gpx_processing_summary",
            denuncia_id=id_denuncia,
            total_waypoints=contador,
            inside_region=dentro_region,
            outside_region=fuera_region,
            lat_range=(f"{min_lat},{max_lat}" if min_lat is not None else None),
            lon_range=(f"{min_lon},{max_lon}" if min_lon is not None else None),
            epsg=EPSG,
            duration_ms=int((time.perf_counter() - start) * 1000),
            samples_outside=_json.dumps(muestras_fuera) if muestras_fuera else None,
        )
    except Exception:
        pass

    return {"detalle": f"{contador} waypoints procesados desde el archivo GPX."}
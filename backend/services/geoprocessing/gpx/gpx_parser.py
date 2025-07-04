from fastapi import UploadFile
from sqlalchemy.orm import Session
from models.evidencias import Evidencia
from geoalchemy2.shape import from_shape
from shapely.geometry import Point
import gpxpy
import datetime

def procesar_gpx_waypoints(gpx_file: UploadFile, id_denuncia: int, db: Session):
    """
    Parsea un archivo GPX (solo waypoints) y los guarda como evidencias georreferenciadas en la BD.
    """
    contenido = gpx_file.file.read().decode("utf-8")
    gpx = gpxpy.parse(contenido)

    contador = 0
    for wpt in gpx.waypoints:
        lat, lon = wpt.latitude, wpt.longitude
        tiempo = wpt.time  # datetime.datetime
        nombre = wpt.name if wpt.name else "Waypoint"
        descripcion = f"{nombre} - {tiempo.isoformat()}" if tiempo else nombre

        punto = from_shape(Point(lon, lat), srid=4326)

        evidencia = Evidencia(
            id_denuncia=id_denuncia,
            coordenadas=punto,
            descripcion=descripcion,
            foto_url=None  # se asignará después si corresponde
        )
        db.add(evidencia)
        contador += 1

    db.commit()
    return {"detalle": f"{contador} waypoints procesados desde el archivo GPX."}
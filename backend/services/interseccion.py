from sqlalchemy import text
from sqlalchemy.orm import Session

def intersectar_concesiones(db: Session, buffer_geom_wkb):
    """
    Recibe un buffer (geom) y retorna las concesiones que intersectan con él.
    - Calcula también la distancia entre el centroide de cada concesión y el buffer.
    """
    sql = text("""
        SELECT
            c.id_concesion,
            ST_Intersects(c.geom, :buffer_geom) AS interseccion_valida,
            ST_Distance(ST_Centroid(c.geom), :buffer_geom) AS distancia_minima
        FROM concesiones c
        WHERE ST_Intersects(c.geom, :buffer_geom)
    """)

    results = db.execute(sql, {"buffer_geom": buffer_geom_wkb}).fetchall()
    return results

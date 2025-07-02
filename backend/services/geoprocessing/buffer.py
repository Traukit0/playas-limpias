from sqlalchemy import text
from sqlalchemy.orm import Session

def generar_buffer_union(db: Session, id_denuncia: int, radio_metros: float):
    """
    Genera un buffer unificado alrededor de todos los puntos GPS asociados a una denuncia.
    - Transforma los puntos a EPSG:32718 para usar metros como unidad.
    - Aplica ST_Buffer individual a cada punto y los une con ST_Union.
    - Devuelve el buffer como geometría transformada a EPSG:4326.
    """
    sql = text("""
        WITH puntos AS (
            SELECT ST_Transform(coordenadas, 32718) AS geom
            FROM evidencias
            WHERE id_denuncia = :id_denuncia
        ),
        union_puntos AS (
            SELECT ST_Union(geom) AS geom FROM puntos
        ),
        buffer_union AS (
            SELECT ST_Transform(ST_Buffer(geom, :radio), 4326) AS geom
            FROM union_puntos
        )
        SELECT geom FROM buffer_union;
    """)

    result = db.execute(sql, {"id_denuncia": id_denuncia, "radio": radio_metros}).scalar()
    return result

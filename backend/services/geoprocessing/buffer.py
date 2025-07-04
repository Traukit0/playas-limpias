from sqlalchemy import text
from sqlalchemy.orm import Session

def generar_buffer_union(db: Session, id_denuncia: int, distancia: float):
    """
    Genera un buffer unificado a partir de todas las evidencias de una denuncia,
    y lo recorta con la capa `los_lagos` para excluir tierra firme si está presente.
    """
    # Crear buffer para todas las evidencias de la denuncia
    sql_buffer = text("""
        SELECT ST_Union(ST_Buffer(coordenadas::geography, :distancia)::geometry)
        FROM evidencias
        WHERE id_denuncia = :id
    """)
    buffer_geom = db.execute(sql_buffer, {"id": id_denuncia, "distancia": distancia}).scalar()

    if not buffer_geom:
        raise ValueError("No se encontraron evidencias para la denuncia")

    # Intentar recorte con los_lagos para EXCLUIR tierra
    try:
        sql_check = text("SELECT to_regclass('public.los_lagos')")
        exists = db.execute(sql_check).scalar()
        if exists:
            sql_recorte = text("""
                SELECT ST_Difference(:buffer_geom, (SELECT ST_Union(geom) FROM los_lagos))
            """)
            buffer_geom = db.execute(sql_recorte, {"buffer_geom": buffer_geom}).scalar()
    except Exception as e:
        print(f"[Advertencia] No se pudo aplicar recorte con los_lagos: {e}")

    return buffer_geom
-- ========================
-- Script de creación de tablas
-- Proyecto: Playas Limpias
-- Base de datos: PostgreSQL + PostGIS
-- ========================

-- 1. Usuarios
CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL
);

-- 2. Estados de denuncia
CREATE TABLE estados_denuncia (
    id_estado SERIAL PRIMARY KEY,
    estado TEXT UNIQUE NOT NULL
);

-- 3. Denuncias
CREATE TABLE denuncias (
    id_denuncia SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES usuarios(id_usuario),
    id_estado INTEGER REFERENCES estados_denuncia(id_estado),
    fecha_inspeccion TIMESTAMP NOT NULL,
    fecha_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lugar TEXT,
    observaciones TEXT
);

-- 4. Evidencias (puntos GPS con fotos)
CREATE TABLE evidencias (
    id_evidencia SERIAL PRIMARY KEY,
    id_denuncia INTEGER REFERENCES denuncias(id_denuncia),
    coordenadas GEOMETRY(Point, 4326) NOT NULL,
    descripcion TEXT,
    foto_url TEXT
);

-- 5. Concesiones (centros de cultivo)
CREATE TABLE concesiones (
    id_concesion SERIAL PRIMARY KEY,
    titular TEXT NOT NULL,
    tipo TEXT,
    nombre TEXT,
    region TEXT,
    geom GEOMETRY(Polygon, 4326) NOT NULL
);

-- 6. Análisis ejecutado sobre una denuncia
CREATE TABLE analisis_denuncia (
    id_analisis SERIAL PRIMARY KEY,
    id_denuncia INTEGER REFERENCES denuncias(id_denuncia),
    fecha_analisis TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    distancia_buffer NUMERIC NOT NULL,
    metodo TEXT,
    observaciones TEXT
);

-- 7. Resultado del análisis: concesiones intersectadas
CREATE TABLE resultado_analisis (
    id_resultado SERIAL PRIMARY KEY,
    id_analisis INTEGER REFERENCES analisis_denuncia(id_analisis),
    id_concesion INTEGER REFERENCES concesiones(id_concesion),
    interseccion_valida BOOLEAN,
    distancia_minima NUMERIC
);

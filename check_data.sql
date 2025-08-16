-- Script para verificar datos en las tablas
-- Conectar a la base de datos y ejecutar estas consultas

-- Verificar datos en denuncias
SELECT COUNT(*) as total_denuncias FROM denuncias;

-- Verificar datos en evidencias
SELECT COUNT(*) as total_evidencias FROM evidencias;

-- Verificar datos en concesiones
SELECT COUNT(*) as total_concesiones FROM concesiones;

-- Verificar datos en análisis
SELECT COUNT(*) as total_analisis FROM analisis_denuncia;

-- Verificar evidencias con coordenadas
SELECT COUNT(*) as evidencias_con_coordenadas 
FROM evidencias 
WHERE coordenadas IS NOT NULL;

-- Verificar algunas evidencias con sus coordenadas
SELECT id_evidencia, id_denuncia, ST_AsText(coordenadas) as coordenadas_texto
FROM evidencias 
WHERE coordenadas IS NOT NULL 
LIMIT 5;

-- Verificar concesiones con geometría
SELECT COUNT(*) as concesiones_con_geometria 
FROM concesiones 
WHERE geom IS NOT NULL;

-- Verificar algunas concesiones con su geometría
SELECT id_concesion, codigo_centro, ST_AsText(ST_Centroid(geom)) as centro_geometria
FROM concesiones 
WHERE geom IS NOT NULL 
LIMIT 5;

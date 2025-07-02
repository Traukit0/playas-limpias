BEGIN;

INSERT INTO denuncias (
    id_usuario,
    id_estado,
    fecha_inspeccion,
    lugar,
    observaciones
)
VALUES (
    1,
    1,
    '2025-07-02 10:00:00',
    'Playa Puyan, Chiloé',
    'Se detectaron residuos acuícolas dispersos en la playa.'
);

COMMIT;

-- ============================================================
-- VortexManager · Hayya Fitness Club
-- Esquema de base de datos (idempotente: se puede ejecutar varias veces)
-- Ejecutar con:  cd server && npm run db:setup
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Usuarios (autenticación del panel)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    correo VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    rol VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Socios
CREATE TABLE IF NOT EXISTS socios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dni VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(255),
    telefono VARCHAR(50),
    plan VARCHAR(50) NOT NULL DEFAULT 'Mensual',
    ficha_medica_entregada BOOLEAN DEFAULT FALSE,
    estado VARCHAR(20) DEFAULT 'Activo',
    puntos INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Registro de accesos (Tótem DNI)
CREATE TABLE IF NOT EXISTS registro_accesos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    socio_id UUID REFERENCES socios(id) ON DELETE SET NULL,
    dni_ingresado VARCHAR(20) NOT NULL,
    nombre_socio VARCHAR(200),
    estado_acceso VARCHAR(20) NOT NULL,      -- PERMITIDO | DENEGADO
    motivo VARCHAR(255),                     -- "Acceso Correcto", "Ficha Médica Pendiente", ...
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para las consultas del dashboard y la ficha del socio
CREATE INDEX IF NOT EXISTS idx_registro_accesos_fecha ON registro_accesos (fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_registro_accesos_socio ON registro_accesos (socio_id, fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_socios_estado ON socios (estado);

-- Socios de prueba
INSERT INTO socios (dni, nombre, apellido, correo, telefono, plan, ficha_medica_entregada, estado, puntos)
VALUES
    ('40123456', 'Juan',  'Pérez',     'juan.perez@gmail.com',    '3537123456', 'Mensual',   TRUE,  'Activo',   150),
    ('38987654', 'María', 'Gómez',     'maria.gomez@hotmail.com', '3537654321', 'Quincenal', TRUE,  'Activo',   80),
    ('42111222', 'Lucas', 'Rodríguez', 'lucas.rod@gmail.com',     '3537998877', 'Diario',    FALSE, 'Activo',   20),
    ('39444555', 'Ana',   'Martínez',  'ana.martinez@yahoo.com',  '3537332211', 'Mensual',   FALSE, 'Inactivo', 0)
ON CONFLICT (dni) DO NOTHING;

-- NOTA: el usuario admin NO se inserta acá. Lo crea scripts/setup-db.js
-- generando un hash bcrypt real de la contraseña (el hash de ejemplo
-- que circulaba no correspondía a "admin123" y el login fallaba).

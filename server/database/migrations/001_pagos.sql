-- ============================================================
-- Migración 001 · Módulo de Pagos
-- Idempotente y 100% aditiva (no borra ni modifica datos existentes).
-- Ejecutar con:  cd server && npm run db:migrate
-- ============================================================

-- Vencimiento de la membresía del socio (NULL = nunca registró un pago)
ALTER TABLE socios ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE;
CREATE INDEX IF NOT EXISTS idx_socios_vencimiento ON socios (fecha_vencimiento);

-- Comprobantes de pago
CREATE TABLE IF NOT EXISTS pagos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- SET NULL: si se elimina el socio, el registro contable se conserva
    socio_id UUID REFERENCES socios(id) ON DELETE SET NULL,
    plan_abonado VARCHAR(100) NOT NULL,
    monto_base NUMERIC(10, 2) NOT NULL CHECK (monto_base >= 0),
    recargo_mora NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (recargo_mora >= 0),
    monto_total NUMERIC(10, 2) NOT NULL CHECK (monto_total >= 0),
    metodo_pago VARCHAR(20) NOT NULL CHECK (metodo_pago IN ('Efectivo', 'Transferencia')),
    comprobante_ref VARCHAR(100),
    vencimiento_anterior DATE,
    vencimiento_nuevo DATE NOT NULL,
    fecha_pago TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pagos_socio ON pagos (socio_id, fecha_pago DESC);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON pagos (fecha_pago DESC);

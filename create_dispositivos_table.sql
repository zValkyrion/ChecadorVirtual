-- Script SQL para crear la tabla dispositivos_autorizados
-- Ejecutar este script en el SQL Editor de Supabase

CREATE TABLE IF NOT EXISTS dispositivos_autorizados (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    user_agent TEXT,
    screen VARCHAR(50),
    timezone VARCHAR(100),
    language VARCHAR(10),
    platform VARCHAR(50),
    hardware_concurrency INTEGER,
    device_memory INTEGER,
    color_depth INTEGER,
    pixel_ratio DECIMAL(3,2),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_dispositivos_autorizados_device_id ON dispositivos_autorizados(device_id);
CREATE INDEX IF NOT EXISTS idx_dispositivos_autorizados_activo ON dispositivos_autorizados(activo);

-- Habilitar RLS (Row Level Security)
ALTER TABLE dispositivos_autorizados ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad
CREATE POLICY "Permitir todas las operaciones" ON dispositivos_autorizados
    FOR ALL USING (true);

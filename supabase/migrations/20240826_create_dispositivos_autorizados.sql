-- Crear tabla para dispositivos autorizados
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

-- Crear índice para búsquedas rápidas por device_id
CREATE INDEX IF NOT EXISTS idx_dispositivos_autorizados_device_id ON dispositivos_autorizados(device_id);
CREATE INDEX IF NOT EXISTS idx_dispositivos_autorizados_activo ON dispositivos_autorizados(activo);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_dispositivos_autorizados_updated_at 
    BEFORE UPDATE ON dispositivos_autorizados 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE dispositivos_autorizados ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad
-- Los administradores pueden hacer todo
CREATE POLICY "Administradores pueden gestionar dispositivos" ON dispositivos_autorizados
    FOR ALL USING (true);

-- Permitir lectura para verificar dispositivos autorizados
CREATE POLICY "Permitir lectura de dispositivos activos" ON dispositivos_autorizados
    FOR SELECT USING (activo = true);

-- Comentarios para documentación
COMMENT ON TABLE dispositivos_autorizados IS 'Tabla que almacena los dispositivos autorizados para acceder al sistema de checador virtual';
COMMENT ON COLUMN dispositivos_autorizados.device_id IS 'ID único generado por la huella digital del dispositivo';
COMMENT ON COLUMN dispositivos_autorizados.nombre IS 'Nombre descriptivo del dispositivo (ej: PC Recepción, Laptop Administración)';
COMMENT ON COLUMN dispositivos_autorizados.user_agent IS 'User agent del navegador';
COMMENT ON COLUMN dispositivos_autorizados.screen IS 'Resolución de pantalla';
COMMENT ON COLUMN dispositivos_autorizados.timezone IS 'Zona horaria del dispositivo';
COMMENT ON COLUMN dispositivos_autorizados.language IS 'Idioma del navegador';
COMMENT ON COLUMN dispositivos_autorizados.platform IS 'Plataforma del sistema operativo';
COMMENT ON COLUMN dispositivos_autorizados.hardware_concurrency IS 'Número de núcleos de CPU';
COMMENT ON COLUMN dispositivos_autorizados.device_memory IS 'Memoria del dispositivo en GB';
COMMENT ON COLUMN dispositivos_autorizados.color_depth IS 'Profundidad de color de la pantalla';
COMMENT ON COLUMN dispositivos_autorizados.pixel_ratio IS 'Ratio de píxeles del dispositivo';
COMMENT ON COLUMN dispositivos_autorizados.activo IS 'Indica si el dispositivo está activo y autorizado';

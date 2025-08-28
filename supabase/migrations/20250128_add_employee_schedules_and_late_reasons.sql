-- Migración para agregar horarios individuales por empleado y razones de llegadas tardías
-- Fecha: 2025-01-28

-- 1. Crear tabla para horarios individuales de empleados
CREATE TABLE IF NOT EXISTS horarios_empleados (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    hora_entrada TIME NOT NULL DEFAULT '09:00:00',
    hora_salida TIME NOT NULL DEFAULT '19:00:00',
    tolerancia_minutos INTEGER NOT NULL DEFAULT 15,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice único parcial para asegurar que solo hay un horario activo por empleado
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_schedule_per_employee 
ON horarios_empleados (usuario_id) 
WHERE activo = true;

-- 2. Agregar campo para razón de llegada tardía en la tabla checadas
ALTER TABLE checadas 
ADD COLUMN IF NOT EXISTS razon_llegada_tardia TEXT;

-- 3. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_horarios_empleados_usuario_id ON horarios_empleados(usuario_id);
CREATE INDEX IF NOT EXISTS idx_horarios_empleados_activo ON horarios_empleados(activo);
CREATE INDEX IF NOT EXISTS idx_checadas_razon_llegada_tardia ON checadas(razon_llegada_tardia) WHERE razon_llegada_tardia IS NOT NULL;

-- 4. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Crear trigger para actualizar updated_at automáticamente en horarios_empleados
CREATE TRIGGER update_horarios_empleados_updated_at 
    BEFORE UPDATE ON horarios_empleados 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Habilitar RLS (Row Level Security) para horarios_empleados
ALTER TABLE horarios_empleados ENABLE ROW LEVEL SECURITY;

-- 7. Crear políticas de seguridad para horarios_empleados
-- Los administradores pueden gestionar todos los horarios
CREATE POLICY "Administradores pueden gestionar horarios" ON horarios_empleados
    FOR ALL USING (true);

-- Los empleados pueden ver solo su propio horario
CREATE POLICY "Empleados pueden ver su horario" ON horarios_empleados
    FOR SELECT USING (usuario_id = auth.uid());

-- 8. Función para obtener el horario activo de un empleado
CREATE OR REPLACE FUNCTION get_employee_schedule(employee_id UUID)
RETURNS TABLE (
    hora_entrada TIME,
    hora_salida TIME,
    tolerancia_minutos INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT he.hora_entrada, he.hora_salida, he.tolerancia_minutos
    FROM horarios_empleados he
    WHERE he.usuario_id = employee_id 
    AND he.activo = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 9. Función para verificar si una llegada es tardía considerando la tolerancia
CREATE OR REPLACE FUNCTION is_late_arrival(
    employee_id UUID,
    arrival_time TIME
) RETURNS BOOLEAN AS $$
DECLARE
    schedule_record RECORD;
    scheduled_time TIME;
    tolerance_minutes INTEGER;
    max_allowed_time TIME;
BEGIN
    -- Obtener el horario del empleado
    SELECT * INTO schedule_record FROM get_employee_schedule(employee_id);
    
    -- Si no hay horario configurado, usar valores por defecto
    IF schedule_record IS NULL THEN
        scheduled_time := '09:00:00'::TIME;
        tolerance_minutes := 15;
    ELSE
        scheduled_time := schedule_record.hora_entrada;
        tolerance_minutes := schedule_record.tolerancia_minutos;
    END IF;
    
    -- Calcular la hora máxima permitida con tolerancia
    max_allowed_time := scheduled_time + (tolerance_minutes || ' minutes')::INTERVAL;
    
    -- Verificar si la llegada es tardía
    RETURN arrival_time > max_allowed_time;
END;
$$ LANGUAGE plpgsql;

-- 10. Función para verificar si una salida es temprana
CREATE OR REPLACE FUNCTION is_early_departure(
    employee_id UUID,
    departure_time TIME
) RETURNS BOOLEAN AS $$
DECLARE
    schedule_record RECORD;
    scheduled_time TIME;
BEGIN
    -- Obtener el horario del empleado
    SELECT * INTO schedule_record FROM get_employee_schedule(employee_id);
    
    -- Si no hay horario configurado, usar valor por defecto
    IF schedule_record IS NULL THEN
        scheduled_time := '19:00:00'::TIME;
    ELSE
        scheduled_time := schedule_record.hora_salida;
    END IF;
    
    -- Verificar si la salida es temprana
    RETURN departure_time < scheduled_time;
END;
$$ LANGUAGE plpgsql;

-- 11. Insertar horarios por defecto para usuarios existentes
-- Solo insertar si el usuario no tiene ya un horario activo
INSERT INTO horarios_empleados (usuario_id, hora_entrada, hora_salida, tolerancia_minutos)
SELECT u.id, '09:00:00'::TIME, '19:00:00'::TIME, 15
FROM usuarios u
WHERE u.activo = true
AND NOT EXISTS (
    SELECT 1 FROM horarios_empleados he 
    WHERE he.usuario_id = u.id AND he.activo = true
);

-- 12. Comentarios para documentación
COMMENT ON TABLE horarios_empleados IS 'Tabla que almacena los horarios individuales de cada empleado';
COMMENT ON COLUMN horarios_empleados.usuario_id IS 'ID del usuario/empleado';
COMMENT ON COLUMN horarios_empleados.hora_entrada IS 'Hora de entrada programada para el empleado';
COMMENT ON COLUMN horarios_empleados.hora_salida IS 'Hora de salida programada para el empleado';
COMMENT ON COLUMN horarios_empleados.tolerancia_minutos IS 'Minutos de tolerancia para llegadas tardías';
COMMENT ON COLUMN horarios_empleados.activo IS 'Indica si este horario está activo para el empleado';
COMMENT ON COLUMN checadas.razon_llegada_tardia IS 'Razón proporcionada por el empleado en caso de llegada tardía';

COMMENT ON FUNCTION get_employee_schedule(UUID) IS 'Obtiene el horario activo de un empleado específico';
COMMENT ON FUNCTION is_late_arrival(UUID, TIME) IS 'Verifica si una hora de llegada es tardía considerando la tolerancia del empleado';
COMMENT ON FUNCTION is_early_departure(UUID, TIME) IS 'Verifica si una hora de salida es temprana para un empleado';

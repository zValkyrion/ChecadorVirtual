import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Tipos para TypeScript
export interface Usuario {
  id: string;
  nombre: string;
  usuario: string;
  contraseña: string;
  rol: 'empleado' | 'admin';
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Checada {
  id: string;
  usuario_id: string;
  fecha: string;
  hora_entrada: string | null;
  hora_salida: string | null;
  razon_llegada_tardia: string | null;
  created_at: string;
  updated_at: string;
  usuarios?: Usuario;
}

export interface HorarioEmpleado {
  id: string;
  usuario_id: string;
  hora_entrada: string;
  hora_salida: string;
  tolerancia_minutos: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
  usuarios?: Usuario;
}

export interface DispositivoAutorizado {
  id: string;
  device_id: string;
  nombre: string;
  user_agent: string;
  screen: string;
  timezone: string;
  language: string;
  platform: string;
  hardware_concurrency: number;
  device_memory?: number;
  color_depth: number;
  pixel_ratio: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

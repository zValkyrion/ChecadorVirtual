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
  created_at: string;
  updated_at: string;
  usuarios?: Usuario;
}
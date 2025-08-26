// Utilidad para autenticación basada en dispositivo
export interface DeviceFingerprint {
  id: string;
  userAgent: string;
  screen: string;
  timezone: string;
  language: string;
  platform: string;
  hardwareConcurrency: number;
  deviceMemory?: number;
  colorDepth: number;
  pixelRatio: number;
}

// Generar huella digital del dispositivo
export const generateDeviceFingerprint = async (): Promise<DeviceFingerprint> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Generar una huella digital única basada en el canvas
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint test', 2, 2);
  }
  
  const canvasFingerprint = canvas.toDataURL();
  
  // Recopilar información del dispositivo
  const deviceInfo = {
    userAgent: navigator.userAgent,
    screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: (navigator as any).deviceMemory || undefined,
    colorDepth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio,
    canvas: canvasFingerprint
  };

  // Generar ID único basado en la información del dispositivo
  const fingerprint = await generateHash(JSON.stringify(deviceInfo));
  
  return {
    id: fingerprint,
    userAgent: deviceInfo.userAgent,
    screen: deviceInfo.screen,
    timezone: deviceInfo.timezone,
    language: deviceInfo.language,
    platform: deviceInfo.platform,
    hardwareConcurrency: deviceInfo.hardwareConcurrency,
    deviceMemory: deviceInfo.deviceMemory,
    colorDepth: deviceInfo.colorDepth,
    pixelRatio: deviceInfo.pixelRatio
  };
};

// Generar hash usando Web Crypto API
const generateHash = async (data: string): Promise<string> => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Importar Supabase
import { supabase, DispositivoAutorizado } from '../lib/supabase';

// Verificar si el dispositivo está autorizado
export const isDeviceAuthorized = async (): Promise<boolean> => {
  try {
    const currentFingerprint = await generateDeviceFingerprint();
    
    // Consultar la base de datos para verificar si el dispositivo está autorizado
    const { data: authorizedDevices, error } = await supabase
      .from('dispositivos_autorizados')
      .select('device_id')
      .eq('device_id', currentFingerprint.id)
      .eq('activo', true);

    if (error) {
      console.error('Error consultando dispositivos autorizados:', error);
      // Si hay error en la consulta, verificar si hay dispositivos configurados
      const { count, error: countError } = await supabase
        .from('dispositivos_autorizados')
        .select('*', { count: 'exact', head: true })
        .eq('activo', true);
      
      // Si no hay dispositivos configurados o hay error, permitir acceso para configuración inicial
      return countError !== null || count === 0;
    }

    // Si no hay dispositivos autorizados configurados, permitir acceso para configuración inicial
    if (!authorizedDevices || authorizedDevices.length === 0) {
      const { count } = await supabase
        .from('dispositivos_autorizados')
        .select('*', { count: 'exact', head: true })
        .eq('activo', true);
      
      return count === 0;
    }
    
    return authorizedDevices.length > 0;
  } catch (error) {
    console.error('Error verificando autorización del dispositivo:', error);
    return true; // En caso de error, permitir acceso para configuración inicial
  }
};

// Autorizar el dispositivo actual
export const authorizeCurrentDevice = async (nombre?: string): Promise<string> => {
  try {
    const fingerprint = await generateDeviceFingerprint();
    
    // Verificar si el dispositivo ya está autorizado
    const { data: existingDevice } = await supabase
      .from('dispositivos_autorizados')
      .select('*')
      .eq('device_id', fingerprint.id)
      .eq('activo', true)
      .single();

    if (existingDevice) {
      return fingerprint.id;
    }
    
    // Generar nombre automático si no se proporciona
    const deviceName = nombre || `Dispositivo ${fingerprint.platform} - ${new Date().toLocaleDateString()}`;
    
    // Insertar el nuevo dispositivo en la base de datos
    const { error } = await supabase
      .from('dispositivos_autorizados')
      .insert({
        device_id: fingerprint.id,
        nombre: deviceName,
        user_agent: fingerprint.userAgent,
        screen: fingerprint.screen,
        timezone: fingerprint.timezone,
        language: fingerprint.language,
        platform: fingerprint.platform,
        hardware_concurrency: fingerprint.hardwareConcurrency,
        device_memory: fingerprint.deviceMemory,
        color_depth: fingerprint.colorDepth,
        pixel_ratio: fingerprint.pixelRatio,
        activo: true
      });

    if (error) {
      console.error('Error insertando dispositivo autorizado:', error);
      throw new Error('No se pudo autorizar el dispositivo: ' + error.message);
    }
    
    return fingerprint.id;
  } catch (error) {
    console.error('Error autorizando dispositivo:', error);
    throw error;
  }
};

// Obtener todos los dispositivos autorizados
export const getAuthorizedDevices = async (): Promise<DispositivoAutorizado[]> => {
  try {
    const { data: devices, error } = await supabase
      .from('dispositivos_autorizados')
      .select('*')
      .eq('activo', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo dispositivos autorizados:', error);
      return [];
    }

    return devices || [];
  } catch (error) {
    console.error('Error obteniendo dispositivos autorizados:', error);
    return [];
  }
};

// Obtener información del dispositivo autorizado (mantener compatibilidad)
export const getAuthorizedDeviceInfo = async (): Promise<DispositivoAutorizado | null> => {
  const devices = await getAuthorizedDevices();
  return devices.length > 0 ? devices[0] : null;
};

// Revocar autorización de un dispositivo específico
export const revokeDeviceAuthorization = async (deviceId?: string): Promise<void> => {
  try {
    if (deviceId) {
      // Revocar dispositivo específico
      const { error } = await supabase
        .from('dispositivos_autorizados')
        .update({ activo: false })
        .eq('device_id', deviceId);

      if (error) {
        console.error('Error revocando autorización del dispositivo:', error);
        throw new Error('No se pudo revocar la autorización del dispositivo: ' + error.message);
      }
    } else {
      // Revocar todos los dispositivos
      const { error } = await supabase
        .from('dispositivos_autorizados')
        .update({ activo: false })
        .eq('activo', true);

      if (error) {
        console.error('Error revocando todas las autorizaciones:', error);
        throw new Error('No se pudieron revocar las autorizaciones: ' + error.message);
      }
    }
  } catch (error) {
    console.error('Error en revokeDeviceAuthorization:', error);
    throw error;
  }
};

// Verificar si hay dispositivos autorizados configurados
export const hasAuthorizedDevice = async (): Promise<boolean> => {
  try {
    const { count, error } = await supabase
      .from('dispositivos_autorizados')
      .select('*', { count: 'exact', head: true })
      .eq('activo', true);
    
    if (error) {
      console.error('Error verificando dispositivos autorizados:', error);
      return false;
    }
    
    return (count || 0) > 0;
  } catch (error) {
    console.error('Error verificando dispositivos autorizados:', error);
    return false;
  }
};

// Obtener información del dispositivo actual
export const getCurrentDeviceInfo = async (): Promise<DeviceFingerprint> => {
  return await generateDeviceFingerprint();
};

// Eliminar dispositivo autorizado permanentemente
export const deleteAuthorizedDevice = async (deviceId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('dispositivos_autorizados')
      .delete()
      .eq('device_id', deviceId);

    if (error) {
      console.error('Error eliminando dispositivo autorizado:', error);
      throw new Error('No se pudo eliminar el dispositivo autorizado: ' + error.message);
    }
  } catch (error) {
    console.error('Error en deleteAuthorizedDevice:', error);
    throw error;
  }
};

// Actualizar nombre de dispositivo autorizado
export const updateDeviceName = async (deviceId: string, newName: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('dispositivos_autorizados')
      .update({ nombre: newName })
      .eq('device_id', deviceId);

    if (error) {
      console.error('Error actualizando nombre del dispositivo:', error);
      throw new Error('No se pudo actualizar el nombre del dispositivo: ' + error.message);
    }
  } catch (error) {
    console.error('Error en updateDeviceName:', error);
    throw error;
  }
};

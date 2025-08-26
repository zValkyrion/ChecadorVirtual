import bcrypt from 'bcryptjs';

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Error comparing password:', error);
    return false;
  }
};

export const formatTime = (date: Date): string => {
  // Configurar zona horaria de Ciudad de México
  return date.toLocaleTimeString('es-MX', { 
    timeZone: 'America/Mexico_City',
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export const formatDate = (date: Date): string => {
  // Configurar zona horaria de Ciudad de México
  return date.toLocaleDateString('es-MX', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// Función para verificar llegadas tarde (después de las 9:00 AM)
export const isLateEntry = (entryTime: string, cutoffTime: string = '09:00'): boolean => {
  const [entryHour, entryMinute] = entryTime.split(':').map(Number);
  const [cutoffHour, cutoffMinute] = cutoffTime.split(':').map(Number);
  
  const entryInMinutes = entryHour * 60 + entryMinute;
  const cutoffInMinutes = cutoffHour * 60 + cutoffMinute;
  
  return entryInMinutes > cutoffInMinutes;
};

// Función para verificar salidas temprano (antes de las 7:00 PM)
export const isEarlyExit = (exitTime: string, minimumTime: string = '19:00'): boolean => {
  const [exitHour, exitMinute] = exitTime.split(':').map(Number);
  const [minimumHour, minimumMinute] = minimumTime.split(':').map(Number);
  
  const exitInMinutes = exitHour * 60 + exitMinute;
  const minimumInMinutes = minimumHour * 60 + minimumMinute;
  
  return exitInMinutes < minimumInMinutes;
};

// Función para obtener la fecha/hora actual en zona horaria de Ciudad de México
export const getCurrentMexicoTime = (): Date => {
  return new Date(new Date().toLocaleString("en-US", {timeZone: "America/Mexico_City"}));
};

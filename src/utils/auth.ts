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

// Función para verificar llegadas tarde con horario personalizado y tolerancia
export const isLateEntryWithSchedule = (
  entryTime: string, 
  scheduledTime: string = '09:00', 
  toleranceMinutes: number = 15
): boolean => {
  const [entryHour, entryMinute] = entryTime.split(':').map(Number);
  const [scheduledHour, scheduledMinute] = scheduledTime.split(':').map(Number);
  
  const entryInMinutes = entryHour * 60 + entryMinute;
  const scheduledInMinutes = scheduledHour * 60 + scheduledMinute;
  const maxAllowedMinutes = scheduledInMinutes + toleranceMinutes;
  
  return entryInMinutes > maxAllowedMinutes;
};

// Función para verificar llegadas tarde (después de las 9:00 AM) - mantener compatibilidad
export const isLateEntry = (entryTime: string, cutoffTime: string = '09:00'): boolean => {
  return isLateEntryWithSchedule(entryTime, cutoffTime, 0);
};

// Función para verificar salidas temprano con horario personalizado
export const isEarlyExitWithSchedule = (exitTime: string, scheduledTime: string = '19:00'): boolean => {
  const [exitHour, exitMinute] = exitTime.split(':').map(Number);
  const [scheduledHour, scheduledMinute] = scheduledTime.split(':').map(Number);
  
  const exitInMinutes = exitHour * 60 + exitMinute;
  const scheduledInMinutes = scheduledHour * 60 + scheduledMinute;
  
  return exitInMinutes < scheduledInMinutes;
};

// Función para verificar salidas temprano (antes de las 7:00 PM) - mantener compatibilidad
export const isEarlyExit = (exitTime: string, minimumTime: string = '19:00'): boolean => {
  return isEarlyExitWithSchedule(exitTime, minimumTime);
};

// Función para convertir tiempo de formato HH:MM:SS a HH:MM
export const formatTimeToHHMM = (timeString: string): string => {
  if (!timeString) return '';
  return timeString.substring(0, 5); // Toma solo HH:MM
};

// Función para obtener solo la hora de un timestamp
export const extractTimeFromTimestamp = (timestamp: string): string => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return formatTime(date);
};

// Función para obtener la fecha/hora actual en zona horaria de Ciudad de México
export const getCurrentMexicoTime = (): Date => {
  return new Date(new Date().toLocaleString("en-US", {timeZone: "America/Mexico_City"}));
};

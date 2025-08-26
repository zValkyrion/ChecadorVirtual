// Utilidades para manejo de sesiones
export const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
export const INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2 horas de inactividad

export interface SessionData {
  user: any;
  loginTime: number;
  lastActivity: number;
}

export const saveSession = (user: any): void => {
  try {
    const now = new Date().getTime();
    const sessionData: SessionData = {
      user,
      loginTime: now,
      lastActivity: now
    };
    
    localStorage.setItem('adminSession', JSON.stringify(sessionData));
    localStorage.setItem('sessionExpiry', (now + SESSION_DURATION).toString());
  } catch (error) {
    console.error('Error al guardar sesión:', error);
  }
};

export const getSession = (): SessionData | null => {
  try {
    const sessionStr = localStorage.getItem('adminSession');
    const expiryStr = localStorage.getItem('sessionExpiry');
    
    if (!sessionStr || !expiryStr) {
      return null;
    }
    
    const now = new Date().getTime();
    const expiryTime = parseInt(expiryStr);
    const sessionData: SessionData = JSON.parse(sessionStr);
    
    // Verificar si la sesión ha expirado
    if (now > expiryTime) {
      clearSession();
      return null;
    }
    
    // Verificar inactividad
    if (now - sessionData.lastActivity > INACTIVITY_TIMEOUT) {
      clearSession();
      return null;
    }
    
    return sessionData;
  } catch (error) {
    console.error('Error al recuperar sesión:', error);
    clearSession();
    return null;
  }
};

export const updateLastActivity = (): void => {
  try {
    const sessionStr = localStorage.getItem('adminSession');
    if (sessionStr) {
      const sessionData: SessionData = JSON.parse(sessionStr);
      sessionData.lastActivity = new Date().getTime();
      localStorage.setItem('adminSession', JSON.stringify(sessionData));
    }
  } catch (error) {
    console.error('Error al actualizar actividad:', error);
  }
};

export const clearSession = (): void => {
  try {
    localStorage.removeItem('adminSession');
    localStorage.removeItem('sessionExpiry');
    // Mantener compatibilidad con el sistema anterior
    localStorage.removeItem('adminUser');
  } catch (error) {
    console.error('Error al limpiar sesión:', error);
  }
};

export const isSessionValid = (): boolean => {
  return getSession() !== null;
};

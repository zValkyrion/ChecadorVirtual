import React, { useState, useEffect, useCallback } from 'react';
import { Settings } from 'lucide-react';
import CheckinForm from './components/CheckinForm';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import DeviceNotAuthorized from './components/DeviceNotAuthorized';
import { Usuario } from './lib/supabase';
import { getSession, saveSession, clearSession, updateLastActivity } from './utils/session';
import { isDeviceAuthorized, generateDeviceFingerprint } from './utils/deviceAuth';

function App() {
  const [adminUser, setAdminUser] = useState<Usuario | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deviceAuthorized, setDeviceAuthorized] = useState<boolean | null>(null);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');

  // Función para verificar y actualizar la sesión
  const checkSession = useCallback(() => {
    const sessionData = getSession();
    if (sessionData) {
      setAdminUser(sessionData.user);
      updateLastActivity();
      return true;
    } else {
      setAdminUser(null);
      return false;
    }
  }, []);

  // Verificar sesión guardada y autorización de dispositivo al cargar la aplicación
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Verificar autorización del dispositivo
        const authorized = await isDeviceAuthorized();
        const fingerprint = await generateDeviceFingerprint();
        
        setDeviceAuthorized(authorized);
        setCurrentDeviceId(fingerprint.id);

        // Verificar sesión solo si el dispositivo está autorizado o es admin
        const sessionData = getSession();
        if (sessionData) {
          setAdminUser(sessionData.user);
        } else {
          // Verificar compatibilidad con el sistema anterior
          const savedUser = localStorage.getItem('adminUser');
          const sessionExpiry = localStorage.getItem('sessionExpiry');
          
          if (savedUser && sessionExpiry) {
            const now = new Date().getTime();
            const expiryTime = parseInt(sessionExpiry);
            
            if (now < expiryTime) {
              const user = JSON.parse(savedUser);
              setAdminUser(user);
              // Migrar al nuevo sistema
              saveSession(user);
            }
          }
        }
      } catch (error) {
        console.error('Error al inicializar aplicación:', error);
        clearSession();
        setDeviceAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Verificar sesión periódicamente y detectar actividad
  useEffect(() => {
    if (!adminUser) return;

    // Verificar sesión cada minuto
    const sessionInterval = setInterval(() => {
      if (!checkSession()) {
        // Sesión expirada, mostrar mensaje y redirigir
        alert('Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente.');
      }
    }, 60000); // 1 minuto

    // Detectar actividad del usuario
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      updateLastActivity();
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      clearInterval(sessionInterval);
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [adminUser, checkSession]);

  const handleAdminLogin = (user: Usuario) => {
    setAdminUser(user);
    saveSession(user);
  };

  const handleAdminLogout = () => {
    setAdminUser(null);
    clearSession();
  };

  // Mostrar loading mientras se verifica la sesión
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-400"></div>
      </div>
    );
  }

  // Si hay un usuario admin logueado, mostrar el dashboard
  if (adminUser) {
    return <AdminDashboard user={adminUser} onLogout={handleAdminLogout} />;
  }

  // Mostrar la aplicación normal - TODOS pueden ver la página principal
  // La validación de dispositivo se hace en el momento del check-in
  return (
    <div className="relative">
      {/* Admin Login Button */}
      <button
        onClick={() => setShowAdminLogin(true)}
        className="fixed top-4 right-4 z-40 bg-white/90 backdrop-blur-sm text-gray-600 p-3 rounded-full shadow-lg hover:bg-white hover:text-pink-400 transition-all duration-200 hover:scale-110"
        title="Acceso Administrador"
      >
        <Settings className="h-5 w-5" />
      </button>

      {/* Main Checkin Form */}
      <CheckinForm />

      {/* Admin Login Modal */}
      <AdminLogin
        onLogin={handleAdminLogin}
        isVisible={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
      />
    </div>
  );
}

export default App;

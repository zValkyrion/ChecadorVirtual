import React, { useState, useEffect } from 'react';
import { Users, Clock, AlertCircle, Calendar, Plus, Trash2, Edit, LogOut, Filter, Shield, Computer, Settings } from 'lucide-react';
import { supabase, Usuario, Checada, HorarioEmpleado } from '../lib/supabase';
import { hashPassword, formatDate, formatTime, isLateEntry, isEarlyExit, formatTimeToHHMM, isLateEntryWithSchedule, isEarlyExitWithSchedule } from '../utils/auth';
import { 
  generateDeviceFingerprint, 
  authorizeCurrentDevice, 
  getAuthorizedDevices, 
  revokeDeviceAuthorization, 
  hasAuthorizedDevice,
  getCurrentDeviceInfo
} from '../utils/deviceAuth';
import AdvancedReports from './AdvancedReports';

interface AdminDashboardProps {
  user: Usuario;
  onLogout: () => void;
}

// Componente para la pestaña de seguridad
const SecurityTab: React.FC = () => {
  const [currentDeviceInfo, setCurrentDeviceInfo] = useState<any>(null);
  const [authorizedDevices, setAuthorizedDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasDevices, setHasDevices] = useState(false);

  useEffect(() => {
    loadDeviceInfo();
  }, []);

  const loadDeviceInfo = async () => {
    try {
      const current = await generateDeviceFingerprint();
      const devices = await getAuthorizedDevices();
      const hasAuth = await hasAuthorizedDevice();
      
      setCurrentDeviceInfo(current);
      setAuthorizedDevices(devices);
      setHasDevices(hasAuth);
    } catch (error) {
      console.error('Error loading device info:', error);
    }
  };

  const handleAuthorizeDevice = async () => {
    if (!confirm('¿Estás seguro de que deseas autorizar este dispositivo?.')) {
      return;
    }

    setLoading(true);
    try {
      await authorizeCurrentDevice();
      await loadDeviceInfo();
      alert('Dispositivo autorizado exitosamente');
    } catch (error) {
      console.error('Error authorizing device:', error);
      alert('Error al autorizar dispositivo');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAuthorization = async () => {
    if (!confirm('¿Estás seguro de que deseas revocar TODAS las autorizaciones? Esto bloqueará el acceso al sistema para todos los dispositivos.')) {
      return;
    }

    try {
      await revokeDeviceAuthorization();
      await loadDeviceInfo();
      alert('Todas las autorizaciones han sido revocadas exitosamente');
    } catch (error) {
      console.error('Error revocando autorización:', error);
      alert('Error al revocar autorizaciones');
    }
  };

  const handleRevokeDeviceAuthorization = async (deviceId: string) => {
    if (!confirm('¿Estás seguro de que deseas revocar la autorización de este dispositivo específico?')) {
      return;
    }

    try {
      await revokeDeviceAuthorization(deviceId);
      await loadDeviceInfo();
      alert('Autorización del dispositivo revocada exitosamente');
    } catch (error) {
      console.error('Error revocando autorización del dispositivo:', error);
      alert('Error al revocar autorización del dispositivo');
    }
  };

  const isCurrentDeviceAuthorized = authorizedDevices.length > 0 && currentDeviceInfo && 
    authorizedDevices.some(device => device.device_id === currentDeviceInfo.id);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Seguridad del Sistema</h2>
      </div>

      {/* Estado de Seguridad */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">Estado de Autenticación por Dispositivo</h3>
        </div>
        
        <div className={`p-4 rounded-lg border-2 ${
          hasDevices 
            ? isCurrentDeviceAuthorized 
              ? 'border-green-200 bg-green-50' 
              : 'border-red-200 bg-red-50'
            : 'border-yellow-200 bg-yellow-50'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {hasDevices ? (
              isCurrentDeviceAuthorized ? (
                <>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-green-800">Dispositivo Autorizado</span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="font-medium text-red-800">Dispositivo No Autorizado</span>
                </>
              )
            ) : (
              <>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="font-medium text-yellow-800">Sin Configurar</span>
              </>
            )}
          </div>
          <p className="text-sm text-gray-600">
            {hasDevices 
              ? isCurrentDeviceAuthorized
                ? 'Este dispositivo está autorizado para acceder al sistema.'
                : 'Este dispositivo NO está autorizado. Solo dispositivos autorizados pueden acceder al sistema.'
              : 'No hay ningún dispositivo autorizado configurado. El sistema está abierto a cualquier dispositivo.'
            }
          </p>
        </div>
      </div>

      {/* Información del Dispositivo Actual */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <Computer className="h-6 w-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-800">Dispositivo Actual</h3>
        </div>
        
        {currentDeviceInfo && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">ID del Dispositivo</label>
                <code className="block text-xs bg-gray-100 p-3 rounded border break-all font-mono">
                  {currentDeviceInfo.id}
                </code>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plataforma</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{currentDeviceInfo.platform}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resolución de Pantalla</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{currentDeviceInfo.screen}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zona Horaria</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{currentDeviceInfo.timezone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Idioma</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{currentDeviceInfo.language}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Núcleos de CPU</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{currentDeviceInfo.hardwareConcurrency}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dispositivos Autorizados */}
      {authorizedDevices.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-800">Dispositivos Autorizados ({authorizedDevices.length})</h3>
            </div>
            <button
              onClick={handleRevokeAuthorization}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Revocar Todas las Autorizaciones</span>
              <span className="sm:hidden">Revocar Todas</span>
            </button>
          </div>
          
          <div className="space-y-4">
            {authorizedDevices.map((device, index) => (
              <div key={device.device_id || device.id || index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      currentDeviceInfo && device.device_id === currentDeviceInfo.id 
                        ? 'bg-green-500' 
                        : 'bg-gray-400'
                    }`}></div>
                    <span className="font-medium text-gray-800">
                      {device.nombre || 'Sin nombre'}
                      {currentDeviceInfo && device.device_id === currentDeviceInfo.id && (
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Dispositivo Actual
                        </span>
                      )}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRevokeDeviceAuthorization(device.device_id)}
                    className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                    title="Revocar autorización de este dispositivo"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Revocar</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">ID del Dispositivo</label>
                    <code className="block text-xs bg-gray-100 p-3 rounded border break-all font-mono">
                      {device.device_id || device.id}
                    </code>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plataforma</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{device.platform}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resolución de Pantalla</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{device.screen}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zona Horaria</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{device.timezone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Autorización</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {device.created_at ? new Date(device.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'No disponible'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Acciones de Seguridad</h3>
        
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start gap-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
            <Shield className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-blue-900 mb-1">Autorizar Este Dispositivo</h4>
              <p className="text-sm text-blue-700 mb-3">
                Autoriza este dispositivo para acceder al sistema. Solo dispositivos autorizados podrán usar el checador virtual.
              </p>
              <button
                onClick={handleAuthorizeDevice}
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Autorizando...' : 'Autorizar Dispositivo'}
              </button>
            </div>
          </div>

          <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <AlertCircle className="h-6 w-6 text-yellow-600 mt-1 flex-shrink-0" />
              <div className="min-w-0">
                <h4 className="font-medium text-yellow-900 mb-2">Importante</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Se pueden autorizar múltiples dispositivos</li>
                  <li>• Los empleados solo pueden hacer check-in desde dispositivos autorizados</li>
                  <li>• Los administradores pueden acceder desde cualquier dispositivo</li>
                  <li>• Los dispositivos se almacenan en la base de datos de forma segura</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [checadas, setChecadas] = useState<Checada[]>([]);
  const [horarios, setHorarios] = useState<HorarioEmpleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'schedules' | 'reports' | 'security'>('dashboard');
  const [dateFilter, setDateFilter] = useState({
    from: '',
    to: ''
  });

  // Estados para gestión de usuarios
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [newUser, setNewUser] = useState({
    nombre: '',
    usuario: '',
    contraseña: '',
    rol: 'empleado' as 'empleado' | 'admin'
  });

  // Estados para gestión de horarios
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<HorarioEmpleado | null>(null);
  const [newSchedule, setNewSchedule] = useState({
    usuario_id: '',
    hora_entrada: '09:00',
    hora_salida: '19:00',
    tolerancia_minutos: 15
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar usuarios
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (usuariosError) throw usuariosError;

      // Cargar checadas con información de usuarios
      const { data: checadasData, error: checadasError } = await supabase
        .from('checadas')
        .select(`
          *,
          usuarios (
            id,
            nombre,
            usuario
          )
        `)
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false });

      if (checadasError) throw checadasError;

      // Cargar horarios con información de usuarios
      const { data: horariosData, error: horariosError } = await supabase
        .from('horarios_empleados')
        .select(`
          *,
          usuarios (
            id,
            nombre,
            usuario
          )
        `)
        .eq('activo', true)
        .order('created_at', { ascending: false });

      if (horariosError) throw horariosError;

      setUsuarios(usuariosData || []);
      setChecadas(checadasData || []);
      setHorarios(horariosData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación: para crear usuario nuevo, todos los campos son requeridos
    // Para editar, solo contraseña es opcional
    if (!newUser.nombre || !newUser.usuario) {
      alert('Nombre y usuario son requeridos');
      return;
    }
    
    if (!editingUser && !newUser.contraseña) {
      alert('La contraseña es requerida para usuarios nuevos');
      return;
    }

    try {
      if (editingUser) {
        // Actualizar usuario existente
        const updateData: any = {
          nombre: newUser.nombre,
          usuario: newUser.usuario,
          rol: newUser.rol
        };

        // Solo actualizar contraseña si se proporcionó una nueva
        if (newUser.contraseña.trim()) {
          updateData.contraseña = await hashPassword(newUser.contraseña);
        }

        const { error } = await supabase
          .from('usuarios')
          .update(updateData)
          .eq('id', editingUser.id);

        if (error) throw error;
      } else {
        // Crear nuevo usuario
        const hashedPassword = await hashPassword(newUser.contraseña);
        
        const { error } = await supabase
          .from('usuarios')
          .insert({
            nombre: newUser.nombre,
            usuario: newUser.usuario,
            contraseña: hashedPassword,
            rol: newUser.rol
          });

        if (error) throw error;
      }

      setNewUser({ nombre: '', usuario: '', contraseña: '', rol: 'empleado' });
      setEditingUser(null);
      setShowUserForm(false);
      loadData();
      
      alert(editingUser ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente');
    } catch (error: any) {
      console.error('Error creating/updating user:', error);
      
      // Manejar errores específicos
      if (error?.code === '23505') {
        alert('Error: Ya existe un usuario con ese nombre de usuario');
      } else {
        alert(`Error al ${editingUser ? 'actualizar' : 'crear'} usuario: ${error?.message || 'Error desconocido'}`);
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) return;

    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ activo: false })
        .eq('id', userId);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchedule.usuario_id || !newSchedule.hora_entrada || !newSchedule.hora_salida) return;

    try {
      if (editingSchedule) {
        // Actualizar horario existente
        const { error } = await supabase
          .from('horarios_empleados')
          .update({
            hora_entrada: newSchedule.hora_entrada + ':00',
            hora_salida: newSchedule.hora_salida + ':00',
            tolerancia_minutos: newSchedule.tolerancia_minutos
          })
          .eq('id', editingSchedule.id);

        if (error) throw error;
      } else {
        // Desactivar horarios existentes del usuario
        await supabase
          .from('horarios_empleados')
          .update({ activo: false })
          .eq('usuario_id', newSchedule.usuario_id)
          .eq('activo', true);

        // Crear nuevo horario
        const { error } = await supabase
          .from('horarios_empleados')
          .insert({
            usuario_id: newSchedule.usuario_id,
            hora_entrada: newSchedule.hora_entrada + ':00',
            hora_salida: newSchedule.hora_salida + ':00',
            tolerancia_minutos: newSchedule.tolerancia_minutos
          });

        if (error) throw error;
      }

      setNewSchedule({ usuario_id: '', hora_entrada: '09:00', hora_salida: '19:00', tolerancia_minutos: 15 });
      setEditingSchedule(null);
      setShowScheduleForm(false);
      loadData();
    } catch (error) {
      console.error('Error creating/updating schedule:', error);
      alert('Error al guardar horario');
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este horario?')) return;

    try {
      const { error } = await supabase
        .from('horarios_empleados')
        .update({ activo: false })
        .eq('id', scheduleId);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  // Filtrar checadas por fecha
  const filteredChecadas = checadas.filter(checada => {
    if (!dateFilter.from && !dateFilter.to) return true;
    const checadaDate = new Date(checada.fecha);
    const fromDate = dateFilter.from ? new Date(dateFilter.from) : null;
    const toDate = dateFilter.to ? new Date(dateFilter.to) : null;

    if (fromDate && checadaDate < fromDate) return false;
    if (toDate && checadaDate > toDate) return false;
    return true;
  });

  // Función para verificar llegadas tardías con horarios individuales
  const isLateArrivalWithSchedule = (checada: Checada): boolean => {
    if (!checada.hora_entrada) return false;
    
    const horario = horarios.find(h => h.usuario_id === checada.usuario_id);
    const entryTime = formatTime(new Date(checada.hora_entrada));
    
    if (horario) {
      const scheduledTime = formatTimeToHHMM(horario.hora_entrada);
      return isLateEntryWithSchedule(entryTime, scheduledTime, horario.tolerancia_minutos);
    } else {
      return isLateEntryWithSchedule(entryTime, '09:00', 15);
    }
  };

  // Función para verificar salidas tempranas con horarios individuales
  const isEarlyDepartureWithSchedule = (checada: Checada): boolean => {
    if (!checada.hora_salida) return false;
    
    const horario = horarios.find(h => h.usuario_id === checada.usuario_id);
    const exitTime = formatTime(new Date(checada.hora_salida));
    
    if (horario) {
      const scheduledTime = formatTimeToHHMM(horario.hora_salida);
      return isEarlyExitWithSchedule(exitTime, scheduledTime);
    } else {
      return isEarlyExitWithSchedule(exitTime, '19:00');
    }
  };

  // Estadísticas
  const stats = {
    totalUsuarios: usuarios.length,
    checadasHoy: checadas.filter(c => c.fecha === new Date().toISOString().split('T')[0]).length,
    llegadasTarde: filteredChecadas.filter(c => isLateArrivalWithSchedule(c)).length,
    salidasTemprano: filteredChecadas.filter(c => isEarlyDepartureWithSchedule(c)).length,
    usuariosActivos: usuarios.filter(u => u.activo).length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-pink-400 to-pink-500 rounded-lg w-10 h-10 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Panel de Asistencias</h1>
                <p className="text-sm text-gray-600">Bienvenido/a, {user.nombre}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 sm:gap-4 mb-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Clock },
            { id: 'users', label: 'Usuarios', icon: Users },
            { id: 'schedules', label: 'Horarios', icon: Settings },
            { id: 'reports', label: 'Reportes', icon: Calendar },
            { id: 'security', label: 'Seguridad', icon: Shield }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                activeTab === id
                  ? 'bg-pink-400 text-white'
                  : 'bg-white text-gray-700 hover:bg-pink-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">
                {id === 'dashboard' ? 'Panel' : 
                 id === 'users' ? 'Users' : 
                 id === 'reports' ? 'Reports' : 
                 'Security'}
              </span>
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 rounded-lg p-3">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Usuarios</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.totalUsuarios}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 rounded-lg p-3">
                    <Clock className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Checadas Hoy</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.checadasHoy}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 rounded-lg p-3">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Llegadas Tarde</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.llegadasTarde}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 rounded-lg p-3">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Salidas Temprano</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.salidasTemprano}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 rounded-lg p-3">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Usuarios Activos</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.usuariosActivos}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-800">Actividad Reciente</h2>
              </div>
              <div className="divide-y">
                {filteredChecadas.slice(0, 10).map((checada) => (
                  <div key={checada.id} className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-pink-100 rounded-full w-10 h-10 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-pink-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {checada.usuarios?.nombre || 'Usuario desconocido'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDate(new Date(checada.fecha))}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {checada.hora_entrada && (
                        <div className="text-sm">
                          <span className="text-green-600">Entrada: </span>
                          <span className={isLateArrivalWithSchedule(checada) ? 'text-red-600 font-semibold' : ''}>
                            {formatTime(new Date(checada.hora_entrada))}
                          </span>
                        </div>
                      )}
                      {checada.hora_salida && (
                        <div className="text-sm">
                          <span className="text-red-600">Salida: </span>
                          {formatTime(new Date(checada.hora_salida))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h2>
              <button
                onClick={() => setShowUserForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-pink-400 text-white rounded-lg hover:bg-pink-500 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Nuevo Usuario
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usuarios.map((usuario) => (
                      <tr key={usuario.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {usuario.usuario}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{usuario.nombre}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            usuario.rol === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {usuario.rol}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            usuario.activo 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {usuario.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingUser(usuario);
                                setNewUser({
                                  nombre: usuario.nombre,
                                  usuario: usuario.usuario,
                                  contraseña: '',
                                  rol: usuario.rol
                                });
                                setShowUserForm(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {usuario.id !== user.id && (
                              <button
                                onClick={() => handleDeleteUser(usuario.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <AdvancedReports 
            usuarios={usuarios} 
            checadas={checadas} 
            onRefresh={loadData}
          />
        )}

        {/* Schedules Tab */}
        {activeTab === 'schedules' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Gestión de Horarios</h2>
              <button
                onClick={() => setShowScheduleForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-pink-400 text-white rounded-lg hover:bg-pink-500 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Nuevo Horario
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Empleado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hora Entrada
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hora Salida
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tolerancia
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {horarios.map((horario) => (
                      <tr key={horario.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {horario.usuarios?.nombre || 'Usuario desconocido'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {horario.usuarios?.usuario}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatTimeToHHMM(horario.hora_entrada)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatTimeToHHMM(horario.hora_salida)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {horario.tolerancia_minutos} min
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            horario.activo 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {horario.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingSchedule(horario);
                                setNewSchedule({
                                  usuario_id: horario.usuario_id,
                                  hora_entrada: formatTimeToHHMM(horario.hora_entrada),
                                  hora_salida: formatTimeToHHMM(horario.hora_salida),
                                  tolerancia_minutos: horario.tolerancia_minutos
                                });
                                setShowScheduleForm(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSchedule(horario.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Información sobre horarios */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-blue-900 mb-2">Información sobre Horarios</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Cada empleado puede tener un horario personalizado</li>
                    <li>• La tolerancia se aplica solo a las llegadas tardías</li>
                    <li>• Si un empleado no tiene horario asignado, se usa el horario por defecto (9:00 AM - 7:00 PM, 15 min tolerancia)</li>
                    <li>• Solo puede haber un horario activo por empleado</li>
                    <li>• Las razones de llegadas tardías se registran automáticamente cuando aplica</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <SecurityTab />
        )}
      </div>

      {/* User Form Modal */}
      {showUserForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h3>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                <input
                  type="text"
                  value={newUser.nombre}
                  onChange={(e) => setNewUser(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
                <input
                  type="text"
                  value={newUser.usuario}
                  onChange={(e) => setNewUser(prev => ({ ...prev, usuario: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {editingUser ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
                </label>
                <input
                  type="password"
                  value={newUser.contraseña}
                  onChange={(e) => setNewUser(prev => ({ ...prev, contraseña: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                  required={!editingUser}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
                <select
                  value={newUser.rol}
                  onChange={(e) => setNewUser(prev => ({ ...prev, rol: e.target.value as 'empleado' | 'admin' }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                >
                  <option value="empleado">Empleado</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserForm(false);
                    setEditingUser(null);
                    setNewUser({ nombre: '', usuario: '', contraseña: '', rol: 'empleado' });
                  }}
                  className="flex-1 px-4 py-3 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-pink-400 text-white rounded-xl hover:bg-pink-500 transition-colors"
                >
                  {editingUser ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Form Modal */}
      {showScheduleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              {editingSchedule ? 'Editar Horario' : 'Nuevo Horario'}
            </h3>
            
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Empleado</label>
                <select
                  value={newSchedule.usuario_id}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, usuario_id: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                  required
                  disabled={!!editingSchedule}
                >
                  <option value="">Seleccionar empleado</option>
                  {usuarios.filter(u => u.rol === 'empleado').map((usuario) => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.nombre} ({usuario.usuario})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hora de Entrada</label>
                <input
                  type="time"
                  value={newSchedule.hora_entrada}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, hora_entrada: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hora de Salida</label>
                <input
                  type="time"
                  value={newSchedule.hora_salida}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, hora_salida: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tolerancia (minutos)</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={newSchedule.tolerancia_minutos}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, tolerancia_minutos: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minutos de tolerancia para llegadas tardías (0-60)
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowScheduleForm(false);
                    setEditingSchedule(null);
                    setNewSchedule({ usuario_id: '', hora_entrada: '09:00', hora_salida: '19:00', tolerancia_minutos: 15 });
                  }}
                  className="flex-1 px-4 py-3 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-pink-400 text-white rounded-xl hover:bg-pink-500 transition-colors"
                >
                  {editingSchedule ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

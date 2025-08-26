import React, { useState, useEffect } from 'react';
import { Users, Clock, AlertCircle, Calendar, Plus, Trash2, Edit, LogOut, Filter, Shield, Computer } from 'lucide-react';
import { supabase, Usuario, Checada } from '../lib/supabase';
import { hashPassword, formatDate, formatTime, isLateEntry, isEarlyExit } from '../utils/auth';
import { 
  generateDeviceFingerprint, 
  authorizeCurrentDevice, 
  getAuthorizedDevices, 
  revokeDeviceAuthorization, 
  hasAuthorizedDevice,
  getCurrentDeviceInfo
} from '../utils/deviceAuth';

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
    if (!confirm('¿Estás seguro de que deseas autorizar este dispositivo? Esto revocará cualquier autorización anterior.')) {
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
    if (!confirm('¿Estás seguro de que deseas revocar la autorización? Esto bloqueará el acceso al sistema.')) {
      return;
    }

    try {
      await revokeDeviceAuthorization();
      await loadDeviceInfo();
      alert('Autorización revocada exitosamente');
    } catch (error) {
      console.error('Error revocando autorización:', error);
      alert('Error al revocar autorización');
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
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Computer className="h-6 w-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-800">Dispositivo Actual</h3>
        </div>
        
        {currentDeviceInfo && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID del Dispositivo</label>
                <code className="block text-xs bg-gray-100 p-2 rounded border break-all">
                  {currentDeviceInfo.id}
                </code>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plataforma</label>
                <p className="text-sm text-gray-900">{currentDeviceInfo.platform}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resolución de Pantalla</label>
                <p className="text-sm text-gray-900">{currentDeviceInfo.screen}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zona Horaria</label>
                <p className="text-sm text-gray-900">{currentDeviceInfo.timezone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Idioma</label>
                <p className="text-sm text-gray-900">{currentDeviceInfo.language}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Núcleos de CPU</label>
                <p className="text-sm text-gray-900">{currentDeviceInfo.hardwareConcurrency}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dispositivos Autorizados */}
      {authorizedDevices.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-800">Dispositivos Autorizados ({authorizedDevices.length})</h3>
            </div>
            <button
              onClick={handleRevokeAuthorization}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Revocar Todas las Autorizaciones
            </button>
          </div>
          
          <div className="space-y-4">
            {authorizedDevices.map((device, index) => (
              <div key={device.device_id || device.id || index} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID del Dispositivo</label>
                    <code className="block text-xs bg-gray-100 p-2 rounded border break-all">
                      {device.device_id || device.id}
                    </code>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <p className="text-sm text-gray-900">{device.nombre || 'Sin nombre'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plataforma</label>
                    <p className="text-sm text-gray-900">{device.platform}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resolución de Pantalla</label>
                    <p className="text-sm text-gray-900">{device.screen}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Acciones de Seguridad</h3>
        
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
            <Shield className="h-6 w-6 text-blue-600 mt-1" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-1">Autorizar Este Dispositivo</h4>
              <p className="text-sm text-blue-700 mb-3">
                Autoriza este dispositivo para acceder al sistema. Solo dispositivos autorizados podrán usar el checador virtual.
              </p>
              <button
                onClick={handleAuthorizeDevice}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Autorizando...' : 'Autorizar Dispositivo'}
              </button>
            </div>
          </div>

          <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-yellow-600 mt-1" />
              <div>
                <h4 className="font-medium text-yellow-900 mb-1">Importante</h4>
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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'reports' | 'security'>('dashboard');
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

      setUsuarios(usuariosData || []);
      setChecadas(checadasData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.nombre || !newUser.usuario || !newUser.contraseña) return;

    try {
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

      setNewUser({ nombre: '', usuario: '', contraseña: '', rol: 'empleado' });
      setShowUserForm(false);
      loadData();
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error al crear usuario');
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

  // Estadísticas
  const stats = {
    totalUsuarios: usuarios.length,
    checadasHoy: checadas.filter(c => c.fecha === new Date().toISOString().split('T')[0]).length,
    llegadasTarde: filteredChecadas.filter(c => 
      c.hora_entrada && isLateEntry(formatTime(new Date(c.hora_entrada)))
    ).length,
    salidasTemprano: filteredChecadas.filter(c => 
      c.hora_salida && isEarlyExit(formatTime(new Date(c.hora_salida)))
    ).length,
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
                <p className="text-sm text-gray-600">Bienvenido, {user.nombre}</p>
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
        <div className="flex space-x-4 mb-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Clock },
            { id: 'users', label: 'Usuarios', icon: Users },
            { id: 'reports', label: 'Reportes', icon: Calendar },
            { id: 'security', label: 'Seguridad', icon: Shield }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === id
                  ? 'bg-pink-400 text-white'
                  : 'bg-white text-gray-700 hover:bg-pink-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
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
                          <span className={isLateEntry(formatTime(new Date(checada.hora_entrada))) ? 'text-red-600 font-semibold' : ''}>
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
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Reportes de Asistencia</h2>
              
              <div className="flex gap-4 items-center">
                <Filter className="h-5 w-5 text-gray-500" />
                <input
                  type="date"
                  value={dateFilter.from}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Desde"
                />
                <input
                  type="date"
                  value={dateFilter.to}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Hasta"
                />
              </div>
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
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Entrada
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Salida
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredChecadas.map((checada) => (
                      <tr key={checada.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {checada.usuarios?.nombre || 'Usuario desconocido'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(new Date(checada.fecha))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${
                            checada.hora_entrada && isLateEntry(formatTime(new Date(checada.hora_entrada)))
                              ? 'text-red-600 font-semibold'
                              : 'text-gray-900'
                          }`}>
                            {checada.hora_entrada ? formatTime(new Date(checada.hora_entrada)) : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${
                            checada.hora_salida && isEarlyExit(formatTime(new Date(checada.hora_salida)))
                              ? 'text-orange-600 font-semibold'
                              : 'text-gray-900'
                          }`}>
                            {checada.hora_salida ? formatTime(new Date(checada.hora_salida)) : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {checada.hora_entrada && isLateEntry(formatTime(new Date(checada.hora_entrada))) && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                Llegada Tarde
                              </span>
                            )}
                            {checada.hora_salida && isEarlyExit(formatTime(new Date(checada.hora_salida))) && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                                Salida Temprano
                              </span>
                            )}
                            {(!checada.hora_entrada || !isLateEntry(formatTime(new Date(checada.hora_entrada)))) && 
                             (!checada.hora_salida || !isEarlyExit(formatTime(new Date(checada.hora_salida)))) && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Normal
                              </span>
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
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut, User, Lock, Sparkles, Heart, Shield, AlertTriangle, X } from 'lucide-react';
import { supabase, HorarioEmpleado } from '../lib/supabase';
import { comparePassword, formatTime, isLateEntryWithSchedule, formatTimeToHHMM } from '../utils/auth';
import { isDeviceAuthorized, generateDeviceFingerprint } from '../utils/deviceAuth';

export default function CheckinForm() {
  const [credentials, setCredentials] = useState({ usuario: '', contraseña: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showLateReasonModal, setShowLateReasonModal] = useState(false);
  const [lateReason, setLateReason] = useState('');
  const [pendingCheckinData, setPendingCheckinData] = useState<any>(null);

  const showMessage = (text: string, type: string) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleCheckin = async (type: string) => {
    if (!credentials.usuario || !credentials.contraseña) {
      showMessage('Por favor complete todos los campos', 'error');
      return;
    }

    setLoading(true);

    try {
      // Verificar credenciales
      const { data: users, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('usuario', credentials.usuario)
        .eq('activo', true);

      if (userError) throw userError;

      if (!users || users.length === 0) {
        showMessage('Usuario no encontrado', 'error');
        return;
      }

      const user = users[0];
      const isValidPassword = await comparePassword(credentials.contraseña, user.contraseña);

      if (!isValidPassword) {
        showMessage('Contraseña incorrecta', 'error');
        return;
      }

      // VALIDACIÓN DE DISPOSITIVO AUTORIZADO PARA EMPLEADOS
      if (user.rol === 'empleado') {
        const deviceAuthorized = await isDeviceAuthorized();
        if (!deviceAuthorized) {
          const deviceInfo = await generateDeviceFingerprint();
          showMessage(
            `Dispositivo no autorizado. Contacta al administrador y proporciona este ID: ${deviceInfo.id.substring(0, 8)}...`, 
            'error'
          );
          return;
        }
      }

      const now = new Date();
      // Usar zona horaria de México (UTC-6)
      const mexicoTime = new Date(now.getTime() - (6 * 60 * 60 * 1000));
      const today = mexicoTime.toISOString().split('T')[0];
      const currentTime = now.toISOString(); // Mantener UTC para la base de datos
      const currentTimeFormatted = formatTime(now);

      // Buscar checada existente para hoy
      const { data: existingChecada, error: checadaError } = await supabase
        .from('checadas')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('fecha', today)
        .single();

      // Obtener horario del empleado
      const { data: horarioData, error: horarioError } = await supabase
        .from('horarios_empleados')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('activo', true)
        .single();

      // Usar horario por defecto si no existe uno personalizado
      const horario = horarioData || {
        hora_entrada: '09:00:00',
        hora_salida: '19:00:00',
        tolerancia_minutos: 15
      };

      if (type === 'entrada') {
        if (existingChecada && existingChecada.hora_entrada) {
          showMessage(`Ya registraste tu entrada a las ${formatTime(new Date(existingChecada.hora_entrada))}`, 'error');
          return;
        }

        // Verificar si la llegada es tardía
        const scheduledEntryTime = formatTimeToHHMM(horario.hora_entrada);
        const isLate = isLateEntryWithSchedule(currentTimeFormatted, scheduledEntryTime, horario.tolerancia_minutos);

        if (isLate) {
          // Mostrar modal para razón de llegada tardía
          setPendingCheckinData({
            user,
            today,
            currentTime,
            existingChecada,
            isLate: true
          });
          setShowLateReasonModal(true);
          setLoading(false);
          return;
        }

        // Procesar entrada normal (no tardía)
        await processCheckin({
          user,
          today,
          currentTime,
          existingChecada,
          isLate: false
        });

      } else {
        // Lógica para salida
        if (!existingChecada || !existingChecada.hora_entrada) {
          showMessage('Debes registrar tu entrada antes de la salida', 'error');
          return;
        }

        if (existingChecada.hora_salida) {
          showMessage(`Ya registraste tu salida a las ${formatTime(new Date(existingChecada.hora_salida))}`, 'error');
          return;
        }

        // Actualizar checada con hora de salida
        const { error } = await supabase
          .from('checadas')
          .update({ hora_salida: currentTime })
          .eq('id', existingChecada.id);

        if (error) throw error;
        showMessage(`¡Hasta mañana ${user.nombre}! Salida registrada a las ${formatTime(now)}`, 'success');
      }

      // Limpiar formulario después de registro exitoso
      setCredentials({ usuario: '', contraseña: '' });
    } catch (error) {
      showMessage('Error al registrar. Intente nuevamente', 'error');
      console.error('Checkin error:', error);
    } finally {
      setLoading(false);
    }
  };

  const processCheckin = async (data: any) => {
    try {
      const { user, today, currentTime, existingChecada, isLate } = data;
      
      const checkinData: any = {
        usuario_id: user.id,
        fecha: today,
        hora_entrada: currentTime,
        ...(existingChecada && { id: existingChecada.id })
      };

      // Agregar razón de llegada tardía si aplica
      if (isLate && lateReason.trim()) {
        checkinData.razon_llegada_tardia = lateReason.trim();
      }

      const { error } = await supabase
        .from('checadas')
        .upsert(checkinData);

      if (error) throw error;

      const now = new Date(currentTime);
      const lateMessage = isLate ? ' (Llegada tardía registrada)' : '';
      showMessage(`¡Buen día ${user.nombre}! Entrada registrada a las ${formatTime(now)}${lateMessage}`, 'success');
      
      // Limpiar estados
      setLateReason('');
      setPendingCheckinData(null);
      setShowLateReasonModal(false);
      setCredentials({ usuario: '', contraseña: '' });
    } catch (error) {
      showMessage('Error al registrar entrada', 'error');
      console.error('Process checkin error:', error);
    }
  };

  const handleLateReasonSubmit = async () => {
    if (pendingCheckinData) {
      await processCheckin({
        ...pendingCheckinData,
        isLate: true
      });
    }
  };

  const handleLateReasonCancel = () => {
    setShowLateReasonModal(false);
    setLateReason('');
    setPendingCheckinData(null);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-20 left-20 opacity-10 animate-pulse">
        <Sparkles className="h-24 w-24 text-pink-400" />
      </div>
      <div className="absolute bottom-32 right-16 opacity-10 animate-bounce">
        <Heart className="h-20 w-20 text-rose-400" />
      </div>
      <div className="absolute top-1/3 right-20 opacity-5">
        <div className="w-32 h-32 rounded-full bg-gradient-to-r from-pink-200 to-purple-200"></div>
      </div>
      <div className="absolute bottom-20 left-16 opacity-5">
        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-rose-200 to-pink-200"></div>
      </div>

      {/* Contenedor principal */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8 w-full max-w-md relative z-10 my-4">
        {/* Header mejorado */}
        <div className="text-center mb-6">
          <div className="relative mb-4">
            <div className="bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 rounded-full w-20 h-20 flex items-center justify-center mx-auto shadow-lg">
              <Clock className="h-10 w-10 text-white drop-shadow-sm" />
            </div>
            <div className="absolute -top-1 -right-1">
              <Sparkles className="h-5 w-5 text-rose-400 animate-pulse" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Estética Carolina Nieto
          </h1>
          <p className="text-gray-600 text-sm font-medium">Checador Virtual</p>
          <div className="w-20 h-1 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full mx-auto mt-3"></div>
        </div>

        {/* Formulario mejorado */}
        <div className="space-y-5">
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <div className="p-1 bg-rose-100 rounded-full">
                <User className="h-3 w-3 text-rose-500" />
              </div>
              Usuario
            </label>
            <div className="relative">
              <input
                type="text"
                value={credentials.usuario}
                onChange={(e) => setCredentials(prev => ({ ...prev, usuario: e.target.value }))}
                className="w-full px-5 py-4 pl-12 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all duration-300 bg-white/70 backdrop-blur-sm placeholder-gray-400"
                placeholder="Ingresa tu usuario"
                disabled={loading}
              />
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <div className="p-1 bg-purple-100 rounded-full">
                <Lock className="h-3 w-3 text-purple-500" />
              </div>
              Contraseña
            </label>
            <div className="relative">
              <input
                type="password"
                value={credentials.contraseña}
                onChange={(e) => setCredentials(prev => ({ ...prev, contraseña: e.target.value }))}
                className="w-full px-5 py-4 pl-12 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all duration-300 bg-white/70 backdrop-blur-sm placeholder-gray-400"
                placeholder="Ingresa tu contraseña"
                disabled={loading}
              />
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Botones mejorados */}
          <div className="grid grid-cols-1 gap-4 pt-6">
            <button
              onClick={() => handleCheckin('entrada')}
              disabled={loading}
              className="group bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 text-white py-5 rounded-2xl font-bold hover:from-emerald-500 hover:via-green-500 hover:to-teal-500 transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex items-center justify-center gap-3 text-lg relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <LogIn className="h-6 w-6 relative z-10" />
              <span className="relative z-10">Registrar Entrada</span>
            </button>

            <button
              onClick={() => handleCheckin('salida')}
              disabled={loading}
              className="group bg-gradient-to-r from-rose-400 via-pink-400 to-red-400 text-white py-5 rounded-2xl font-bold hover:from-rose-500 hover:via-pink-500 hover:to-red-500 transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex items-center justify-center gap-3 text-lg relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <LogOut className="h-6 w-6 relative z-10" />
              <span className="relative z-10">Registrar Salida</span>
            </button>
          </div>

          {/* Loading indicator mejorado */}
          {loading && (
            <div className="flex items-center justify-center py-4">
              <div className="relative">
                <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          )}

          {/* Mensaje mejorado */}
          {message.text && (
            <div className={`p-5 rounded-2xl text-center font-semibold transition-all duration-500 transform scale-100 border-2 backdrop-blur-sm ${
              message.type === 'success' 
                ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200 shadow-emerald-100' 
                : 'bg-rose-50/80 text-rose-700 border-rose-200 shadow-rose-100'
            } shadow-lg`}>
              <div className="flex items-center justify-center gap-2">
                {message.type === 'success' ? (
                  <Heart className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Clock className="h-5 w-5 text-rose-500" />
                )}
                {message.text}
              </div>
            </div>
          )}
        </div>

        {/* Footer decorativo */}
        <div className="mt-8 pt-6 border-t border-gray-200/50">
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
          </div>
        </div>
      </div>

      {/* Modal para razón de llegada tardía */}
      {showLateReasonModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 p-4 sm:p-6 lg:p-8 w-full max-w-md relative animate-in fade-in-0 zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            {/* Header del modal */}
            <div className="text-center mb-4 sm:mb-6">
              <div className="bg-gradient-to-r from-orange-400 to-red-400 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto shadow-lg mb-3 sm:mb-4">
                <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-white drop-shadow-sm" />
              </div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-2">Llegada Tardía Detectada</h2>
              <p className="text-gray-600 text-xs sm:text-sm px-2">
                Has llegado después de tu horario programado. Por favor, proporciona una razón (opcional).
              </p>
            </div>

            {/* Campo de texto para la razón */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                Razón de llegada tardía
              </label>
              <textarea
                value={lateReason}
                onChange={(e) => setLateReason(e.target.value)}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-300 bg-white/70 backdrop-blur-sm placeholder-gray-400 resize-none text-sm sm:text-base"
                placeholder="Ejemplo: Tráfico intenso, cita médica, etc. (opcional)"
                rows={3}
                maxLength={200}
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {lateReason.length}/200 caracteres
              </div>
            </div>

            {/* Botones del modal */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={handleLateReasonCancel}
                className="flex-1 px-3 py-2 sm:px-4 sm:py-3 bg-gray-100 text-gray-700 rounded-xl sm:rounded-2xl hover:bg-gray-200 transition-all duration-300 font-semibold flex items-center justify-center gap-2 text-sm sm:text-base order-2 sm:order-1"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
                Cancelar
              </button>
              <button
                onClick={handleLateReasonSubmit}
                className="flex-1 px-3 py-2 sm:px-4 sm:py-3 bg-gradient-to-r from-orange-400 to-red-400 text-white rounded-xl sm:rounded-2xl hover:from-orange-500 hover:to-red-500 transition-all duration-300 font-semibold flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base order-1 sm:order-2"
              >
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                Registrar Entrada
              </button>
            </div>

            {/* Nota informativa */}
            <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-orange-50 border border-orange-200 rounded-lg sm:rounded-xl">
              <p className="text-xs text-orange-700 text-center">
                <strong>Nota:</strong> Puedes dejar la razón en blanco si prefieres no especificarla.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { Clock, LogIn, LogOut, User, Lock, Sparkles, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { comparePassword, formatTime } from '../utils/auth';

export default function CheckinForm() {
  const [credentials, setCredentials] = useState({ usuario: '', contraseña: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleCheckin = async (type) => {
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

      const now = new Date();
      const today = now.toISOString().split('T')[0];

      // Buscar checada existente para hoy
      const { data: existingChecada, error: checadaError } = await supabase
        .from('checadas')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('fecha', today)
        .single();

      const currentTime = now.toISOString();

      if (type === 'entrada') {
        if (existingChecada && existingChecada.hora_entrada) {
          showMessage(`Ya registraste tu entrada a las ${formatTime(new Date(existingChecada.hora_entrada))}`, 'error');
          return;
        }

        // Crear o actualizar checada con hora de entrada
        const { error } = await supabase
          .from('checadas')
          .upsert({
            usuario_id: user.id,
            fecha: today,
            hora_entrada: currentTime,
            ...(existingChecada && { id: existingChecada.id })
          });

        if (error) throw error;
        showMessage(`¡Buen día ${user.nombre}! Entrada registrada a las ${formatTime(now)}`, 'success');
      } else {
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
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 w-full max-w-md relative z-10">
        {/* Header mejorado */}
        <div className="text-center mb-8">
          <div className="relative mb-6">
            <div className="bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 rounded-full w-24 h-24 flex items-center justify-center mx-auto shadow-lg">
              <Clock className="h-12 w-12 text-white drop-shadow-sm" />
            </div>
            <div className="absolute -top-1 -right-1">
              <Sparkles className="h-6 w-6 text-rose-400 animate-pulse" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Estética Carolina Nieto
          </h1>
          <p className="text-gray-600 text-sm font-medium">Checador Virtual</p>
          <div className="w-20 h-1 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full mx-auto mt-3"></div>
        </div>

        {/* Formulario mejorado */}
        <div className="space-y-6">
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
            <span>Entrada 9 AM </span>
            <span>Salida 7 PM </span>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { LogIn, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { comparePassword } from '../utils/auth';

interface AdminLoginProps {
  onLogin: (user: any) => void;
  isVisible: boolean;
  onClose: () => void;
}

export default function AdminLogin({ onLogin, isVisible, onClose }: AdminLoginProps) {
  const [credentials, setCredentials] = useState({ usuario: '', contraseña: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('Attempting login with:', credentials.usuario);

    try {
      const { data: users, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('usuario', credentials.usuario)
        .eq('rol', 'admin')
        .eq('activo', true);

      if (error) throw error;

      console.log('Found users:', users);

      if (users && users.length > 0) {
        const user = users[0];
        console.log('User found:', user.usuario);
        console.log('Stored hash:', user.contraseña);
        
        const isValidPassword = await comparePassword(credentials.contraseña, user.contraseña);
        console.log('Password valid:', isValidPassword);
        
        if (isValidPassword) {
          onLogin(user);
          setCredentials({ usuario: '', contraseña: '' });
          onClose();
        } else {
          setError('Credenciales incorrectas');
        }
      } else {
        setError('Usuario administrador no encontrado');
      }
    } catch (error) {
      console.error('Login error details:', error);
      setError('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <LogIn className="h-6 w-6 text-pink-400" />
            Acceso Admin
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usuario
            </label>
            <input
              type="text"
              value={credentials.usuario}
              onChange={(e) => setCredentials(prev => ({ ...prev, usuario: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={credentials.contraseña}
              onChange={(e) => setCredentials(prev => ({ ...prev, contraseña: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-400 to-pink-500 text-white py-3 rounded-xl font-medium hover:from-pink-500 hover:to-pink-600 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? 'Iniciando sesión...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
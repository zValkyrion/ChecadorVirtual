import React from 'react';
import { Shield, Computer, AlertTriangle } from 'lucide-react';

interface DeviceNotAuthorizedProps {
  deviceId: string;
  onContactAdmin?: () => void;
}

const DeviceNotAuthorized: React.FC<DeviceNotAuthorizedProps> = ({ 
  deviceId, 
  onContactAdmin 
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Acceso Denegado
          </h1>
          <p className="text-gray-600">
            Este dispositivo no está autorizado para acceder al sistema de checador virtual.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center mb-2">
            <Computer className="h-5 w-5 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">ID del Dispositivo</span>
          </div>
          <code className="text-xs text-gray-600 break-all bg-white px-2 py-1 rounded border">
            {deviceId}
          </code>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <h3 className="text-sm font-medium text-yellow-800 mb-1">
                ¿Necesitas acceso?
              </h3>
              <p className="text-sm text-yellow-700">
                Contacta al administrador del sistema y proporciona el ID del dispositivo mostrado arriba para solicitar autorización.
              </p>
            </div>
          </div>
        </div>

        {onContactAdmin && (
          <button
            onClick={onContactAdmin}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Contactar Administrador
          </button>
        )}

        <div className="mt-6 text-xs text-gray-500">
          <p>Sistema de Checador Virtual</p>
          <p>Protegido por autenticación de dispositivo</p>
        </div>
      </div>
    </div>
  );
};

export default DeviceNotAuthorized;

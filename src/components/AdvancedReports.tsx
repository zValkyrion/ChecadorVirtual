import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Clock, AlertTriangle, 
  Target, Award, Filter, Download, RefreshCw
} from 'lucide-react';
import { Usuario, Checada } from '../lib/supabase';
import { formatDate, formatTime, isLateEntry, isEarlyExit } from '../utils/auth';

interface AdvancedReportsProps {
  usuarios: Usuario[];
  checadas: Checada[];
  onRefresh: () => void;
}

const COLORS = ['#82ca9d', '#ff7300', '#ffc658', '#8884d8', '#8dd1e1', '#d084d0'];

const AdvancedReports: React.FC<AdvancedReportsProps> = ({ usuarios, checadas, onRefresh }) => {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  // Filtrar checadas según los filtros seleccionados
  const filteredChecadas = checadas.filter(checada => {
    const checadaDate = new Date(checada.fecha);
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);

    if (checadaDate < fromDate || checadaDate > toDate) return false;
    if (selectedEmployee !== 'all' && checada.usuario_id !== selectedEmployee) return false;
    return true;
  });

  // Calcular estadísticas avanzadas
  const stats = {
    totalChecadas: filteredChecadas.length,
    llegadasTarde: filteredChecadas.filter(c => 
      c.hora_entrada && isLateEntry(formatTime(new Date(c.hora_entrada)))
    ).length,
    salidasTemprano: filteredChecadas.filter(c => 
      c.hora_salida && isEarlyExit(formatTime(new Date(c.hora_salida)))
    ).length,
    diasCompletos: filteredChecadas.filter(c => c.hora_entrada && c.hora_salida).length,
    soloEntradas: filteredChecadas.filter(c => c.hora_entrada && !c.hora_salida).length,
  };

  // Preparar datos para gráficas
  const diasSemana = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  const dataPorDia = diasSemana.map(dia => {
    const checadasDia = filteredChecadas.filter(c => {
      const diaSemana = new Date(c.fecha).toLocaleDateString('es-MX', { weekday: 'long' });
      return diaSemana === dia;
    });

    return {
      dia: dia.charAt(0).toUpperCase() + dia.slice(1),
      total: checadasDia.length,
      tarde: checadasDia.filter(c => c.hora_entrada && isLateEntry(formatTime(new Date(c.hora_entrada)))).length,
      temprano: checadasDia.filter(c => c.hora_salida && isEarlyExit(formatTime(new Date(c.hora_salida)))).length,
    };
  });

  const dataPorEmpleado = usuarios.filter(u => u.rol === 'empleado').map(empleado => {
    const checadasEmpleado = filteredChecadas.filter(c => c.usuario_id === empleado.id);
    const llegadasTarde = checadasEmpleado.filter(c => 
      c.hora_entrada && isLateEntry(formatTime(new Date(c.hora_entrada)))
    ).length;
    const salidasTemprano = checadasEmpleado.filter(c => 
      c.hora_salida && isEarlyExit(formatTime(new Date(c.hora_salida)))
    ).length;

    return {
      nombre: empleado.nombre.length > 10 ? empleado.nombre.substring(0, 10) + '...' : empleado.nombre,
      total: checadasEmpleado.length,
      tarde: llegadasTarde,
      temprano: salidasTemprano,
      puntual: checadasEmpleado.length - llegadasTarde - salidasTemprano
    };
  });

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Reportes Avanzados</h2>
          
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-0"
              >
                <option value="all">Todos los empleados</option>
                {usuarios.filter(u => u.rol === 'empleado').map(empleado => (
                  <option key={empleado.id} value={empleado.id}>
                    {empleado.nombre}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <button
              onClick={onRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-pink-400 text-white rounded-lg hover:bg-pink-500 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas Clave */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span className="text-xs sm:text-sm font-medium text-gray-700">Total Checadas</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-800">{stats.totalChecadas}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <span className="text-xs sm:text-sm font-medium text-gray-700">Llegadas Tarde</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.llegadasTarde}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            <span className="text-xs sm:text-sm font-medium text-gray-700">Salidas Temprano</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-orange-600">{stats.salidasTemprano}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-green-600" />
            <span className="text-xs sm:text-sm font-medium text-gray-700">Días Completos</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.diasCompletos}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span className="text-xs sm:text-sm font-medium text-gray-700">Solo Entradas</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.soloEntradas}</p>
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfica por Día de la Semana */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Asistencia por Día de la Semana</h3>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataPorDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#8884d8" name="Total" />
                <Bar dataKey="tarde" fill="#ff7300" name="Tarde" />
                <Bar dataKey="temprano" fill="#ffc658" name="Temprano" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Estadísticas por Empleado */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Estadísticas por Empleado</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empleado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Checadas
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Puntuales
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Llegadas Tarde
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salidas Temprano
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Eficiencia
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dataPorEmpleado.map((empleado, index) => (
                  <tr key={index}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{empleado.nombre}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{empleado.total}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-green-600 font-semibold">{empleado.puntual}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-red-600 font-semibold">{empleado.tarde}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-orange-600 font-semibold">{empleado.temprano}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-purple-600">
                        {empleado.total > 0 ? Math.round((empleado.puntual / empleado.total) * 100) : 0}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Distribución de Problemas */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribución de Problemas</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: 'Puntuales', value: stats.totalChecadas - stats.llegadasTarde - stats.salidasTemprano },
                  { name: 'Llegadas Tarde', value: stats.llegadasTarde },
                  { name: 'Salidas Temprano', value: stats.salidasTemprano }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {[
                  { name: 'Puntuales', value: stats.totalChecadas - stats.llegadasTarde - stats.salidasTemprano },
                  { name: 'Llegadas Tarde', value: stats.llegadasTarde },
                  { name: 'Salidas Temprano', value: stats.salidasTemprano }
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value} registros`, name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Métricas de Consistencia */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Métricas de Consistencia</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">Tasa de Puntualidad</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {stats.totalChecadas > 0 ? Math.round(((stats.totalChecadas - stats.llegadasTarde) / stats.totalChecadas) * 100) : 0}%
            </p>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Tasa de Finalización</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {stats.totalChecadas > 0 ? Math.round((stats.diasCompletos / stats.totalChecadas) * 100) : 0}%
            </p>
          </div>
          
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">Días Incompletos</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{stats.soloEntradas}</p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Eficiencia General</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {stats.totalChecadas > 0 ? Math.round(((stats.diasCompletos) / stats.totalChecadas) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Tabla Detallada de Registros */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-800">Detalle de Registros ({filteredChecadas.length})</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm">
              <Download className="h-4 w-4" />
              Exportar CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empleado
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entrada
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salida
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horas Trabajadas
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredChecadas.slice(0, 100).map((checada) => {
                const horasTrabajadas = checada.hora_entrada && checada.hora_salida 
                  ? ((new Date(checada.hora_salida).getTime() - new Date(checada.hora_entrada).getTime()) / (1000 * 60 * 60)).toFixed(1)
                  : '-';

                return (
                  <tr key={checada.id}>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {checada.usuarios?.nombre || 'Usuario desconocido'}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(new Date(checada.fecha))}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${
                        checada.hora_entrada && isLateEntry(formatTime(new Date(checada.hora_entrada)))
                          ? 'text-red-600 font-semibold'
                          : 'text-gray-900'
                      }`}>
                        {checada.hora_entrada ? formatTime(new Date(checada.hora_entrada)) : '-'}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${
                        checada.hora_salida && isEarlyExit(formatTime(new Date(checada.hora_salida)))
                          ? 'text-orange-600 font-semibold'
                          : 'text-gray-900'
                      }`}>
                        {checada.hora_salida ? formatTime(new Date(checada.hora_salida)) : '-'}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
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
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {horasTrabajadas !== '-' ? `${horasTrabajadas}h` : '-'}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdvancedReports;

import React, { useState, useMemo } from 'react';
import { Calculator, Download, Info, Search } from 'lucide-react';
import {
  calculateGradeScale,
  getScaleStatistics,
  downloadScaleAsCSV
} from '../services/gradeScaleService';

export const GradeScaleGeneratorPage = () => {
  const [params, setParams] = useState({
    maxGrade: 7.0,
    minGrade: 1.0,
    passingGrade: 4.0,
    demandPercentage: 60,
    maxScore: 100,
    step: 1
  });

  const [filters, setFilters] = useState({
    searchScore: '',
    searchGrade: ''
  });

  const [error, setError] = useState(null);

  // Calcular escala usando useMemo para evitar recalcular en cada render
  const scale = useMemo(() => {
    try {
      setError(null);
      return calculateGradeScale(params);
    } catch (err) {
      setError(err.message);
      return [];
    }
  }, [params]);

  // Aplicar filtros a la escala
  const filteredScale = useMemo(() => {
    let filtered = [...scale];

    // Filtro por puntaje
    if (filters.searchScore !== '') {
      const scoreSearch = filters.searchScore.toLowerCase();
      filtered = filtered.filter(item =>
        item.score.toString().includes(scoreSearch)
      );
    }

    // Filtro por nota
    if (filters.searchGrade !== '') {
      const gradeSearch = filters.searchGrade.toLowerCase();
      filtered = filtered.filter(item =>
        item.grade.toFixed(1).includes(gradeSearch)
      );
    }

    return filtered;
  }, [scale, filters]);

  // Dividir la escala en tres columnas
  const { leftColumn, centerColumn, rightColumn } = useMemo(() => {
    const thirdPoint = Math.ceil(filteredScale.length / 3);
    const twoThirdsPoint = Math.ceil((filteredScale.length * 2) / 3);
    return {
      leftColumn: filteredScale.slice(0, thirdPoint),
      centerColumn: filteredScale.slice(thirdPoint, twoThirdsPoint),
      rightColumn: filteredScale.slice(twoThirdsPoint)
    };
  }, [filteredScale]);

  const statistics = useMemo(() => {
    if (scale.length === 0) return null;
    return getScaleStatistics(scale, params.passingGrade);
  }, [scale, params.passingGrade]);

  const handleInputChange = (field, value) => {
    setParams(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handleDownloadCSV = () => {
    const filename = `escala_notas_${params.demandPercentage}%_${new Date().toISOString().split('T')[0]}.csv`;
    downloadScaleAsCSV(scale, filename);
  };

  const resetToDefaults = () => {
    setParams({
      maxGrade: 7.0,
      minGrade: 1.0,
      passingGrade: 4.0,
      demandPercentage: 60,
      maxScore: 100,
      step: 1
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Calculator className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Generador de Escala de Notas
          </h1>
        </div>
        <p className="text-gray-600">
          Genera escalas de conversión de puntajes a notas según parámetros personalizados
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de Configuración */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Parámetros de Escala
            </h2>

            <div className="space-y-4">
              {/* Nota Máxima */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nota Máxima
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="10"
                  value={params.maxGrade}
                  onChange={(e) => handleInputChange('maxGrade', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Nota Mínima */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nota Mínima
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="10"
                  value={params.minGrade}
                  onChange={(e) => handleInputChange('minGrade', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Nota de Aprobación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nota de Aprobación
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="10"
                  value={params.passingGrade}
                  onChange={(e) => handleInputChange('passingGrade', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Porcentaje de Exigencia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Porcentaje de Exigencia (%)
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="100"
                  value={params.demandPercentage}
                  onChange={(e) => handleInputChange('demandPercentage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Puntaje mínimo para aprobar: {Math.ceil((params.demandPercentage / 100) * params.maxScore)} pts
                </p>
              </div>

              {/* Puntaje Máximo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Puntaje Máximo
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="1000"
                  value={params.maxScore}
                  onChange={(e) => handleInputChange('maxScore', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Paso */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paso entre Puntajes
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="100"
                  value={params.step}
                  onChange={(e) => handleInputChange('step', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Filas en la tabla: {Math.floor(params.maxScore / params.step) + 1}
                </p>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="mt-6 space-y-2">
              <button
                onClick={handleDownloadCSV}
                disabled={scale.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4" />
                Descargar CSV
              </button>

              <button
                onClick={resetToDefaults}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Restaurar Valores por Defecto
              </button>
            </div>

            {/* Estadísticas */}
            {statistics && (
              <div className="mt-6 p-4 bg-blue-50 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Estadísticas</h3>
                </div>
                <div className="space-y-1 text-sm text-blue-800">
                  <p>Total de filas: {statistics.totalScores}</p>
                  <p>Puntaje de aprobación: {statistics.passingScoreThreshold} pts</p>
                  <p>Porcentaje de aprobación: {statistics.passingPercentageThreshold}%</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabla de Escala */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Tabla de Conversión
              </h2>

              {/* Filtros */}
              {scale.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por puntaje..."
                      value={filters.searchScore}
                      onChange={(e) => setFilters(prev => ({ ...prev, searchScore: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nota..."
                      value={filters.searchGrade}
                      onChange={(e) => setFilters(prev => ({ ...prev, searchGrade: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {scale.length > 0 && (
                <p className="text-sm text-gray-600">
                  Mostrando {filteredScale.length} de {scale.length} conversiones
                </p>
              )}
            </div>

            {error && (
              <div className="p-6 bg-red-50 border-l-4 border-red-500">
                <p className="text-red-800 font-medium">Error en los parámetros:</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            )}

            {!error && scale.length > 0 && (
              <div className="overflow-auto max-h-[calc(100vh-350px)] p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Columna Izquierda */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Puntaje
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Nota
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {leftColumn.map((item, index) => {
                          const isPassingThreshold = item.score === Math.ceil((params.demandPercentage / 100) * params.maxScore);
                          return (
                            <tr
                              key={index}
                              className={`
                                ${item.isPassing ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100'}
                                ${isPassingThreshold ? 'bg-yellow-100 font-semibold border-l-4 border-yellow-500' : ''}
                                transition-colors
                              `}
                            >
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                {item.score}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                                <span className={item.isPassing ? 'text-green-700' : 'text-red-700'}>
                                  {item.grade.toFixed(1)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Columna Central */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Puntaje
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Nota
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {centerColumn.map((item, index) => {
                          const isPassingThreshold = item.score === Math.ceil((params.demandPercentage / 100) * params.maxScore);
                          return (
                            <tr
                              key={index}
                              className={`
                                ${item.isPassing ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100'}
                                ${isPassingThreshold ? 'bg-yellow-100 font-semibold border-l-4 border-yellow-500' : ''}
                                transition-colors
                              `}
                            >
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                {item.score}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                                <span className={item.isPassing ? 'text-green-700' : 'text-red-700'}>
                                  {item.grade.toFixed(1)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Columna Derecha */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Puntaje
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Nota
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {rightColumn.map((item, index) => {
                          const isPassingThreshold = item.score === Math.ceil((params.demandPercentage / 100) * params.maxScore);
                          return (
                            <tr
                              key={index}
                              className={`
                                ${item.isPassing ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100'}
                                ${isPassingThreshold ? 'bg-yellow-100 font-semibold border-l-4 border-yellow-500' : ''}
                                transition-colors
                              `}
                            >
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                {item.score}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                                <span className={item.isPassing ? 'text-green-700' : 'text-red-700'}>
                                  {item.grade.toFixed(1)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {filteredScale.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No se encontraron resultados con los filtros aplicados</p>
                  </div>
                )}
              </div>
            )}

            {!error && scale.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                <Calculator className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Ajusta los parámetros para generar la escala</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

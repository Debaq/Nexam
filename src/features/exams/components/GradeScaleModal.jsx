import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Download, Calculator } from 'lucide-react';
import {
  calculateGradeScale,
  getScaleStatistics,
  downloadScaleAsCSV
} from '@/shared/services/gradeScaleService';

const GradeScaleModal = ({ exam, isOpen, onClose }) => {
  // Calcular escala basada en la configuración del examen
  const scale = useMemo(() => {
    if (!exam || !exam.grading) return [];

    const maxScore = exam.questions?.length * (exam.pointsPerQuestion || 1) || 100;

    try {
      return calculateGradeScale({
        maxGrade: exam.grading.maxGrade || 7.0,
        minGrade: exam.grading.minGrade || 1.0,
        passingGrade: exam.grading.passingGrade || 4.0,
        demandPercentage: exam.grading.demandPercentage || 60,
        maxScore: maxScore,
        step: 1
      });
    } catch (error) {
      console.error('Error calculando escala:', error);
      return [];
    }
  }, [exam]);

  // Dividir la escala en tres columnas
  const { leftColumn, centerColumn, rightColumn } = useMemo(() => {
    const thirdPoint = Math.ceil(scale.length / 3);
    const twoThirdsPoint = Math.ceil((scale.length * 2) / 3);
    return {
      leftColumn: scale.slice(0, thirdPoint),
      centerColumn: scale.slice(thirdPoint, twoThirdsPoint),
      rightColumn: scale.slice(twoThirdsPoint)
    };
  }, [scale]);

  const statistics = useMemo(() => {
    if (scale.length === 0 || !exam?.grading) return null;
    return getScaleStatistics(scale, exam.grading.passingGrade);
  }, [scale, exam?.grading?.passingGrade]);

  const handleDownloadCSV = () => {
    const filename = `escala_${exam.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    downloadScaleAsCSV(scale, filename);
  };

  if (!exam || !exam.grading) return null;

  const maxScore = exam.questions?.length * (exam.pointsPerQuestion || 1) || 100;
  const passingScore = Math.ceil((exam.grading.demandPercentage / 100) * maxScore);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Escala de Calificación - {exam.title}
          </DialogTitle>
          <DialogDescription>
            Conversión de puntajes a notas según los parámetros del examen
          </DialogDescription>
        </DialogHeader>

        {/* Información de Parámetros */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs text-gray-600">Puntaje Máximo</p>
            <p className="text-lg font-semibold">{maxScore} pts</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Nota Máxima</p>
            <p className="text-lg font-semibold">{exam.grading.maxGrade.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">% de Exigencia</p>
            <p className="text-lg font-semibold">{exam.grading.demandPercentage}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Puntaje para {exam.grading.passingGrade}</p>
            <p className="text-lg font-semibold text-blue-600">{passingScore} pts</p>
          </div>
        </div>

        {/* Estadísticas */}
        {statistics && (
          <div className="grid grid-cols-3 gap-2 text-center text-sm p-3 bg-blue-50 rounded-lg">
            <div>
              <p className="text-gray-600">Nota Mínima</p>
              <p className="font-semibold text-blue-900">{statistics.minGrade.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-gray-600">Nota de Aprobación</p>
              <p className="font-semibold text-green-700">{exam.grading.passingGrade.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-gray-600">Nota Máxima</p>
              <p className="font-semibold text-blue-900">{statistics.maxGrade.toFixed(1)}</p>
            </div>
          </div>
        )}

        {/* Tabla de Escala - Tres Columnas */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Columna Izquierda */}
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Puntaje
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Nota
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leftColumn.map((item, index) => {
                    const isPassingThreshold = item.score === passingScore;
                    return (
                      <tr
                        key={index}
                        className={`
                          ${item.isPassing ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100'}
                          ${isPassingThreshold ? 'bg-yellow-100 font-semibold border-l-4 border-yellow-500' : ''}
                          transition-colors
                        `}
                      >
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {item.score}
                          {isPassingThreshold && (
                            <span className="ml-1 text-xs text-yellow-700">★</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-sm font-medium">
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
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Puntaje
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Nota
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {centerColumn.map((item, index) => {
                    const isPassingThreshold = item.score === passingScore;
                    return (
                      <tr
                        key={index}
                        className={`
                          ${item.isPassing ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100'}
                          ${isPassingThreshold ? 'bg-yellow-100 font-semibold border-l-4 border-yellow-500' : ''}
                          transition-colors
                        `}
                      >
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {item.score}
                          {isPassingThreshold && (
                            <span className="ml-1 text-xs text-yellow-700">★</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-sm font-medium">
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
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Puntaje
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Nota
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rightColumn.map((item, index) => {
                    const isPassingThreshold = item.score === passingScore;
                    return (
                      <tr
                        key={index}
                        className={`
                          ${item.isPassing ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100'}
                          ${isPassingThreshold ? 'bg-yellow-100 font-semibold border-l-4 border-yellow-500' : ''}
                          transition-colors
                        `}
                      >
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {item.score}
                          {isPassingThreshold && (
                            <span className="ml-1 text-xs text-yellow-700">★</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-sm font-medium">
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
        </div>

        {/* Footer con acciones */}
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-gray-600">
            Total: {scale.length} conversiones
          </p>
          <div className="flex gap-2">
            <Button onClick={handleDownloadCSV} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Descargar CSV
            </Button>
            <Button onClick={onClose} size="sm">
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GradeScaleModal;

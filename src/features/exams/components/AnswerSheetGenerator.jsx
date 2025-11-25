import { useState } from 'react';
import examService from '../services/examService';
import pdfGenerator from '../services/pdfGenerator';

/**
 * Componente para generar hojas de respuesta
 * Permite generar la hoja de respuesta para un examen específico
 */
const AnswerSheetGenerator = ({ examId, studentId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateAnswerSheet = async () => {
    try {
      setLoading(true);
      setError(null);

      // Generar la versión específica del examen para el estudiante
      const examVersion = await examService.generateExamVersion(examId, studentId);

      // Generar la hoja de respuesta
      const doc = pdfGenerator.generateAnswerSheet(examVersion);

      // Descargar el PDF
      doc.save(`hoja_respuestas_${examVersion.code || 'examen'}.pdf`);
    } catch (err) {
      setError(err.message);
      console.error('Error generando hoja de respuesta:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="answer-sheet-generator">
      <button
        onClick={handleGenerateAnswerSheet}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
      >
        {loading ? 'Generando...' : 'Generar Hoja de Respuestas'}
      </button>
      
      {error && (
        <div className="error text-red-500 mt-2">
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default AnswerSheetGenerator;
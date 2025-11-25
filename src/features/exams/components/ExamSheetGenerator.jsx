import { useState } from 'react';
import examService from '../services/examService';
import pdfGenerator from '../services/pdfGenerator';

/**
 * Componente para generar pruebas (evaluaciones)
 * Permite generar la prueba para un examen específico
 */
const ExamSheetGenerator = ({ examId, studentId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateExamSheet = async () => {
    try {
      setLoading(true);
      setError(null);

      // Generar la versión específica del examen para el estudiante
      const examVersion = await examService.generateExamVersion(examId, studentId);

      // Generar la hoja de examen
      const doc = pdfGenerator.generateExamSheet(examVersion);

      // Descargar el PDF
      doc.save(`prueba_${examVersion.code || 'examen'}.pdf`);
    } catch (err) {
      setError(err.message);
      console.error('Error generando prueba:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="exam-sheet-generator">
      <button
        onClick={handleGenerateExamSheet}
        disabled={loading}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
      >
        {loading ? 'Generando...' : 'Generar Prueba'}
      </button>
      
      {error && (
        <div className="error text-red-500 mt-2">
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default ExamSheetGenerator;
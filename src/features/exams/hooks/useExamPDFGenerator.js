import { db } from '@/core/storage/db';
import examService from '../services/examService';
import pdfGenerator from '../services/pdfGenerator';
import { generateCompleteMetadata, generateDetailedAnswerKey } from '../services/examMetadataGenerator';
import { generateMarkedAnswerSheet, generateMarkedExamSheet } from '../services/pautaGenerator';
import JSZip from 'jszip';

export const useExamPDFGenerator = () => {
  const generatePDFs = async (exam, isDraft = true, showConfirmation = true) => {
    try {
      const pdfType = isDraft ? 'BORRADOR' : 'FINAL';

      // Mostrar confirmación solo si se solicita
      if (showConfirmation) {
        const confirmResult = window.confirm(`¿Desea generar los PDFs ${pdfType} para el examen "${exam.title}"?

        • ${exam.questions.length} preguntas incluidas
        • ${exam.students.length} estudiantes asignados
        • Tipo: ${exam.type === 'uniform' ? 'Uniforme' : 'Diferenciado'}
        ${!isDraft ? '\n        ⚠️ Los PDFs NO tendrán marca de agua' : '\n        📝 Los PDFs incluirán marca de agua "BORRADOR"'}

        Esto puede tomar unos segundos...`);

        if (!confirmResult) return;
      }

      const zip = new JSZip();
      const examFolderName = exam.title.replace(/[^a-zA-Z0-9]/g, '_');

      // Generar PDFs según tipo de examen
      if (exam.type === 'differentiated' && exam.students.length > 0) {
        await generateDifferentiatedExam(exam, examFolderName, isDraft, zip, showConfirmation);
      } else {
        await generateUniformExam(exam, examFolderName, isDraft, zip, showConfirmation);
      }
    } catch (error) {
      console.error('Error generando PDFs:', error);
      alert('Error al generar los PDFs: ' + error.message);
    }
  };

  const generateDifferentiatedExam = async (exam, examFolderName, isDraft, zip, showConfirmation) => {
    for (const studentId of exam.students) {
      const examVersion = await examService.generateExamVersion(exam.id, studentId);
      const student = await db.students.get(studentId);
      const studentName = student ? `${student.name}_${student.lastName}`.replace(/[^a-zA-Z0-9]/g, '_') : studentId;

      // Generar la prueba
      const examDoc = pdfGenerator.generateExamSheet(examVersion, isDraft);
      const examBlob = examDoc.output('blob');
      zip.file(`examenes/${studentName}_examen.pdf`, examBlob);

      // Generar la hoja de respuesta
      const answerDoc = pdfGenerator.generateAnswerSheet(examVersion, isDraft);
      const answerBlob = answerDoc.output('blob');
      zip.file(`hojas_respuesta/${studentName}_hoja_respuesta.pdf`, answerBlob);
    }

    // Si es versión final, agregar metadatos y pautas
    if (!isDraft) {
      await addFinalMetadata(exam, zip);
    }

    // Descargar el ZIP
    await downloadZip(zip, examFolderName, isDraft, 'diferenciado');

    // Solo mostrar mensaje si no es finalizado o si se pidió confirmación
    if (exam.status !== 'finalized' || showConfirmation) {
      alert(`Se generaron ${exam.students.length * 2} PDFs en un archivo ZIP.`);
    }
  };

  const generateUniformExam = async (exam, examFolderName, isDraft, zip, showConfirmation) => {
    try {
      const examVersion = await examService.generateExamVersion(exam.id, 'uniform');

      // Generar la prueba
      const examDoc = pdfGenerator.generateExamSheet(examVersion, isDraft);
      const examBlob = examDoc.output('blob');
      zip.file(`examen_uniforme.pdf`, examBlob);

      // Generar la hoja de respuesta
      const answerDoc = pdfGenerator.generateAnswerSheet(examVersion, isDraft);
      const answerBlob = answerDoc.output('blob');
      zip.file(`hoja_respuesta_uniforme.pdf`, answerBlob);

      // Si es versión final, agregar metadatos
      if (!isDraft) {
        await addFinalMetadata(exam, zip, true);
      }

      // Descargar el ZIP
      await downloadZip(zip, examFolderName, isDraft, 'uniforme');

      // Solo mostrar mensaje si no es finalizado o si se pidió confirmación
      if (exam.status !== 'finalized' || showConfirmation) {
        alert('Se generaron los PDFs en un archivo ZIP.');
      }
    } catch (error) {
      console.error('Error generando examen uniforme:', error);
      // Fallback con versión manual
      await generateUniformExamFallback(exam, examFolderName, isDraft, zip, showConfirmation);
    }
  };

  const generateUniformExamFallback = async (exam, examFolderName, isDraft, zip, showConfirmation) => {
    const examVersion = {
      examId: exam.id,
      examTitle: exam.title,
      studentId: null,
      code: null,
      questions: exam.questions,
      date: exam.date,
      duration: exam.duration || 90
    };

    // Cargar preguntas
    const questions = await Promise.all(
      exam.questions.map(qId => db.questions.get(qId))
    );
    examVersion.questions = questions.filter(Boolean);

    // Aplicar aleatorización si está configurada
    if (exam.randomization.shuffleQuestions) {
      examVersion.questions = shuffleArray(examVersion.questions);
    }

    if (exam.randomization.shuffleAlternatives) {
      examVersion.questions = examVersion.questions.map(q => {
        if (q.type === 'multiple' || q.type === 'boolean') {
          return { ...q, alternatives: shuffleArray(q.alternatives) };
        }
        return q;
      });
    }

    // Generar PDFs
    const examDoc = pdfGenerator.generateExamSheet(examVersion, isDraft);
    const examBlob = examDoc.output('blob');
    zip.file(`examen_uniforme.pdf`, examBlob);

    const answerDoc = pdfGenerator.generateAnswerSheet(examVersion, isDraft);
    const answerBlob = answerDoc.output('blob');
    zip.file(`hoja_respuesta_uniforme.pdf`, answerBlob);

    if (!isDraft) {
      await addFinalMetadata(exam, zip, true);
    }

    await downloadZip(zip, examFolderName, isDraft, 'uniforme');

    if (exam.status !== 'finalized' || showConfirmation) {
      alert('Se generaron los PDFs en un archivo ZIP.');
    }
  };

  const addFinalMetadata = async (exam, zip, isUniform = false) => {
    const completeMetadata = generateCompleteMetadata(exam);
    const detailedAnswerKey = generateDetailedAnswerKey(completeMetadata);

    zip.file('METADATA_EXAMEN.json', JSON.stringify(completeMetadata, null, 2));
    zip.file('PAUTA_DETALLADA.txt', detailedAnswerKey);

    // Agregar pautas
    const pautasFolder = zip.folder('pautas');

    if (isUniform) {
      const examVersion = await examService.generateExamVersion(exam.id, 'uniform');
      const markedAnswerSheet = generateMarkedAnswerSheet(examVersion, completeMetadata.versions.version.questionsWithCorrectAnswers);
      const markedAnswerBlob = markedAnswerSheet.output('blob');
      pautasFolder.file('pauta_respuestas_uniforme.pdf', markedAnswerBlob);

      const markedExamSheet = generateMarkedExamSheet(examVersion, completeMetadata.versions.version.questionsWithCorrectAnswers);
      const markedExamBlob = markedExamSheet.output('blob');
      pautasFolder.file('pauta_examen_uniforme.pdf', markedExamBlob);
    } else {
      for (const studentId of exam.students) {
        const examVersion = await examService.generateExamVersion(exam.id, studentId);
        const versionInfo = completeMetadata.versions.versions[studentId];

        const markedAnswerSheet = generateMarkedAnswerSheet(examVersion, versionInfo.questionsWithCorrectAnswers);
        const markedAnswerBlob = markedAnswerSheet.output('blob');

        const student = await db.students.get(studentId);
        const studentName = student ? `${student.name}_${student.lastName}`.replace(/[^a-zA-Z0-9]/g, '_') : studentId;
        pautasFolder.file(`${studentName}_pauta_respuestas.pdf`, markedAnswerBlob);

        const markedExamSheet = generateMarkedExamSheet(examVersion, versionInfo.questionsWithCorrectAnswers);
        const markedExamBlob = markedExamSheet.output('blob');
        pautasFolder.file(`${studentName}_pauta_examen.pdf`, markedExamBlob);
      }
    }

    const readme = `SISTEMA DE SEGURIDAD Y TRAZABILIDAD - NEXAM
==============================================

Este archivo ZIP contiene un examen FINALIZADO con sistema de seguridad.

CONTENIDO:
- ${isUniform ? 'examen_uniforme.pdf' : 'examenes/'}: ${isUniform ? 'Prueba' : 'PDFs de las pruebas'} (sin marca de agua)
- ${isUniform ? 'hoja_respuesta_uniforme.pdf' : 'hojas_respuesta/'}: ${isUniform ? 'Hoja' : 'PDFs de hojas'} de respuesta (sin marca de agua)
- pautas/: PDFs con respuestas correctas marcadas para revisión manual
- METADATA_EXAMEN.json: Información completa y sistema de seguridad
- PAUTA_DETALLADA.txt: Archivo de texto con todas las respuestas correctas
- LEEME.txt: Este archivo

IMPORTANTE:
⚠️ Este examen ha sido FINALIZADO y es INMUTABLE
⚠️ No se puede modificar en el sistema original
⚠️ Las preguntas están almacenadas permanentemente en METADATA_EXAMEN.json
⚠️ La carpeta 'pautas/' contiene respuestas correctas para revisión manual en caso de fallos

Para más información, consulta los archivos METADATA_EXAMEN.json y PAUTA_DETALLADA.txt

Generado por: Nexam - Sistema Inteligente de Evaluación Educativa
Fecha: ${new Date().toLocaleString('es-CL')}
`;
    zip.file('LEEME.txt', readme);
  };

  const downloadZip = async (zip, examFolderName, isDraft, type) => {
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    const suffix = isDraft ? '_BORRADOR' : '_FINAL';
    link.download = `${examFolderName}_${type}${suffix}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  return { generatePDFs };
};

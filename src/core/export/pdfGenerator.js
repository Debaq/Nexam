import { jsPDF } from 'jspdf';

/**
 * Generador de PDFs para exámenes y hojas de respuesta
 */
export const pdfGenerator = {
  /**
   * Generar PDF de examen
   * @param {Object} examVersion - Versión del examen generada
   * @param {Object} student - Datos del estudiante (opcional)
   * @returns {jsPDF} Documento PDF
   */
  generateExamPDF(examVersion, student = null) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    // Helper para agregar nueva página si es necesario
    const checkNewPage = (requiredSpace = 20) => {
      if (yPos + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    // HEADER
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(examVersion.examTitle, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Fecha
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const dateStr = new Date(examVersion.date).toLocaleDateString('es-CL');
    doc.text(`Fecha: ${dateStr}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Información del estudiante
    if (student) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Datos del Estudiante', margin, yPos);
      yPos += 7;

      doc.setFont('helvetica', 'normal');
      doc.text(`Nombre: ${student.name} ${student.lastName}`, margin, yPos);
      yPos += 5;
      doc.text(`RUT: ${student.rut}`, margin, yPos);
      yPos += 5;

      if (examVersion.code) {
        doc.setFont('helvetica', 'bold');
        doc.text(`Código: ${examVersion.code}`, margin, yPos);
        yPos += 5;
      }
    } else {
      // Espacio para datos del estudiante
      doc.setFontSize(11);
      doc.text('Nombre: ________________________________', margin, yPos);
      yPos += 7;
      doc.text('RUT: ____________________', margin, yPos);
      yPos += 7;

      if (examVersion.code) {
        doc.setFont('helvetica', 'bold');
        doc.text(`Código: ${examVersion.code}`, margin, yPos);
        yPos += 7;
      }
    }

    // Línea separadora
    yPos += 5;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // PREGUNTAS
    examVersion.questions.forEach((question, index) => {
      checkNewPage(30);

      // Número de pregunta
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}.`, margin, yPos);

      // Texto de la pregunta
      doc.setFont('helvetica', 'normal');
      const questionLines = doc.splitTextToSize(
        question.text,
        pageWidth - margin * 2 - 10
      );
      doc.text(questionLines, margin + 10, yPos);
      yPos += questionLines.length * 5 + 5;

      // Alternativas (si las tiene)
      if (question.type === 'multiple' || question.type === 'boolean') {
        checkNewPage(question.alternatives.length * 6 + 10);

        question.alternatives.forEach((alt, altIndex) => {
          const letter = String.fromCharCode(65 + altIndex); // A, B, C, D...

          // Círculo para marcar
          doc.circle(margin + 5, yPos - 2, 2);

          // Texto de la alternativa
          const altLines = doc.splitTextToSize(
            `${letter}) ${alt.text}`,
            pageWidth - margin * 2 - 15
          );
          doc.text(altLines, margin + 10, yPos);
          yPos += Math.max(altLines.length * 5, 6);
        });

        yPos += 5;
      } else if (question.type === 'development') {
        // Espacio para desarrollo
        checkNewPage(40);
        doc.text('Respuesta:', margin + 10, yPos);
        yPos += 7;

        // Líneas para escribir
        for (let i = 0; i < 5; i++) {
          doc.line(margin + 10, yPos, pageWidth - margin, yPos);
          yPos += 7;
        }
        yPos += 5;
      }

      yPos += 5;
    });

    // FOOTER en la última página
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(
      'Generado con Nexam',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );

    return doc;
  },

  /**
   * Generar PDF de hoja de respuestas
   * @param {Object} examVersion - Versión del examen
   * @param {Object} student - Datos del estudiante (opcional)
   * @returns {jsPDF} Documento PDF
   */
  generateAnswerSheetPDF(examVersion, student = null) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    // HEADER
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('HOJA DE RESPUESTAS', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    doc.setFontSize(12);
    doc.text(examVersion.examTitle, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Fecha y código
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const dateStr = new Date(examVersion.date).toLocaleDateString('es-CL');
    doc.text(`Fecha: ${dateStr}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Datos del estudiante
    if (student) {
      doc.setFontSize(10);
      doc.text(`Nombre: ${student.name} ${student.lastName}`, margin, yPos);
      yPos += 5;
      doc.text(`RUT: ${student.rut}`, margin, yPos);
      yPos += 5;
    } else {
      doc.setFontSize(10);
      doc.text('Nombre: ________________________________', margin, yPos);
      yPos += 7;
      doc.text('RUT: ____________________', margin, yPos);
      yPos += 7;
    }

    if (examVersion.code) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`CÓDIGO: ${examVersion.code}`, margin, yPos);
      yPos += 10;
    }

    // Marcas de alineación en las esquinas (para Computer Vision)
    const markSize = 10;
    // Superior izquierda
    doc.circle(margin, margin, markSize, 'F');
    // Superior derecha
    doc.circle(pageWidth - margin, margin, markSize, 'F');
    // Inferior izquierda
    doc.circle(margin, pageHeight - margin, markSize, 'F');
    // Inferior derecha
    doc.circle(pageWidth - margin, pageHeight - margin, markSize, 'F');

    // Código en las esquinas (para reconocimiento)
    if (examVersion.code) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      // Repetir código en 4 esquinas
      doc.text(examVersion.code, margin + 15, margin + 5);
      doc.text(examVersion.code, pageWidth - margin - 15, margin + 5);
      doc.text(examVersion.code, margin + 15, pageHeight - margin - 5);
      doc.text(examVersion.code, pageWidth - margin - 15, pageHeight - margin - 5);
    }

    // Línea separadora
    yPos += 5;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 15;

    // GRILLA DE RESPUESTAS
    const questionsPerColumn = 25;
    const columnWidth = (pageWidth - margin * 2 - 10) / 2;
    let currentColumn = 0;
    let columnYPos = yPos;

    examVersion.questions.forEach((question, index) => {
      if (question.type === 'multiple' || question.type === 'boolean') {
        // Cambiar de columna si es necesario
        if (index > 0 && index % questionsPerColumn === 0) {
          currentColumn++;
          columnYPos = yPos;
        }

        const xOffset = margin + (currentColumn * (columnWidth + 10));

        // Número de pregunta
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}.`, xOffset, columnYPos);

        // Círculos para alternativas
        const numAlternatives = question.alternatives.length;
        const circleSpacing = 10;

        for (let i = 0; i < numAlternatives; i++) {
          const letter = String.fromCharCode(65 + i); // A, B, C, D...
          const circleX = xOffset + 15 + (i * circleSpacing);

          // Letra
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.text(letter, circleX - 1, columnYPos - 1);

          // Círculo para marcar (más grande para facilitar detección)
          doc.circle(circleX, columnYPos + 2, 3);
        }

        columnYPos += 8;
      }
    });

    // Instrucciones al pie
    yPos = pageHeight - 30;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Instrucciones:', margin, yPos);
    yPos += 4;
    doc.text('- Marque sus respuestas rellenando completamente el círculo correspondiente', margin, yPos);
    yPos += 4;
    doc.text('- Use lápiz grafito No. 2 o bolígrafo negro', margin, yPos);
    yPos += 4;
    doc.text('- No doble ni arrugue esta hoja', margin, yPos);

    // Footer
    doc.setFontSize(8);
    doc.text(
      'Generado con Nexam - Sistema de Evaluación',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );

    return doc;
  },

  /**
   * Descargar PDF de examen
   * @param {Object} examVersion - Versión del examen
   * @param {Object} student - Datos del estudiante
   */
  downloadExamPDF(examVersion, student) {
    const doc = this.generateExamPDF(examVersion, student);
    const filename = student
      ? `examen_${examVersion.code || examVersion.examId}_${student.rut}.pdf`
      : `examen_${examVersion.examId}.pdf`;
    doc.save(filename);
  },

  /**
   * Descargar PDF de hoja de respuestas
   * @param {Object} examVersion - Versión del examen
   * @param {Object} student - Datos del estudiante
   */
  downloadAnswerSheetPDF(examVersion, student) {
    const doc = this.generateAnswerSheetPDF(examVersion, student);
    const filename = student
      ? `hoja_respuestas_${examVersion.code || examVersion.examId}_${student.rut}.pdf`
      : `hoja_respuestas_${examVersion.examId}.pdf`;
    doc.save(filename);
  },

  /**
   * Generar PDFs para todos los estudiantes de un examen
   * @param {string} examId - ID del examen
   * @param {Function} examService - Servicio de exámenes
   * @param {Function} studentsService - Servicio de estudiantes
   * @returns {Promise<void>}
   */
  async generateAllExamPDFs(examId, examService, studentsService) {
    const exam = await examService.getById(examId);
    if (!exam) throw new Error('Examen no encontrado');

    for (const studentId of exam.students) {
      const student = await studentsService.getById(studentId);
      const examVersion = await examService.generateExamVersion(examId, studentId);

      // Generar ambos PDFs
      this.downloadExamPDF(examVersion, student);
      this.downloadAnswerSheetPDF(examVersion, student);
    }
  }
};

export default pdfGenerator;

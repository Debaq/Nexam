import { db } from '@/core/storage/db';
import { studentsService } from '@/features/students/services/studentsService';
import { studentSectionsService } from '@/features/students/services/studentSectionsService';
import { examService } from '@/features/exams/services/examService';

/**
 * Servicio para gestión de calificaciones por sección
 */
export const sectionGradesService = {
  /**
   * GET - Obtener calificaciones de estudiantes en una sección
   * @param {string} sectionId - ID de la sección
   * @returns {Promise<Array>} Array de objetos con estudiante y sus calificaciones
   */
  async getSectionGrades(sectionId) {
    // Obtener estudiantes inscritos en la sección
    const enrolledStudents = await studentSectionsService.getActiveBySection(sectionId);
    
    // Obtener exámenes asociados a la sección
    const sectionExams = await db.exams
      .where('sectionId')
      .equals(sectionId)
      .toArray();

    // Construir datos de calificaciones para cada estudiante
    const gradesData = [];
    
    for (const enrollment of enrolledStudents) {
      const student = await studentsService.getById(enrollment.studentId);
      if (!student) continue;

      // Obtener resultados del estudiante para exámenes de esta sección
      const studentResults = [];
      for (const exam of sectionExams) {
        // Usar índice simple y filtrar manualmente
        const result = await db.results
          .where('examId')
          .equals(exam.id)
          .filter(r => r.studentId === enrollment.studentId)
          .first();

        if (result) {
          studentResults.push({
            examId: exam.id,
            examTitle: exam.title,
            score: result.score,
            date: result.correctedAt
          });
        }
      }

      gradesData.push({
        studentId: student.id,
        studentName: `${student.name} ${student.lastName}`,
        studentRut: student.rut,
        results: studentResults,
        average: studentResults.length > 0 
          ? studentResults.reduce((sum, r) => sum + r.score, 0) / studentResults.length
          : null
      });
    }

    return gradesData;
  },

  /**
   * GET - Obtener promedio de un estudiante en una sección
   * @param {string} studentId - ID del estudiante
   * @param {string} sectionId - ID de la sección
   * @returns {Promise<number|null>} Promedio del estudiante o null si no hay datos
   */
  async getStudentSectionAverage(studentId, sectionId) {
    // Obtener exámenes asociados a la sección
    const sectionExams = await db.exams
      .where('sectionId')
      .equals(sectionId)
      .toArray();

    // Obtener resultados del estudiante para exámenes de esta sección
    const results = [];
    for (const exam of sectionExams) {
      // Usar índice simple y filtrar manualmente
      const result = await db.results
        .where('examId')
        .equals(exam.id)
        .filter(r => r.studentId === studentId)
        .first();

      if (result && result.score !== undefined) {
        results.push(result.score);
      }
    }

    return results.length > 0
      ? results.reduce((sum, score) => sum + score, 0) / results.length
      : null;
  }
};

export default sectionGradesService;
import { db } from '@/core/storage/db';
import { defaults } from '@/core/storage/schemas';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generar código único de 4 letras
 * Excluye letras confusas: I, O (parecidas a 1, 0)
 * @param {Set<string>} existingCodes - Códigos ya generados
 * @returns {string} Código único de 4 letras
 */
function generateUniqueCode(existingCodes) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Sin I, O
  let code;
  let attempts = 0;
  const maxAttempts = 1000;

  do {
    code = Array.from({ length: 4 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
    attempts++;

    if (attempts > maxAttempts) {
      throw new Error('No se pudo generar un código único después de múltiples intentos');
    }
  } while (existingCodes.has(code));

  return code;
}

/**
 * Algoritmo Fisher-Yates para mezclar array
 * @param {Array} array - Array a mezclar
 * @returns {Array} Nuevo array mezclado
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Servicio para gestión de exámenes
 */
export const examService = {
  /**
   * CREATE - Crear un nuevo examen
   * @param {Object} examConfig - Configuración del examen
   * @returns {Promise<Object>} Examen creado
   */
  async create(examConfig) {
    const now = new Date();
    const exam = {
      id: uuidv4(),
      ...defaults.exam,
      ...examConfig,
      createdAt: now,
      updatedAt: now
    };

    // Si es examen diferenciado, generar códigos únicos para cada estudiante
    if (exam.type === 'differentiated' && exam.students.length > 0) {
      const existingCodes = new Set();

      exam.codes = {};
      for (const studentId of exam.students) {
        const code = generateUniqueCode(existingCodes);
        exam.codes[studentId] = code;
        existingCodes.add(code);
      }
    } else {
      exam.codes = {};
    }

    await db.exams.add(exam);
    return exam;
  },

  /**
   * READ - Obtener todos los exámenes
   * @returns {Promise<Array>} Array de exámenes
   */
  async getAll() {
    return await db.exams.toArray();
  },

  /**
   * READ - Obtener examen por ID
   * @param {string} id - ID del examen
   * @returns {Promise<Object|undefined>} Examen encontrado
   */
  async getById(id) {
    return await db.exams.get(id);
  },

  /**
   * READ - Obtener exámenes por tipo
   * @param {string} type - Tipo de examen ('uniform'|'differentiated')
   * @returns {Promise<Array>} Array de exámenes
   */
  async getByType(type) {
    return await db.exams.where('type').equals(type).toArray();
  },

  /**
   * UPDATE - Actualizar un examen
   * @param {string} id - ID del examen
   * @param {Object} updates - Campos a actualizar
   * @returns {Promise<Object>} Examen actualizado
   */
  async update(id, updates) {
    // Si se actualizan los estudiantes en un examen diferenciado, regenerar códigos
    if (updates.students && updates.type === 'differentiated') {
      const existingCodes = new Set();
      const newCodes = {};

      for (const studentId of updates.students) {
        const code = generateUniqueCode(existingCodes);
        newCodes[studentId] = code;
        existingCodes.add(code);
      }

      updates.codes = newCodes;
    }

    await db.exams.update(id, {
      ...updates,
      updatedAt: new Date()
    });

    return await db.exams.get(id);
  },

  /**
   * DELETE - Eliminar un examen
   * @param {string} id - ID del examen
   * @returns {Promise<void>}
   */
  async delete(id) {
    await db.exams.delete(id);
  },

  /**
   * Generar versión específica de un examen para un estudiante
   * Aplica aleatorización según configuración
   * @param {string} examId - ID del examen
   * @param {string} studentId - ID del estudiante
   * @returns {Promise<Object>} Versión generada del examen
   */
  async generateExamVersion(examId, studentId) {
    const exam = await db.exams.get(examId);
    if (!exam) throw new Error('Examen no encontrado');

    // Cargar preguntas
    const questions = await Promise.all(
      exam.questions.map(qId => db.questions.get(qId))
    );

    let finalQuestions = questions.filter(Boolean); // Filtrar null/undefined

    // Aplicar aleatorización de preguntas
    if (exam.randomization.shuffleQuestions) {
      finalQuestions = shuffleArray(finalQuestions);
    }

    // Aplicar aleatorización de alternativas
    if (exam.randomization.shuffleAlternatives) {
      finalQuestions = finalQuestions.map(q => {
        if (q.type === 'multiple' || q.type === 'boolean') {
          return {
            ...q,
            alternatives: shuffleArray(q.alternatives)
          };
        }
        return q;
      });
    }

    return {
      examId: exam.id,
      examTitle: exam.title,
      studentId,
      code: exam.codes[studentId] || null,
      questions: finalQuestions,
      date: exam.date
    };
  },

  /**
   * Generar gabarito (respuestas correctas) del examen
   * @param {string} examId - ID del examen
   * @returns {Promise<Object>} Gabarito con respuestas correctas
   */
  async generateAnswerKey(examId) {
    const exam = await db.exams.get(examId);
    if (!exam) throw new Error('Examen no encontrado');

    const questions = await Promise.all(
      exam.questions.map(qId => db.questions.get(qId))
    );

    const answerKey = questions.map((q, index) => {
      if (q.type === 'multiple' || q.type === 'boolean') {
        const correctAlternatives = q.alternatives
          .filter(a => a.isCorrect)
          .map(a => a.id);

        return {
          questionNumber: index + 1,
          questionId: q.id,
          questionText: q.text,
          correctAlternatives,
          type: q.type
        };
      }

      return {
        questionNumber: index + 1,
        questionId: q.id,
        questionText: q.text,
        type: q.type
      };
    });

    return {
      examId: exam.id,
      examTitle: exam.title,
      answerKey
    };
  },

  /**
   * Obtener estadísticas del examen
   * @param {string} examId - ID del examen
   * @returns {Promise<Object>} Estadísticas
   */
  async getExamStats(examId) {
    const exam = await db.exams.get(examId);
    if (!exam) throw new Error('Examen no encontrado');

    const questions = await Promise.all(
      exam.questions.map(qId => db.questions.get(qId))
    );

    const results = await db.results.where('examId').equals(examId).toArray();

    return {
      totalQuestions: questions.length,
      totalStudents: exam.students.length,
      correctedCount: results.length,
      pendingCount: exam.students.length - results.length,
      averageScore: results.length > 0
        ? results.reduce((sum, r) => sum + r.score, 0) / results.length
        : 0,
      questionTypes: {
        multiple: questions.filter(q => q.type === 'multiple').length,
        boolean: questions.filter(q => q.type === 'boolean').length,
        development: questions.filter(q => q.type === 'development').length
      }
    };
  },

  /**
   * Validar configuración de examen
   * @param {Object} exam - Configuración del examen
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validate(exam) {
    const errors = [];

    if (!exam.title || exam.title.trim() === '') {
      errors.push('El título es obligatorio');
    }

    if (!exam.date) {
      errors.push('La fecha es obligatoria');
    }

    if (!exam.questions || exam.questions.length === 0) {
      errors.push('Debe incluir al menos una pregunta');
    }

    if (exam.type === 'differentiated' && (!exam.students || exam.students.length === 0)) {
      errors.push('Examen diferenciado requiere estudiantes asignados');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

export default examService;

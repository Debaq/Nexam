import { db } from '@/core/storage/db';
import { defaults } from '@/core/storage/schemas';
import { v4 as uuidv4 } from 'uuid';
import { giftParser } from '@/core/export/giftParser';

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

    let finalQuestions;

    // Si el examen está finalizado Y tiene versiones guardadas, usarlas
    if (exam.status === 'finalized' && exam.finalizedVersions) {
      if (exam.type === 'differentiated') {
        // Para exámenes diferenciados, obtener la versión específica del estudiante
        const studentVersion = exam.finalizedVersions.versions[studentId];
        if (studentVersion) {
          finalQuestions = studentVersion.questions;
        } else {
          // Si no existe versión para este estudiante, usar el snapshot sin aleatorizar
          finalQuestions = [...exam.questionSnapshots];
        }
      } else {
        // Para exámenes uniformes, usar la versión única
        finalQuestions = exam.finalizedVersions.version.questions;
      }
    } else if (exam.status === 'finalized' && exam.questionSnapshots) {
      // Fallback: si no hay finalizedVersions pero sí snapshots (exámenes viejos)
      finalQuestions = [...exam.questionSnapshots];

      // Aplicar aleatorización (para compatibilidad con exámenes antiguos)
      if (exam.randomization.shuffleQuestions) {
        finalQuestions = shuffleArray(finalQuestions);
      }

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
    } else {
      // Examen borrador: cargar preguntas y aplicar aleatorización en tiempo real
      const questions = await Promise.all(
        exam.questions.map(qId => db.questions.get(qId))
      );
      finalQuestions = questions.filter(Boolean);

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
    }

    return {
      examId: exam.id,
      examTitle: exam.title,
      studentId,
      code: exam.codes[studentId] || null,
      questions: finalQuestions,
      date: exam.date,
      duration: exam.duration || 90,
      pointsPerQuestion: exam.pointsPerQuestion || 1,
      grading: exam.grading || {
        maxGrade: 7.0,
        minGrade: 1.0,
        passingGrade: 4.0,
        demandPercentage: 60
      },
      pdfOptions: exam.pdfOptions || {
        instructions: 'Lea cuidadosamente cada pregunta antes de responder. Marque sus respuestas en la hoja de respuestas adjunta.',
        showInstructions: true
      }
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
  },

  /**
   * Duplicar un examen (sin estudiantes)
   * @param {string} examId - ID del examen a duplicar
   * @returns {Promise<Object>} Examen duplicado
   */
  async duplicate(examId) {
    const originalExam = await db.exams.get(examId);
    if (!originalExam) throw new Error('Examen no encontrado');

    const now = new Date();
    const duplicatedExam = {
      ...originalExam,
      id: uuidv4(),
      title: `${originalExam.title} (Copia)`,
      students: [], // Sin estudiantes
      codes: {}, // Sin códigos
      createdAt: now,
      updatedAt: now
    };

    await db.exams.add(duplicatedExam);
    return duplicatedExam;
  },

  /**
   * Obtener carpetas únicas
   * @returns {Promise<Array>} Array de nombres de carpetas
   */
  async getFolders() {
    const exams = await db.exams.toArray();
    const folders = [...new Set(exams.map(e => e.folder || 'Sin carpeta'))];
    return folders.sort();
  },

  /**
   * Obtener exámenes por carpeta
   * @param {string} folder - Nombre de la carpeta
   * @returns {Promise<Array>} Array de exámenes
   */
  async getByFolder(folder) {
    return await db.exams.where('folder').equals(folder).toArray();
  },

  /**
   * Mover examen a carpeta
   * @param {string} examId - ID del examen
   * @param {string} folder - Nombre de la carpeta
   * @returns {Promise<Object>} Examen actualizado
   */
  async moveToFolder(examId, folder) {
    await db.exams.update(examId, {
      folder: folder || 'Sin carpeta',
      updatedAt: new Date()
    });
    return await db.exams.get(examId);
  },

  /**
   * Exportar examen a formato GIFT
   * @param {string} examId - ID del examen
   * @returns {Promise<Object>} { filename, content } para descarga
   */
  async exportToGift(examId) {
    const exam = await db.exams.get(examId);
    if (!exam) throw new Error('Examen no encontrado');

    // Obtener todas las preguntas del examen
    const questions = await Promise.all(
      exam.questions.map(qId => db.questions.get(qId))
    );

    const validQuestions = questions.filter(Boolean);

    if (validQuestions.length === 0) {
      throw new Error('El examen no tiene preguntas para exportar');
    }

    // Generar contenido GIFT
    const giftContent = giftParser.export(validQuestions);

    // Generar nombre de archivo seguro
    const safeTitle = exam.title.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${safeTitle}_${timestamp}.gift`;

    return {
      filename,
      content: giftContent,
      questionCount: validQuestions.length
    };
  },

  /**
   * Finalizar examen - Hace el examen inmutable y crea snapshot de preguntas
   * ADVERTENCIA: Esta operación es irreversible
   * @param {string} examId - ID del examen
   * @returns {Promise<Object>} Examen finalizado
   */
  async finalize(examId) {
    const exam = await db.exams.get(examId);
    if (!exam) throw new Error('Examen no encontrado');

    if (exam.status === 'finalized') {
      throw new Error('Este examen ya ha sido finalizado');
    }

    // Obtener todas las preguntas actuales y crear snapshot
    const questions = await Promise.all(
      exam.questions.map(qId => db.questions.get(qId))
    );

    const questionSnapshots = questions.filter(Boolean).map(q => ({
      ...q,
      // Crear una copia profunda para evitar referencias
      alternatives: q.alternatives ? JSON.parse(JSON.stringify(q.alternatives)) : [],
      items: q.items ? JSON.parse(JSON.stringify(q.items)) : [],
      combinations: q.combinations ? JSON.parse(JSON.stringify(q.combinations)) : []
    }));

    if (questionSnapshots.length === 0) {
      throw new Error('El examen debe tener al menos una pregunta para ser finalizado');
    }

    // Generar las versiones finales con aleatorización (SOLO UNA VEZ)
    const finalizedVersions = this._generateFinalVersions(exam, questionSnapshots);

    // Actualizar examen a estado finalizado
    const finalizedExam = {
      ...exam,
      status: 'finalized',
      questionSnapshots,
      finalizedVersions, // Guardar versiones para que sean inmutables
      finalizedAt: new Date(),
      updatedAt: new Date()
    };

    await db.exams.put(finalizedExam);
    return finalizedExam;
  },

  /**
   * Genera gabarito (respuestas correctas) para una versión específica del examen
   * @private
   */
  _generateAnswerKey(questions) {
    return questions.map((q, index) => {
      const questionNumber = index + 1;

      if (q.type === 'multiple') {
        // Encontrar índice de alternativa correcta (después de aleatorización)
        const correctIndex = q.alternatives.findIndex(alt => alt.isCorrect);
        const correctLetter = correctIndex !== -1 ? String.fromCharCode(65 + correctIndex) : null;

        return {
          question: questionNumber,
          questionId: q.id,
          type: 'multiple',
          correctAnswer: correctLetter, // A, B, C, D, E
          correctIndex: correctIndex,
          allAlternatives: q.alternatives.map((alt, idx) => ({
            letter: String.fromCharCode(65 + idx),
            text: alt.text,
            isCorrect: alt.isCorrect
          }))
        };
      } else if (q.type === 'boolean') {
        const correctIndex = q.alternatives.findIndex(alt => alt.isCorrect);
        const correctLetter = correctIndex === 0 ? 'V' : 'F';

        return {
          question: questionNumber,
          questionId: q.id,
          type: 'boolean',
          correctAnswer: correctLetter,
          correctIndex: correctIndex
        };
      } else if (q.type === 'matching') {
        // Para tipo matching, guardar combinaciones correctas
        const correctCombinations = q.combinations?.filter(c => c.isCorrect).map(c => c.id) || [];

        return {
          question: questionNumber,
          questionId: q.id,
          type: 'matching',
          correctCombinations: correctCombinations
        };
      } else if (q.type === 'development') {
        return {
          question: questionNumber,
          questionId: q.id,
          type: 'development',
          correctAnswer: null, // Requiere corrección manual
          points: q.points || 1
        };
      }

      return null;
    }).filter(Boolean);
  },

  /**
   * Generar versiones finales con aleatorización aplicada
   * Esto se llama SOLO una vez al finalizar el examen
   * @private
   */
  _generateFinalVersions(exam, questions) {
    if (exam.type === 'differentiated') {
      const versions = {};
      const answerKeys = {}; // ← NUEVO: Guardar gabarito por versión

      exam.students.forEach(studentId => {
        let studentQuestions = [...questions];

        // Aplicar aleatorización
        if (exam.randomization.shuffleQuestions) {
          studentQuestions = shuffleArray(studentQuestions);
        }

        if (exam.randomization.shuffleAlternatives) {
          studentQuestions = studentQuestions.map(q => {
            if (q.type === 'multiple' || q.type === 'boolean') {
              return {
                ...q,
                alternatives: shuffleArray(q.alternatives)
              };
            }
            return q;
          });
        }

        // Generar gabarito DESPUÉS de aleatorización
        const answerKey = this._generateAnswerKey(studentQuestions);

        versions[studentId] = {
          code: exam.codes[studentId] || null,
          questions: studentQuestions
        };

        answerKeys[studentId] = answerKey;
      });

      return {
        type: 'differentiated',
        versions,
        answerKeys // ← NUEVO: Gabaritos por estudiante
      };
    } else {
      // Examen uniforme - una sola versión
      let uniformQuestions = [...questions];

      if (exam.randomization.shuffleQuestions) {
        uniformQuestions = shuffleArray(uniformQuestions);
      }

      if (exam.randomization.shuffleAlternatives) {
        uniformQuestions = uniformQuestions.map(q => {
          if (q.type === 'multiple' || q.type === 'boolean') {
            return {
              ...q,
              alternatives: shuffleArray(q.alternatives)
            };
          }
          return q;
        });
      }

      // Generar gabarito DESPUÉS de aleatorización
      const answerKey = this._generateAnswerKey(uniformQuestions);

      return {
        type: 'uniform',
        version: { questions: uniformQuestions },
        answerKey // ← NUEVO: Gabarito único para examen uniforme
      };
    }
  },

  /**
   * Copiar examen (especialmente útil para exámenes finalizados)
   * Crea un nuevo examen editable a partir de uno existente
   * - Si las preguntas existen en el banco, usa las referencias actualizadas
   * - Si las preguntas no existen, las recrea en categoría "[Nombre] (copia)"
   * @param {string} examId - ID del examen a copiar
   * @returns {Promise<Object>} Nuevo examen creado
   */
  async copyExam(examId) {
    const originalExam = await db.exams.get(examId);
    if (!originalExam) throw new Error('Examen no encontrado');

    const categoryName = `${originalExam.title} (copia)`;
    const questionIds = [];

    // Determinar de dónde obtener las preguntas
    const sourceQuestions = originalExam.status === 'finalized' && originalExam.questionSnapshots
      ? originalExam.questionSnapshots
      : await Promise.all(originalExam.questions.map(qId => db.questions.get(qId)));

    // Procesar cada pregunta del examen original
    for (const sourceQuestion of sourceQuestions) {
      if (!sourceQuestion) continue;

      // Intentar encontrar la pregunta en el banco actual
      let questionInBank;

      if (originalExam.status === 'finalized') {
        // Para exámenes finalizados, buscar por ID original
        questionInBank = await db.questions.get(sourceQuestion.id);
      } else {
        // Para borradores, ya tenemos el ID
        questionInBank = sourceQuestion;
      }

      if (questionInBank) {
        // La pregunta existe en el banco → usar su referencia (se actualizará automáticamente)
        questionIds.push(questionInBank.id);
      } else {
        // La pregunta NO existe en el banco → crear una copia nueva
        const newQuestion = {
          ...sourceQuestion,
          id: uuidv4(), // Nuevo ID
          category: categoryName, // Categoría especial para preguntas recuperadas
          createdAt: new Date(),
          updatedAt: new Date(),
          statistics: {
            timesUsed: 0,
            averageScore: 0
          }
        };

        // Limpiar campos que no deben copiarse
        delete newQuestion.finalizedAt;
        delete newQuestion.questionSnapshots;

        // Guardar la nueva pregunta en el banco
        await db.questions.add(newQuestion);
        questionIds.push(newQuestion.id);
      }
    }

    // Crear el nuevo examen (siempre como borrador)
    const newExam = {
      id: uuidv4(),
      ...defaults.exam,
      title: `${originalExam.title} (copia)`,
      date: originalExam.date,
      duration: originalExam.duration,
      folder: originalExam.folder,
      type: originalExam.type,
      questions: questionIds,
      students: [], // No copiar estudiantes
      codes: {}, // No copiar códigos
      randomization: { ...originalExam.randomization },
      grading: { ...originalExam.grading },
      pdfOptions: originalExam.pdfOptions ? { ...originalExam.pdfOptions } : undefined,
      status: 'draft', // IMPORTANTE: siempre crear como borrador
      questionSnapshots: null,
      finalizedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.exams.add(newExam);
    return newExam;
  },

  /**
   * Generar archivo de metadatos para exportación
   * Incluye información completa del examen y explicación del sistema de seguridad
   * @param {Object} exam - Examen finalizado
   * @returns {string} Contenido del archivo de metadatos
   */
  generateMetadata(exam) {
    const metadata = {
      // Información del examen
      examInfo: {
        id: exam.id,
        title: exam.title,
        date: exam.date,
        duration: exam.duration,
        type: exam.type,
        folder: exam.folder,
        status: exam.status,
        createdAt: exam.createdAt,
        finalizedAt: exam.finalizedAt
      },

      // Configuración
      configuration: {
        grading: exam.grading,
        randomization: exam.randomization,
        pdfOptions: exam.pdfOptions || {}
      },

      // Estadísticas
      statistics: {
        totalQuestions: exam.questionSnapshots ? exam.questionSnapshots.length : exam.questions.length,
        totalStudents: exam.students.length,
        totalCodes: Object.keys(exam.codes || {}).length
      },

      // Sistema de seguridad
      securityInfo: {
        version: '1.0',
        description: 'Sistema de Seguridad y Trazabilidad de Exámenes',
        explanation: `
Este examen ha sido FINALIZADO y forma parte de un sistema de seguridad y trazabilidad.

¿QUÉ SIGNIFICA QUE UN EXAMEN ESTÉ FINALIZADO?
================================================

1. INMUTABILIDAD GARANTIZADA:
   - El examen y sus preguntas están bloqueados permanentemente
   - No se pueden realizar modificaciones de ningún tipo
   - Cualquier cambio en la base de datos original NO afectará este examen

2. SNAPSHOT DE PREGUNTAS:
   - Se ha creado una copia exacta de todas las preguntas en el momento de finalización
   - Esta copia está almacenada dentro del examen mismo
   - Garantiza que las preguntas permanezcan idénticas incluso si se modifican en el banco

3. TRAZABILIDAD COMPLETA:
   - Fecha de creación: ${new Date(exam.createdAt).toLocaleString('es-CL')}
   - Fecha de finalización: ${exam.finalizedAt ? new Date(exam.finalizedAt).toLocaleString('es-CL') : 'N/A'}
   - ID único del examen: ${exam.id}
   - Total de preguntas incluidas: ${exam.questionSnapshots ? exam.questionSnapshots.length : exam.questions.length}

4. VERIFICACIÓN DE INTEGRIDAD:
   - Este archivo de metadatos sirve como registro oficial
   - Contiene toda la configuración exacta del examen
   - Permite verificar que el examen no ha sido alterado

¿POR QUÉ ESTE SISTEMA DE SEGURIDAD?
====================================

Este sistema garantiza:
- Integridad académica
- Imposibilidad de modificar exámenes después de su aplicación
- Trazabilidad completa para auditorías
- Protección contra cambios accidentales o intencionales
- Registro permanente de la configuración exacta utilizada

IMPORTANTE:
===========
- Los PDFs generados de un examen FINALIZADO son versiones OFICIALES
- Los PDFs de un examen en BORRADOR incluyen marca de agua "BORRADOR"
- Solo se puede finalizar un examen UNA VEZ
- La finalización es IRREVERSIBLE

Generado por: Nexam - Sistema Inteligente de Evaluación Educativa
Fecha de generación de metadatos: ${new Date().toLocaleString('es-CL')}
        `.trim()
      }
    };

    return JSON.stringify(metadata, null, 2);
  }
};

export default examService;

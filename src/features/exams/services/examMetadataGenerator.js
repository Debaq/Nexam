/**
 * Servicio para generar metadata detallada de exámenes
 * Incluye información de preguntas, respuestas correctas y versiones
 * para revisión manual en caso de fallos
 */

/**
 * Generar metadata con preguntas y respuestas correctas para todas las versiones posibles
 * @param {Object} exam - Examen finalizado
 * @returns {Object} Metadata detallada con respuestas correctas
 */
export function generateCompleteMetadata(exam) {
  // Verificar que el examen esté finalizado
  if (exam.status !== 'finalized' || !exam.questionSnapshots) {
    throw new Error('El examen debe estar finalizado para generar metadata completa');
  }

  // Obtener las preguntas desde el snapshot
  const questions = exam.questionSnapshots;

  // Generar metadata basada en la estructura existente
  const baseMetadata = {
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
      totalQuestions: questions.length,
      totalStudents: exam.students.length,
      totalCodes: Object.keys(exam.codes || {}).length
    }
  };

  // Generar información de respuestas correctas
  const answerKey = generateAnswerKeyFromQuestions(questions);

  // Si es examen diferenciado, incluir información específica por estudiante
  const versionsInfo = generateVersionsInfo(exam, questions);

  // Combinar toda la metadata
  const completeMetadata = {
    ...baseMetadata,
    answerKey: {
      questions: answerKey,
      totalQuestions: answerKey.length
    },
    versions: versionsInfo,
    generatedAt: new Date().toISOString(),
    exportPurpose: 'Backup para revisión manual en caso de fallos del sistema'
  };

  return completeMetadata;
}

/**
 * Generar la clave de respuestas desde preguntas en snapshot
 * @param {Array} questions - Array de preguntas desde el snapshot
 * @returns {Array} Array con información de respuestas correctas
 */
function generateAnswerKeyFromQuestions(questions) {
  return questions.map((q, index) => {
    const questionInfo = {
      questionNumber: index + 1,
      questionId: q.id,
      questionText: q.text,
      type: q.type,
      category: q.category,
      difficulty: q.difficulty
    };

    if (q.type === 'multiple' || q.type === 'boolean') {
      const correctAlternatives = q.alternatives
        .filter(a => a.isCorrect)
        .map(a => ({
          id: a.id,
          text: a.text,
          isCorrect: a.isCorrect
        }));

      return {
        ...questionInfo,
        correctAlternatives,
        allAlternatives: q.alternatives.map(a => ({
          id: a.id,
          text: a.text,
          isCorrect: a.isCorrect
        }))
      };
    }

    return questionInfo;
  });
}

/**
 * Generar información de versiones dependiendo del tipo de examen
 * IMPORTANTE: Para exámenes finalizados, usa las versiones guardadas
 * @param {Object} exam - Examen
 * @param {Array} questions - Preguntas del examen (solo se usa si no hay finalizedVersions)
 * @returns {Object} Información sobre las versiones posibles
 */
function generateVersionsInfo(exam, questions) {
  // Si el examen tiene versiones finalizadas guardadas, usarlas directamente
  if (exam.finalizedVersions) {
    if (exam.type === 'differentiated') {
      const versions = {};

      // Usar las versiones ya guardadas
      Object.entries(exam.finalizedVersions.versions).forEach(([studentId, versionData]) => {
        const studentQuestions = versionData.questions;

        versions[studentId] = {
          code: versionData.code,
          questionOrder: studentQuestions.map(q => q.id),
          questionsWithCorrectAnswers: studentQuestions.map((q, idx) => {
            if (q.type === 'multiple' || q.type === 'boolean') {
              const correctAlternatives = q.alternatives
                .filter(a => a.isCorrect)
                .map(a => a.id);

              return {
                questionId: q.id,
                questionNumber: idx + 1,
                questionText: q.text,
                type: q.type,
                correctAlternatives,
                alternatives: q.alternatives.map(a => ({
                  id: a.id,
                  text: a.text,
                  isCorrect: a.isCorrect
                }))
              };
            }
            return {
              questionId: q.id,
              questionNumber: idx + 1,
              questionText: q.text,
              type: q.type
            };
          })
        };
      });

      return {
        type: 'differentiated',
        totalStudents: exam.students.length,
        versions: versions
      };
    } else {
      // Examen uniforme con versión guardada
      const uniformQuestions = exam.finalizedVersions.version.questions;

      return {
        type: 'uniform',
        version: {
          questionOrder: uniformQuestions.map(q => q.id),
          questionsWithCorrectAnswers: uniformQuestions.map((q, idx) => {
            if (q.type === 'multiple' || q.type === 'boolean') {
              const correctAlternatives = q.alternatives
                .filter(a => a.isCorrect)
                .map(a => a.id);

              return {
                questionId: q.id,
                questionNumber: idx + 1,
                questionText: q.text,
                type: q.type,
                correctAlternatives,
                alternatives: q.alternatives.map(a => ({
                  id: a.id,
                  text: a.text,
                  isCorrect: a.isCorrect
                }))
              };
            }
            return {
              questionId: q.id,
              questionNumber: idx + 1,
              questionText: q.text,
              type: q.type
            };
          })
        }
      };
    }
  }

  // Fallback: Si no hay finalizedVersions, generar con aleatorización (para compatibilidad)
  if (exam.type === 'differentiated') {
    // Para exámenes diferenciados, crear una entrada por estudiante
    const versions = {};

    exam.students.forEach(studentId => {
      const code = exam.codes[studentId] || null;

      // Generar la versión específica para este estudiante
      let studentQuestions = [...questions];

      // Aplicar aleatorización si está configurada
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

      versions[studentId] = {
        code: code,
        questionOrder: studentQuestions.map(q => q.id),
        questionsWithCorrectAnswers: studentQuestions.map(q => {
          if (q.type === 'multiple' || q.type === 'boolean') {
            const correctAlternatives = q.alternatives
              .filter(a => a.isCorrect)
              .map(a => a.id);

            return {
              questionId: q.id,
              questionNumber: studentQuestions.findIndex(sq => sq.id === q.id) + 1,
              questionText: q.text,
              type: q.type,
              correctAlternatives,
              alternatives: q.alternatives.map(a => ({
                id: a.id,
                text: a.text,
                isCorrect: a.isCorrect
              }))
            };
          }
          return {
            questionId: q.id,
            questionNumber: studentQuestions.findIndex(sq => sq.id === q.id) + 1,
            questionText: q.text,
            type: q.type
          };
        })
      };
    });

    return {
      type: 'differentiated',
      totalStudents: exam.students.length,
      versions: versions
    };
  } else {
    // Para exámenes uniformes, solo una versión
    let uniformQuestions = [...questions];

    // Aplicar aleatorización si está configurada
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

    return {
      type: 'uniform',
      version: {
        questionOrder: uniformQuestions.map(q => q.id),
        questionsWithCorrectAnswers: uniformQuestions.map(q => {
          if (q.type === 'multiple' || q.type === 'boolean') {
            const correctAlternatives = q.alternatives
              .filter(a => a.isCorrect)
              .map(a => a.id);

            return {
              questionId: q.id,
              questionNumber: uniformQuestions.findIndex(sq => sq.id === q.id) + 1,
              questionText: q.text,
              type: q.type,
              correctAlternatives,
              alternatives: q.alternatives.map(a => ({
                id: a.id,
                text: a.text,
                isCorrect: a.isCorrect
              }))
            };
          }
          return {
            questionId: q.id,
            questionNumber: uniformQuestions.findIndex(sq => sq.id === q.id) + 1,
            questionText: q.text,
            type: q.type
          };
        })
      }
    };
  }
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
 * Generar archivo de resumen de respuestas correctas
 * @param {Array} questions - Preguntas con respuestas correctas
 * @param {string} examTitle - Título del examen
 * @returns {string} Contenido del archivo de resumen
 */
export function generateAnswerSummary(questions, examTitle) {
  let content = `GABARITO DE RESPUESTAS - ${examTitle}\n`;
  content += '='.repeat(60) + '\n\n';

  questions.forEach((q, index) => {
    content += `PREGUNTA ${index + 1}\n`;
    content += `Tipo: ${q.type}\n`;
    content += `Pregunta: ${q.questionText}\n`;

    if (q.correctAlternatives && q.correctAlternatives.length > 0) {
      content += 'Respuestas correctas:\n';
      q.correctAlternatives.forEach(correct => {
        content += `  - ${correct.text} (ID: ${correct.id})\n`;
      });
    } else {
      content += 'Respuesta correcta: [Desarrollo u otros tipos sin alternativas]\n';
    }

    content += '\n';
  });

  return content;
}

/**
 * Generar archivo de pauta detallada con respuestas correctas
 * @param {Object} completeMetadata - Metadata completa generada
 * @returns {string} Contenido del archivo de pauta
 */
export function generateDetailedAnswerKey(completeMetadata) {
  const { examInfo, answerKey } = completeMetadata;
  
  let content = `PAUTA DETALLADA DE RESPUESTAS - ${examInfo.title}\n`;
  content += '='.repeat(60) + '\n';
  content += `Examen ID: ${examInfo.id}\n`;
  content += `Fecha: ${new Date(examInfo.date).toLocaleString('es-CL')}\n`;
  content += `Tipo: ${examInfo.type}\n`;
  content += `Generado: ${new Date(completeMetadata.generatedAt).toLocaleString('es-CL')}\n\n`;

  content += `ESTRUCTURA DEL EXAMEN:\n`;
  content += `Total de preguntas: ${answerKey.totalQuestions}\n\n`;

  answerKey.questions.forEach(q => {
    content += `PREGUNTA ${q.questionNumber}: ${q.questionText}\n`;
    content += `Categoría: ${q.category || 'No especificada'}\n`;
    content += `Dificultad: ${q.difficulty?.manual || 'No especificada'}\n`;
    content += `Tipo: ${q.type}\n`;

    if (q.correctAlternatives && q.correctAlternatives.length > 0) {
      content += `Respuestas correctas:\n`;
      q.correctAlternatives.forEach(correct => {
        content += `  • ${correct.text}\n`;
      });
    } else {
      content += `Tipo de respuesta: ${q.type === 'development' ? 'Desarrollo' : 'Otro'}\n`;
    }

    content += '\n' + '-'.repeat(50) + '\n\n';
  });

  return content;
}
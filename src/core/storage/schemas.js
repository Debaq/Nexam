/**
 * Schemas de datos para IndexedDB
 * Define la estructura de cada entidad en la base de datos
 */

/**
 * @typedef {Object} Alternative
 * @property {string} id - ID único de la alternativa
 * @property {string} text - Texto de la alternativa
 * @property {boolean} isCorrect - Si es la respuesta correcta
 * @property {string} [feedback] - Retroalimentación opcional
 */

/**
 * @typedef {Object} Item
 * @property {string} id - ID único del item
 * @property {string} text - Texto del item
 */

/**
 * @typedef {Object} Combination
 * @property {string} id - ID único de la combinación
 * @property {string} text - Texto de la combinación (ej: "Solo I", "I y II", etc.)
 * @property {string[]} itemIds - IDs de los items que forman esta combinación
 * @property {boolean} isCorrect - Si es la respuesta correcta
 */

/**
 * @typedef {Object} Question
 * @property {string} id - UUID único
 * @property {string} text - Texto de la pregunta
 * @property {'multiple'|'boolean'|'development'|'matching'} type - Tipo de pregunta
 * @property {Alternative[]} [alternatives] - Array de alternativas para tipos que las usan
 * @property {Item[]} [items] - Array de items para tipo matching
 * @property {Combination[]} [combinations] - Array de combinaciones para tipo matching
 * @property {string} category - Categoría (ej: "Matemáticas")
 * @property {string[]} tags - Tags para filtrado
 * @property {Object} difficulty - Nivel de dificultad
 * @property {'easy'|'medium'|'hard'} difficulty.manual - Dificultad manual
 * @property {number} difficulty.automatic - Dificultad calculada (0-1)
 * @property {Object} feedback - Retroalimentación
 * @property {string} feedback.general - Feedback general
 * @property {Object} feedback.byAlternative - Feedback por alternativa
 * @property {Object} statistics - Estadísticas de uso
 * @property {number} statistics.timesUsed - Veces utilizada
 * @property {number} statistics.averageScore - Puntaje promedio
 * @property {Object} [image] - Imagen opcional
 * @property {Blob} image.data - Datos de la imagen
 * @property {string} image.alt - Texto alternativo
 * @property {Date} createdAt - Fecha de creación
 * @property {Date} updatedAt - Fecha de actualización
 */

/**
 * @typedef {Object} Exam
 * @property {string} id - UUID único
 * @property {string} title - Título del examen
 * @property {Date} date - Fecha del examen
 * @property {string[]} questions - IDs de preguntas incluidas
 * @property {'uniform'|'differentiated'} type - Tipo de evaluación
 * @property {Object} randomization - Configuración de aleatorización
 * @property {boolean} randomization.shuffleQuestions - Mezclar preguntas
 * @property {boolean} randomization.shuffleAlternatives - Mezclar alternativas
 * @property {string[]} students - IDs de estudiantes asignados
 * @property {Object} codes - Mapa studentId -> código único
 * @property {string} folder - Carpeta/categoría del examen
 * @property {Object} grading - Configuración de calificación
 * @property {number} grading.maxGrade - Nota máxima (default: 7.0)
 * @property {number} grading.minGrade - Nota mínima (default: 1.0)
 * @property {number} grading.passingGrade - Nota de aprobación (default: 4.0)
 * @property {number} grading.demandPercentage - Porcentaje de exigencia (default: 60)
 * @property {'draft'|'finalized'} status - Estado del examen (draft: borrador, finalized: finalizado e inmutable)
 * @property {Question[]} [questionSnapshots] - Copia inmutable de las preguntas (solo cuando status='finalized')
 * @property {Date} [finalizedAt] - Fecha de finalización (cuando se generó la versión final)
 * @property {Date} createdAt - Fecha de creación
 * @property {Date} updatedAt - Fecha de actualización
 */

/**
 * @typedef {Object} Student
 * @property {string} id - UUID único
 * @property {string} rut - RUT chileno (con formato)
 * @property {string} name - Nombre
 * @property {string} lastName - Apellido
 * @property {string} email - Email
 * @property {Date} createdAt - Fecha de creación
 * @property {Date} updatedAt - Fecha de actualización
 */

/**
 * @typedef {Object} Result
 * @property {string} id - UUID único
 * @property {string} examId - ID del examen
 * @property {string} [studentId] - ID del estudiante (null si no está identificado)
 * @property {string} [detectedRUT] - RUT detectado por OCR (ej: "12.345.678-9")
 * @property {boolean} rutValid - Si el RUT tiene dígito verificador válido
 * @property {number} rutConfidence - Confianza del OCR (0-1)
 * @property {string} [code] - Código único del examen
 * @property {Object[]} answers - Respuestas detectadas
 * @property {number} answers[].question - Número de pregunta
 * @property {string} answers[].selected - Alternativa seleccionada (A, B, C, D, E)
 * @property {number} answers[].confidence - Confianza de YOLO (0-1)
 * @property {string} answers[].markType - Tipo de marca ('mark_X', 'mark_circle', etc.)
 * @property {boolean} answers[].multipleMarks - Si hay múltiples marcas
 * @property {number} score - Puntaje obtenido
 * @property {number} percentage - Porcentaje de respuestas correctas
 * @property {number} [grade] - Nota calculada según escala del examen
 * @property {Object[]} detections - Detecciones crudas de YOLO (para debugging)
 * @property {boolean} needsReview - Si requiere revisión manual
 * @property {string[]} reviewReasons - Razones por las que necesita revisión
 * @property {string} [thumbnail] - Imagen thumbnail en base64 (para preview)
 * @property {string} [alignedImage] - Imagen alineada para vista previa
 * @property {string} [rutImage] - Imagen de la región de RUT
 * @property {string} [tableLeftImage] - Imagen de la tabla izquierda
 * @property {string} [tableRightImage] - Imagen de la tabla derecha
 * @property {number} processingTime - Tiempo de procesamiento en ms
 * @property {Date} correctedAt - Fecha de corrección
 */

/**
 * @typedef {Object} LearningUnit
 * @property {string} id - UUID único de la unidad
 * @property {string} name - Nombre de la unidad (ej: "Unidad 1: Números y Operaciones")
 * @property {number} order - Orden de la unidad en el curso
 * @property {string[]} objectives - Objetivos de aprendizaje de esta unidad
 * @property {number} [weighting] - Ponderación de la unidad en el curso (%)
 */

/**
 * @typedef {Object} Assessment
 * @property {string} id - UUID único de la evaluación
 * @property {string} name - Nombre de la evaluación (ej: "Prueba 1", "Examen Final")
 * @property {'exam'|'quiz'|'project'|'homework'|'participation'|'other'} type - Tipo de evaluación
 * @property {number} weighting - Ponderación en la nota final (%)
 * @property {string} [examId] - ID del examen asociado (si aplica)
 * @property {Date} [date] - Fecha programada
 * @property {string} [unitId] - ID de la unidad a la que pertenece
 */

/**
 * @typedef {Object} Section
 * @property {string} id - UUID único
 * @property {string} name - Nombre de la asignatura/sección (ej: "Matemáticas 8vo Básico")
 * @property {string} code - Código de la asignatura (ej: "MAT-801-A")
 * @property {string} [description] - Descripción de la asignatura
 * @property {number} year - Año académico (ej: 2024)
 * @property {'1'|'2'|'annual'} semester - Semestre en que se dicta
 * @property {Date} startDate - Fecha de inicio del curso
 * @property {Date} endDate - Fecha de término del curso
 * @property {string[]} objectives - Objetivos generales del curso
 * @property {LearningUnit[]} units - Unidades de aprendizaje
 * @property {Assessment[]} assessments - Evaluaciones planificadas
 * @property {string} folder - Nombre de la carpeta para organizar exámenes y preguntas
 * @property {Object} metadata - Metadata adicional para LLM
 * @property {string} [metadata.level] - Nivel educativo (ej: "8vo Básico", "2do Medio")
 * @property {string} [metadata.subject] - Materia (ej: "Matemáticas", "Lenguaje")
 * @property {string[]} [metadata.competencies] - Competencias a desarrollar
 * @property {string[]} [metadata.prerequisites] - Prerequisitos del curso
 * @property {Object} [metadata.curriculum] - Referencias al currículum nacional
 * @property {Date} createdAt - Fecha de creación
 * @property {Date} updatedAt - Fecha de actualización
 */

// Valores por defecto para nuevas entidades
export const defaults = {
  question: {
    type: 'multiple',
    alternatives: [],
    items: [],
    combinations: [],
    category: 'Sin categoría',
    tags: [],
    difficulty: {
      manual: 'medium',
      automatic: 0.5
    },
    feedback: {
      general: '',
      byAlternative: {}
    },
    statistics: {
      timesUsed: 0,
      averageScore: 0
    }
  },

  exam: {
    type: 'uniform',
    randomization: {
      shuffleQuestions: false,
      shuffleAlternatives: false
    },
    questions: [],
    students: [],
    codes: {},
    folder: 'Sin carpeta',
    grading: {
      maxGrade: 7.0,
      minGrade: 1.0,
      passingGrade: 4.0,
      demandPercentage: 60
    },
    status: 'draft',
    questionSnapshots: null,
    finalizedAt: null,
    sectionId: null
  },

  student: {
    email: ''
  },

  result: {
    answers: [],
    score: 0
  },

  section: {
    code: '',
    description: '',
    semester: '1',
    objectives: [],
    units: [],
    assessments: [],
    metadata: {
      level: '',
      subject: '',
      competencies: [],
      prerequisites: [],
      curriculum: {}
    }
  }
};

// Validadores básicos
export const validators = {
  rut: (rut) => {
    // Validación básica de formato RUT chileno
    const rutRegex = /^[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}-[0-9kK]$/;
    return rutRegex.test(rut);
  },

  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  code: (code) => {
    // Código único de 4 letras mayúsculas
    return /^[A-Z]{4}$/.test(code);
  }
};

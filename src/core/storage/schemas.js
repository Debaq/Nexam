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
 * @typedef {Object} Question
 * @property {string} id - UUID único
 * @property {string} text - Texto de la pregunta
 * @property {'multiple'|'boolean'|'development'} type - Tipo de pregunta
 * @property {Alternative[]} alternatives - Array de alternativas
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
 * @property {string} studentId - ID del estudiante
 * @property {string} code - Código único del examen
 * @property {Object[]} answers - Respuestas detectadas
 * @property {number} score - Puntaje obtenido
 * @property {Date} correctedAt - Fecha de corrección
 * @property {Object} [imageData] - Datos de la imagen escaneada
 */

// Valores por defecto para nuevas entidades
export const defaults = {
  question: {
    type: 'multiple',
    alternatives: [],
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
    folder: 'Sin carpeta'
  },

  student: {
    email: ''
  },

  result: {
    answers: [],
    score: 0
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

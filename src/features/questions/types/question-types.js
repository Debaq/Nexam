/**
 * Tipos de preguntas
 * 
 * multiple: Pregunta de selección múltiple con alternativas ABCD
 * boolean: Pregunta de verdadero/falso
 * development: Pregunta de desarrollo abierta
 * matching: Pregunta de matching con items I, II, III y combinaciones
 */

// Tipos de preguntas soportados
export const QUESTION_TYPES = {
  MULTIPLE: 'multiple',
  BOOLEAN: 'boolean',
  DEVELOPMENT: 'development',
  MATCHING: 'matching' // Nuevo tipo para preguntas de items y combinaciones
};

// Definición de estructura para diferentes tipos de preguntas
export const questionStructure = {
  // Estructura base común para todas las preguntas
  base: {
    id: String,
    text: String,
    category: String,
    tags: Array,
    difficulty: Object,
    feedback: Object,
    statistics: Object,
    image: Object,
    createdAt: Date,
    updatedAt: Date
  },

  // Estructura específica por tipo
  [QUESTION_TYPES.MULTIPLE]: {
    type: QUESTION_TYPES.MULTIPLE,
    alternatives: Array
  },

  [QUESTION_TYPES.BOOLEAN]: {
    type: QUESTION_TYPES.BOOLEAN,
    alternatives: Array
  },

  [QUESTION_TYPES.DEVELOPMENT]: {
    type: QUESTION_TYPES.DEVELOPMENT,
    alternatives: Array // opcional, podría tener ejemplos de respuesta
  },

  [QUESTION_TYPES.MATCHING]: {
    type: QUESTION_TYPES.MATCHING,
    items: Array, // Array de objetos con id, text, order
    combinations: Array // Array de objetos con id, text, itemIds (que items forman esta combinación)
  }
};

// Función para validar una pregunta según su tipo
export const validateQuestion = (question) => {
  const errors = [];

  if (!question.text || question.text.trim() === '') {
    errors.push('El texto de la pregunta es obligatorio');
  }

  if (!Object.values(QUESTION_TYPES).includes(question.type)) {
    errors.push('Tipo de pregunta inválido');
  }

  switch (question.type) {
    case QUESTION_TYPES.MULTIPLE:
    case QUESTION_TYPES.BOOLEAN:
      if (!question.alternatives || question.alternatives.length < 2) {
        errors.push('Se requieren al menos 2 alternativas');
      }
      const correctCount = question.alternatives?.filter(a => a.isCorrect).length || 0;
      if (correctCount === 0) {
        errors.push('Debe haber al menos una alternativa correcta');
      }
      break;

    case QUESTION_TYPES.MATCHING:
      if (!question.items || question.items.length < 2) {
        errors.push('Se requieren al menos 2 items');
      }
      if (!question.combinations || question.combinations.length < 2) {
        errors.push('Se requieren al menos 2 combinaciones');
      }
      const correctCombinationCount = question.combinations?.filter(c => c.isCorrect).length || 0;
      if (correctCombinationCount === 0) {
        errors.push('Debe haber al menos una combinación correcta');
      }
      break;

    case QUESTION_TYPES.DEVELOPMENT:
      // No requiere validación específica de alternativas
      break;
  }

  return {
    valid: errors.length === 0,
    errors
  };
};
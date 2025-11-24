import { v4 as uuidv4 } from 'uuid';

/**
 * Parser para formato GIFT (Moodle)
 * Importa y exporta preguntas en formato GIFT
 */
export const giftParser = {
  /**
   * Parsear texto GIFT a array de preguntas
   * @param {string} giftText - Texto en formato GIFT
   * @returns {Array<Object>} Array de preguntas parseadas
   */
  parse(giftText) {
    const questions = [];

    // Limpiar el texto: remover líneas de comentarios al inicio
    const lines = giftText.split('\n');
    const contentLines = [];
    let inQuestion = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Si encontramos una pregunta (:: o una pregunta directa con {)
      if (trimmed.startsWith('::') || (trimmed && !trimmed.startsWith('//'))) {
        inQuestion = true;
      }

      // Solo agregar líneas si estamos en una pregunta
      if (inQuestion) {
        contentLines.push(line);
      }
    }

    const cleanedText = contentLines.join('\n');

    // Separar por preguntas (buscar patrones ::título::)
    const questionBlocks = [];
    let currentBlock = '';

    for (const line of cleanedText.split('\n')) {
      const trimmed = line.trim();

      // Si encontramos un nuevo título de pregunta, guardar el bloque anterior
      if (trimmed.startsWith('::') && currentBlock.trim()) {
        questionBlocks.push(currentBlock.trim());
        currentBlock = line + '\n';
      } else {
        currentBlock += line + '\n';
      }
    }

    // Agregar el último bloque
    if (currentBlock.trim()) {
      questionBlocks.push(currentBlock.trim());
    }

    // Parsear cada bloque
    for (const block of questionBlocks) {
      try {
        const question = this.parseBlock(block);
        if (question) {
          questions.push(question);
        }
      } catch (error) {
        console.warn('Error parseando bloque GIFT:', error.message, block);
      }
    }

    return questions;
  },

  /**
   * Parsear un bloque GIFT individual
   * @param {string} block - Bloque de texto GIFT
   * @returns {Object|null} Pregunta parseada
   */
  parseBlock(block) {
    // Limpiar bloque
    block = block.trim();

    // Ignorar bloques vacíos o que solo tienen comentarios
    if (!block || block.startsWith('//')) return null;

    // Buscar el título entre :: ::
    let title = null;
    const titleMatch = block.match(/^::(.+?)::/);
    let textStart = 0;

    if (titleMatch) {
      title = titleMatch[1];
      textStart = titleMatch[0].length;
    }

    // Obtener el resto del texto después del título
    const remainingText = block.substring(textStart).trim();

    // Buscar la pregunta y las alternativas
    // Las alternativas están dentro de llaves { }
    const questionMatch = remainingText.match(/^(.+?)\{/s);
    if (!questionMatch) return null;

    const questionText = questionMatch[1].trim();

    // Extraer todo el contenido entre llaves (puede tener múltiples líneas)
    const braceStart = remainingText.indexOf('{');
    const braceEnd = remainingText.lastIndexOf('}');

    if (braceStart === -1 || braceEnd === -1) return null;

    const alternativesText = remainingText.substring(braceStart + 1, braceEnd);
    const alternatives = this.parseAlternatives(alternativesText);

    if (alternatives.length === 0) return null;

    // Determinar tipo de pregunta
    const type = this.detectQuestionType(alternatives);

    return {
      text: questionText,
      type,
      alternatives,
      category: 'Importado GIFT',
      tags: ['gift-import'],
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
    };
  },

  /**
   * Parsear alternativas de un bloque GIFT
   * @param {string} alternativesText - Texto con alternativas
   * @returns {Array<Object>} Array de alternativas
   */
  parseAlternatives(alternativesText) {
    const alternatives = [];

    // Dividir por líneas y buscar las que empiezan con = o ~
    const lines = alternativesText.split('\n');
    let currentAlt = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // Verificar si es una nueva alternativa (empieza con = o ~)
      if (trimmed.startsWith('=') || trimmed.startsWith('~')) {
        // Guardar la alternativa anterior si existe
        if (currentAlt) {
          alternatives.push(currentAlt);
        }

        const isCorrect = trimmed.startsWith('=');
        let text = trimmed.substring(1).trim();

        // Extraer feedback si existe (# feedback)
        let feedback = '';
        const feedbackIndex = text.indexOf('#');
        if (feedbackIndex !== -1) {
          feedback = text.substring(feedbackIndex + 1).trim();
          text = text.substring(0, feedbackIndex).trim();
        }

        currentAlt = {
          id: uuidv4(),
          text,
          isCorrect,
          feedback: feedback || undefined
        };
      } else if (currentAlt && trimmed) {
        // Continuar la alternativa anterior (línea de continuación)
        const feedbackIndex = trimmed.indexOf('#');
        if (feedbackIndex !== -1) {
          // Si encontramos feedback en esta línea
          const beforeFeedback = trimmed.substring(0, feedbackIndex).trim();
          const feedbackPart = trimmed.substring(feedbackIndex + 1).trim();

          if (beforeFeedback) {
            currentAlt.text += ' ' + beforeFeedback;
          }
          currentAlt.feedback = (currentAlt.feedback ? currentAlt.feedback + ' ' : '') + feedbackPart;
        } else {
          // Si no hay feedback, agregar al texto
          if (currentAlt.feedback === undefined) {
            currentAlt.text += ' ' + trimmed;
          } else {
            currentAlt.feedback += ' ' + trimmed;
          }
        }
      }
    }

    // Guardar la última alternativa
    if (currentAlt) {
      alternatives.push(currentAlt);
    }

    return alternatives;
  },

  /**
   * Detectar tipo de pregunta según alternativas
   * @param {Array<Object>} alternatives - Alternativas
   * @returns {string} Tipo de pregunta
   */
  detectQuestionType(alternatives) {
    // Si tiene 2 alternativas y son "Verdadero/Falso" o "True/False"
    if (alternatives.length === 2) {
      const texts = alternatives.map(a => a.text.toLowerCase());
      const isTrueFalse =
        (texts.includes('verdadero') && texts.includes('falso')) ||
        (texts.includes('true') && texts.includes('false')) ||
        (texts.includes('v') && texts.includes('f'));

      if (isTrueFalse) return 'boolean';
    }

    return 'multiple';
  },

  /**
   * Exportar preguntas a formato GIFT
   * @param {Array<Object>} questions - Array de preguntas
   * @returns {string} Texto en formato GIFT
   */
  export(questions) {
    return questions.map(q => this.questionToGift(q)).join('\n\n');
  },

  /**
   * Convertir una pregunta a formato GIFT
   * @param {Object} question - Pregunta
   * @returns {string} Texto GIFT
   */
  questionToGift(question) {
    let gift = '';

    // Agregar título (ID como identificador)
    gift += `::${question.id}::\n`;

    // Agregar texto de la pregunta
    gift += question.text;

    // Agregar alternativas si aplica
    if (question.type === 'multiple' || question.type === 'boolean') {
      gift += ' {\n';

      for (const alt of question.alternatives) {
        const prefix = alt.isCorrect ? '=' : '~';
        let line = `  ${prefix}${alt.text}`;

        // Agregar feedback si existe
        if (alt.feedback) {
          line += ` # ${alt.feedback}`;
        }

        gift += line + '\n';
      }

      gift += '}';
    }

    // Agregar feedback general si existe
    if (question.feedback?.general) {
      gift += `\n// Feedback: ${question.feedback.general}`;
    }

    return gift;
  },

  /**
   * Validar formato GIFT
   * @param {string} giftText - Texto a validar
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validate(giftText) {
    const errors = [];

    if (!giftText || giftText.trim() === '') {
      errors.push('El texto GIFT está vacío');
      return { valid: false, errors };
    }

    // Verificar estructura básica
    const hasQuestions = /\{[^}]+\}/.test(giftText);
    if (!hasQuestions) {
      errors.push('No se encontraron preguntas válidas (formato: pregunta {alternativas})');
    }

    try {
      const questions = this.parse(giftText);
      if (questions.length === 0) {
        errors.push('No se pudieron parsear preguntas válidas');
      }
    } catch (error) {
      errors.push(`Error al parsear: ${error.message}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

export default giftParser;

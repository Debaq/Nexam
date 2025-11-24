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

    // Separar por bloques (doble salto de línea)
    const blocks = giftText
      .split(/\n\s*\n/)
      .map(b => b.trim())
      .filter(Boolean);

    for (const block of blocks) {
      try {
        const question = this.parseBlock(block);
        if (question) {
          questions.push(question);
        }
      } catch (error) {
        console.warn('Error parseando bloque GIFT:', error.message);
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
    const lines = block.split('\n').map(l => l.trim());

    // Ignorar comentarios
    if (lines[0].startsWith('//')) return null;

    // Extraer título (opcional): ::título::
    let title = null;
    let questionLine = 0;
    const titleMatch = lines[0].match(/^::(.+?)::/);
    if (titleMatch) {
      title = titleMatch[1];
      questionLine = 1;
    }

    // Unir todas las líneas de la pregunta
    const fullText = lines.slice(questionLine).join(' ');

    // Extraer texto de la pregunta (antes de las llaves)
    const questionMatch = fullText.match(/^(.+?)\{/);
    if (!questionMatch) return null;

    const questionText = questionMatch[1].trim();

    // Extraer alternativas (dentro de las llaves)
    const alternativesMatch = fullText.match(/\{([^}]+)\}/);
    if (!alternativesMatch) return null;

    const alternativesText = alternativesMatch[1];
    const alternatives = this.parseAlternatives(alternativesText);

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

    // Dividir por = o ~ (correcta o incorrecta)
    const parts = alternativesText.split(/(?=[=~])/);

    for (const part of parts) {
      if (!part.trim()) continue;

      const isCorrect = part.startsWith('=');
      let text = part.substring(1).trim();

      // Extraer feedback si existe (# feedback)
      let feedback = '';
      const feedbackMatch = text.match(/^(.+?)#(.+)$/);
      if (feedbackMatch) {
        text = feedbackMatch[1].trim();
        feedback = feedbackMatch[2].trim();
      }

      alternatives.push({
        id: uuidv4(),
        text,
        isCorrect,
        feedback: feedback || undefined
      });
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

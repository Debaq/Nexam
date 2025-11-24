import { db } from '@/core/storage/db';
import { defaults } from '@/core/storage/schemas';
import { v4 as uuidv4 } from 'uuid';

/**
 * Servicio para gestión de preguntas
 * Maneja todas las operaciones CRUD sobre la tabla de preguntas
 */
export const questionsService = {
  /**
   * CREATE - Crear una nueva pregunta
   * @param {Object} questionData - Datos de la pregunta
   * @returns {Promise<Object>} Pregunta creada
   */
  async create(questionData) {
    const now = new Date();
    const question = {
      id: uuidv4(),
      ...defaults.question,
      ...questionData,
      createdAt: now,
      updatedAt: now
    };

    await db.questions.add(question);
    return question;
  },

  /**
   * READ - Obtener todas las preguntas
   * @returns {Promise<Array>} Array de preguntas
   */
  async getAll() {
    return await db.questions.toArray();
  },

  /**
   * READ - Obtener pregunta por ID
   * @param {string} id - ID de la pregunta
   * @returns {Promise<Object|undefined>} Pregunta encontrada
   */
  async getById(id) {
    return await db.questions.get(id);
  },

  /**
   * READ - Obtener preguntas por categoría
   * @param {string} category - Nombre de la categoría
   * @returns {Promise<Array>} Array de preguntas
   */
  async getByCategory(category) {
    return await db.questions.where('category').equals(category).toArray();
  },

  /**
   * READ - Obtener preguntas por tipo
   * @param {string} type - Tipo de pregunta ('multiple'|'boolean'|'development')
   * @returns {Promise<Array>} Array de preguntas
   */
  async getByType(type) {
    return await db.questions.where('type').equals(type).toArray();
  },

  /**
   * READ - Buscar preguntas por tags
   * @param {string[]} tags - Array de tags a buscar
   * @returns {Promise<Array>} Array de preguntas que contienen al menos un tag
   */
  async searchByTags(tags) {
    return await db.questions
      .filter(q => tags.some(tag => q.tags.includes(tag)))
      .toArray();
  },

  /**
   * READ - Buscar preguntas por texto
   * @param {string} searchText - Texto a buscar
   * @returns {Promise<Array>} Array de preguntas que contienen el texto
   */
  async search(searchText) {
    const searchLower = searchText.toLowerCase();
    return await db.questions
      .filter(q => q.text.toLowerCase().includes(searchLower))
      .toArray();
  },

  /**
   * READ - Obtener categorías únicas
   * @returns {Promise<Array>} Array de categorías
   */
  async getCategories() {
    const questions = await db.questions.toArray();
    const categories = [...new Set(questions.map(q => q.category))];
    return categories.filter(Boolean).sort();
  },

  /**
   * READ - Obtener todos los tags únicos
   * @returns {Promise<Array>} Array de tags
   */
  async getAllTags() {
    const questions = await db.questions.toArray();
    const allTags = questions.flatMap(q => q.tags);
    return [...new Set(allTags)].filter(Boolean).sort();
  },

  /**
   * UPDATE - Actualizar una pregunta
   * @param {string} id - ID de la pregunta
   * @param {Object} updates - Campos a actualizar
   * @returns {Promise<Object>} Pregunta actualizada
   */
  async update(id, updates) {
    await db.questions.update(id, {
      ...updates,
      updatedAt: new Date()
    });
    return await db.questions.get(id);
  },

  /**
   * DELETE - Eliminar una pregunta
   * @param {string} id - ID de la pregunta
   * @returns {Promise<void>}
   */
  async delete(id) {
    await db.questions.delete(id);
  },

  /**
   * DELETE - Eliminar múltiples preguntas
   * @param {string[]} ids - Array de IDs
   * @returns {Promise<void>}
   */
  async deleteMany(ids) {
    await db.questions.bulkDelete(ids);
  },

  /**
   * BULK - Crear múltiples preguntas
   * @param {Array<Object>} questionsData - Array de datos de preguntas
   * @returns {Promise<Array>} Array de preguntas creadas
   */
  async bulkCreate(questionsData) {
    const now = new Date();
    const questions = questionsData.map(q => ({
      id: uuidv4(),
      ...defaults.question,
      ...q,
      createdAt: now,
      updatedAt: now
    }));

    await db.questions.bulkAdd(questions);
    return questions;
  },

  /**
   * STATISTICS - Actualizar estadísticas de uso
   * @param {string} id - ID de la pregunta
   * @param {Object} stats - Nuevas estadísticas
   * @param {number} stats.score - Puntaje en esta evaluación
   * @returns {Promise<void>}
   */
  async updateStatistics(id, stats) {
    const question = await db.questions.get(id);
    if (!question) throw new Error('Question not found');

    const currentStats = question.statistics;
    const newTimesUsed = currentStats.timesUsed + 1;

    // Calcular nuevo promedio
    const newAverageScore = (
      (currentStats.averageScore * currentStats.timesUsed) + stats.score
    ) / newTimesUsed;

    await db.questions.update(id, {
      statistics: {
        timesUsed: newTimesUsed,
        averageScore: newAverageScore
      },
      updatedAt: new Date()
    });
  },

  /**
   * UTILITY - Obtener estadísticas generales
   * @returns {Promise<Object>} Objeto con estadísticas
   */
  async getGeneralStats() {
    const questions = await db.questions.toArray();

    return {
      total: questions.length,
      byType: {
        multiple: questions.filter(q => q.type === 'multiple').length,
        boolean: questions.filter(q => q.type === 'boolean').length,
        development: questions.filter(q => q.type === 'development').length
      },
      byDifficulty: {
        easy: questions.filter(q => q.difficulty.manual === 'easy').length,
        medium: questions.filter(q => q.difficulty.manual === 'medium').length,
        hard: questions.filter(q => q.difficulty.manual === 'hard').length
      },
      totalCategories: (await this.getCategories()).length,
      totalTags: (await this.getAllTags()).length,
      mostUsed: questions
        .sort((a, b) => b.statistics.timesUsed - a.statistics.timesUsed)
        .slice(0, 10)
    };
  },

  /**
   * UTILITY - Validar pregunta antes de guardar
   * @param {Object} question - Datos de la pregunta
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validate(question) {
    const errors = [];

    if (!question.text || question.text.trim() === '') {
      errors.push('El texto de la pregunta es obligatorio');
    }

    if (!['multiple', 'boolean', 'development'].includes(question.type)) {
      errors.push('Tipo de pregunta inválido');
    }

    if (question.type === 'multiple' || question.type === 'boolean') {
      if (!question.alternatives || question.alternatives.length < 2) {
        errors.push('Se requieren al menos 2 alternativas');
      }

      const correctCount = question.alternatives?.filter(a => a.isCorrect).length || 0;
      if (correctCount === 0) {
        errors.push('Debe haber al menos una alternativa correcta');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

export default questionsService;

import { db } from '@/core/storage/db';
import { v4 as uuidv4 } from 'uuid';

/**
 * Servicio para gestión de secciones/asignaturas
 */
export const sectionsService = {
  /**
   * CREATE - Crear una nueva sección
   * @param {Object} sectionData - Datos de la sección
   * @returns {Promise<Object>} Sección creada
   */
  async create(sectionData) {
    const now = new Date();
    const section = {
      id: uuidv4(),
      ...sectionData,
      createdAt: now,
      updatedAt: now
    };

    await db.sections.add(section);
    return section;
  },

  /**
   * READ - Obtener todas las secciones
   * @returns {Promise<Array>} Array de secciones
   */
  async getAll() {
    return await db.sections.toArray();
  },

  /**
   * READ - Obtener sección por ID
   * @param {string} id - ID de la sección
   * @returns {Promise<Object|undefined>} Sección encontrada
   */
  async getById(id) {
    return await db.sections.get(id);
  },

  /**
   * READ - Buscar secciones por nombre o código
   * @param {string} searchText - Texto a buscar
   * @returns {Promise<Array>} Array de secciones
   */
  async search(searchText) {
    const searchLower = searchText.toLowerCase();
    return await db.sections
      .filter(s =>
        s.name.toLowerCase().includes(searchLower) ||
        (s.code && s.code.toLowerCase().includes(searchLower))
      )
      .toArray();
  },

  /**
   * UPDATE - Actualizar una sección
   * @param {string} id - ID de la sección
   * @param {Object} updates - Campos a actualizar
   * @returns {Promise<Object>} Sección actualizada
   */
  async update(id, updates) {
    await db.sections.update(id, {
      ...updates,
      updatedAt: new Date()
    });

    return await db.sections.get(id);
  },

  /**
   * DELETE - Eliminar una sección
   * @param {string} id - ID de la sección
   * @returns {Promise<void>}
   */
  async delete(id) {
    // Antes de eliminar la sección, eliminar todas las inscripciones relacionadas
    await db.studentSections.where('sectionId').equals(id).delete();
    await db.sections.delete(id);
  },

  /**
   * GET - Obtener estadísticas de una sección
   * @param {string} sectionId - ID de la sección
   * @returns {Promise<Object>} Estadísticas de la sección
   */
  async getStats(sectionId) {
    const enrollments = await db.studentSections
      .where('sectionId')
      .equals(sectionId)
      .toArray();

    const activeEnrollments = enrollments.filter(e => e.active);
    const inactiveEnrollments = enrollments.filter(e => !e.active);

    return {
      totalEnrollments: enrollments.length,
      activeEnrollments: activeEnrollments.length,
      inactiveEnrollments: inactiveEnrollments.length
    };
  }
};

export default sectionsService;
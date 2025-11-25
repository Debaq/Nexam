import { db } from '@/core/storage/db';
import { v4 as uuidv4 } from 'uuid';

/**
 * Servicio para gestión de inscripciones de estudiantes en secciones
 */
export const studentSectionsService = {
  /**
   * CREATE - Inscribir un estudiante en una sección
   * @param {Object} enrollmentData - Datos de inscripción
   * @returns {Promise<Object>} Inscripción creada
   */
  async enroll(studentId, sectionId, enrollmentData = {}) {
    // Verificar que el estudiante y la sección existan
    const [student, section] = await Promise.all([
      db.students.get(studentId),
      db.sections.get(sectionId)
    ]);

    if (!student) {
      throw new Error('Estudiante no encontrado');
    }
    if (!section) {
      throw new Error('Sección no encontrada');
    }

    // Verificar que no exista una inscripción duplicada (activo en la misma sección)
    const existingEnrollment = await db.studentSections
      .where({ studentId, sectionId })
      .filter(e => e.active)
      .first();

    if (existingEnrollment) {
      throw new Error('El estudiante ya está inscrito en esta sección');
    }

    const now = new Date();
    const enrollment = {
      id: uuidv4(),
      studentId,
      sectionId,
      enrollmentDate: enrollmentData.enrollmentDate || now,
      active: true,
      year: enrollmentData.year || new Date().getFullYear(),
      semester: enrollmentData.semester || 1, // Por defecto primer semestre
      createdAt: now,
      updatedAt: now,
      ...enrollmentData
    };

    await db.studentSections.add(enrollment);
    return enrollment;
  },

  /**
   * READ - Obtener todas las inscripciones
   * @returns {Promise<Array>} Array de inscripciones
   */
  async getAll() {
    return await db.studentSections.toArray();
  },

  /**
   * READ - Obtener inscripciones por estudiante
   * @param {string} studentId - ID del estudiante
   * @returns {Promise<Array>} Array de inscripciones del estudiante
   */
  async getByStudent(studentId) {
    return await db.studentSections
      .where('studentId')
      .equals(studentId)
      .sortBy('enrollmentDate');
  },

  /**
   * READ - Obtener inscripciones por sección
   * @param {string} sectionId - ID de la sección
   * @returns {Promise<Array>} Array de inscripciones en la sección
   */
  async getBySection(sectionId) {
    return await db.studentSections
      .where('sectionId')
      .equals(sectionId)
      .sortBy('enrollmentDate');
  },

  /**
   * READ - Obtener inscripción por ID
   * @param {string} id - ID de la inscripción
   * @returns {Promise<Object|undefined>} Inscripción encontrada
   */
  async getById(id) {
    return await db.studentSections.get(id);
  },

  /**
   * READ - Buscar inscripciones activas por estudiante
   * @param {string} studentId - ID del estudiante
   * @returns {Promise<Array>} Array de inscripciones activas del estudiante
   */
  async getActiveByStudent(studentId) {
    if (!studentId) {
      return [];
    }
    // Usar índice simple y filtrar manualmente
    return await db.studentSections
      .where('studentId')
      .equals(studentId)
      .filter(enrollment => enrollment.active === true)
      .toArray();
  },

  /**
   * READ - Buscar inscripciones activas por sección
   * @param {string} sectionId - ID de la sección
   * @returns {Promise<Array>} Array de inscripciones activas en la sección
   */
  async getActiveBySection(sectionId) {
    // Validar que sectionId sea válido antes de hacer la consulta
    if (!sectionId) {
      return [];
    }
    // Usar índice simple y filtrar manualmente para evitar problemas con índices compuestos
    return await db.studentSections
      .where('sectionId')
      .equals(sectionId)
      .filter(enrollment => enrollment.active === true)
      .toArray();
  },

  /**
   * READ - Obtener historial completo de un estudiante
   * @param {string} studentId - ID del estudiante
   * @returns {Promise<Array>} Array con historial completo del estudiante
   */
  async getStudentHistory(studentId) {
    const enrollments = await db.studentSections
      .where('studentId')
      .equals(studentId)
      .sortBy('enrollmentDate');

    // Obtener detalles de las secciones
    const enrollmentsWithDetails = await Promise.all(
      enrollments.map(async (enrollment) => {
        const section = await db.sections.get(enrollment.sectionId);
        return {
          ...enrollment,
          section
        };
      })
    );

    return enrollmentsWithDetails;
  },

  /**
   * UPDATE - Actualizar una inscripción
   * @param {string} id - ID de la inscripción
   * @param {Object} updates - Campos a actualizar
   * @returns {Promise<Object>} Inscripción actualizada
   */
  async update(id, updates) {
    await db.studentSections.update(id, {
      ...updates,
      updatedAt: new Date()
    });

    return await db.studentSections.get(id);
  },

  /**
   * UPDATE - Desinscribir un estudiante de una sección (desactivar inscripción)
   * @param {string} id - ID de la inscripción
   * @returns {Promise<Object>} Inscripción actualizada
   */
  async unenroll(id) {
    await db.studentSections.update(id, {
      active: false,
      updatedAt: new Date()
    });

    return await db.studentSections.get(id);
  },

  /**
   * UPDATE - Desinscribir a un estudiante de todas las secciones activas
   * @param {string} studentId - ID del estudiante
   * @returns {Promise<void>}
   */
  async unenrollStudentFromAllSections(studentId) {
    const activeEnrollments = await db.studentSections
      .where({ studentId, active: true })
      .toArray();

    const updates = activeEnrollments.map(enrollment => 
      db.studentSections.update(enrollment.id, {
        active: false,
        updatedAt: new Date()
      })
    );

    await Promise.all(updates);
  },

  /**
   * DELETE - Eliminar permanentemente una inscripción
   * @param {string} id - ID de la inscripción
   * @returns {Promise<void>}
   */
  async delete(id) {
    await db.studentSections.delete(id);
  },

  /**
   * DELETE - Eliminar todas las inscripciones de un estudiante
   * @param {string} studentId - ID del estudiante
   * @returns {Promise<void>}
   */
  async deleteByStudent(studentId) {
    await db.studentSections.where('studentId').equals(studentId).delete();
  },

  /**
   * DELETE - Eliminar todas las inscripciones de una sección
   * @param {string} sectionId - ID de la sección
   * @returns {Promise<void>}
   */
  async deleteBySection(sectionId) {
    await db.studentSections.where('sectionId').equals(sectionId).delete();
  },

  /**
   * UTILITY - Obtener estadísticas de inscripciones
   * @returns {Promise<Object>} Estadísticas de inscripciones
   */
  async getStats() {
    const total = await db.studentSections.count();
    const active = await db.studentSections.where('active').equals(true).count();
    
    return {
      total,
      active,
      inactive: total - active
    };
  }
};

export default studentSectionsService;
import { db } from '@/core/storage/db';
import { defaults } from '@/core/storage/schemas';

/**
 * Servicio para gestión de secciones/asignaturas
 */
class SectionsService {
  /**
   * Crear una nueva sección
   */
  async create(sectionData) {
    const now = new Date();

    const section = {
      id: crypto.randomUUID(),
      ...defaults.section,
      ...sectionData,
      // Auto-generar folder basado en el nombre si no se proporciona
      folder: sectionData.folder || this.generateFolderName(sectionData.name, sectionData.year),
      createdAt: now,
      updatedAt: now
    };

    // Validar datos requeridos
    if (!section.name || !section.year || !section.startDate || !section.endDate) {
      throw new Error('Faltan campos requeridos: name, year, startDate, endDate');
    }

    // Validar que startDate sea anterior a endDate
    if (new Date(section.startDate) >= new Date(section.endDate)) {
      throw new Error('La fecha de inicio debe ser anterior a la fecha de término');
    }

    await db.sections.add(section);
    return section;
  }

  /**
   * Obtener todas las secciones
   */
  async getAll() {
    return await db.sections.toArray();
  }

  /**
   * Obtener secciones por año
   */
  async getByYear(year) {
    return await db.sections.where('year').equals(year).toArray();
  }

  /**
   * Obtener sección por ID
   */
  async getById(id) {
    return await db.sections.get(id);
  }

  /**
   * Obtener sección por folder
   */
  async getByFolder(folder) {
    return await db.sections.where('folder').equals(folder).first();
  }

  /**
   * Actualizar sección
   */
  async update(id, updates) {
    const section = await this.getById(id);
    if (!section) {
      throw new Error('Sección no encontrada');
    }

    const updatedSection = {
      ...section,
      ...updates,
      updatedAt: new Date()
    };

    await db.sections.update(id, updatedSection);
    return updatedSection;
  }

  /**
   * Eliminar sección
   */
  async delete(id) {
    // Verificar si hay exámenes o preguntas asociadas a esta sección
    const section = await this.getById(id);
    if (!section) {
      throw new Error('Sección no encontrada');
    }

    const examsWithFolder = await db.exams.where('folder').equals(section.folder).count();
    const questionsWithCategory = await db.questions.where('category').equals(section.folder).count();

    if (examsWithFolder > 0 || questionsWithCategory > 0) {
      throw new Error(
        `No se puede eliminar esta sección porque tiene ${examsWithFolder} exámenes y ${questionsWithCategory} preguntas asociadas. ` +
        'Por favor, reasigna o elimina estos elementos primero.'
      );
    }

    await db.sections.delete(id);
  }

  /**
   * Agregar unidad de aprendizaje a una sección
   */
  async addUnit(sectionId, unitData) {
    const section = await this.getById(sectionId);
    if (!section) {
      throw new Error('Sección no encontrada');
    }

    const newUnit = {
      id: crypto.randomUUID(),
      name: unitData.name,
      order: unitData.order || (section.units.length + 1),
      objectives: unitData.objectives || [],
      weighting: unitData.weighting || null
    };

    const updatedUnits = [...section.units, newUnit];
    await this.update(sectionId, { units: updatedUnits });
    return newUnit;
  }

  /**
   * Actualizar unidad de aprendizaje
   */
  async updateUnit(sectionId, unitId, updates) {
    const section = await this.getById(sectionId);
    if (!section) {
      throw new Error('Sección no encontrada');
    }

    const updatedUnits = section.units.map(unit =>
      unit.id === unitId ? { ...unit, ...updates } : unit
    );

    await this.update(sectionId, { units: updatedUnits });
  }

  /**
   * Eliminar unidad de aprendizaje
   */
  async deleteUnit(sectionId, unitId) {
    const section = await this.getById(sectionId);
    if (!section) {
      throw new Error('Sección no encontrada');
    }

    const updatedUnits = section.units.filter(unit => unit.id !== unitId);
    await this.update(sectionId, { units: updatedUnits });
  }

  /**
   * Agregar evaluación a una sección
   */
  async addAssessment(sectionId, assessmentData) {
    const section = await this.getById(sectionId);
    if (!section) {
      throw new Error('Sección no encontrada');
    }

    const newAssessment = {
      id: crypto.randomUUID(),
      name: assessmentData.name,
      type: assessmentData.type || 'exam',
      weighting: assessmentData.weighting || 0,
      examId: assessmentData.examId || null,
      date: assessmentData.date || null,
      unitId: assessmentData.unitId || null
    };

    // Validar que la suma de ponderaciones no exceda 100%
    const currentTotal = section.assessments.reduce((sum, a) => sum + a.weighting, 0);
    if (currentTotal + newAssessment.weighting > 100) {
      throw new Error(`La ponderación total no puede exceder 100%. Actual: ${currentTotal}%`);
    }

    const updatedAssessments = [...section.assessments, newAssessment];
    await this.update(sectionId, { assessments: updatedAssessments });
    return newAssessment;
  }

  /**
   * Actualizar evaluación
   */
  async updateAssessment(sectionId, assessmentId, updates) {
    const section = await this.getById(sectionId);
    if (!section) {
      throw new Error('Sección no encontrada');
    }

    // Si se actualiza el weighting, validar la suma total
    if (updates.weighting !== undefined) {
      const currentTotal = section.assessments
        .filter(a => a.id !== assessmentId)
        .reduce((sum, a) => sum + a.weighting, 0);

      if (currentTotal + updates.weighting > 100) {
        throw new Error(`La ponderación total no puede exceder 100%.`);
      }
    }

    const updatedAssessments = section.assessments.map(assessment =>
      assessment.id === assessmentId ? { ...assessment, ...updates } : assessment
    );

    await this.update(sectionId, { assessments: updatedAssessments });
  }

  /**
   * Eliminar evaluación
   */
  async deleteAssessment(sectionId, assessmentId) {
    const section = await this.getById(sectionId);
    if (!section) {
      throw new Error('Sección no encontrada');
    }

    const updatedAssessments = section.assessments.filter(a => a.id !== assessmentId);
    await this.update(sectionId, { assessments: updatedAssessments });
  }

  /**
   * Obtener años únicos de todas las secciones
   */
  async getUniqueYears() {
    const sections = await this.getAll();
    const years = [...new Set(sections.map(s => s.year))];
    return years.sort((a, b) => b - a); // Ordenar descendente
  }

  /**
   * Obtener todas las carpetas únicas
   */
  async getUniqueFolders() {
    const sections = await this.getAll();
    return [...new Set(sections.map(s => s.folder))].sort();
  }

  /**
   * Generar nombre de carpeta automático
   */
  generateFolderName(name, year) {
    // Limpiar el nombre y crear un slug
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
      .trim()
      .replace(/\s+/g, '-'); // Reemplazar espacios con guiones

    return `${slug}-${year}`;
  }

  /**
   * Obtener estadísticas de una sección
   */
  async getStatistics(sectionId) {
    const section = await this.getById(sectionId);
    if (!section) {
      throw new Error('Sección no encontrada');
    }

    // Contar exámenes asociados
    const examsCount = await db.exams.where('folder').equals(section.folder).count();

    // Contar preguntas asociadas
    const questionsCount = await db.questions.where('category').equals(section.folder).count();

    // Calcular ponderación total de evaluaciones
    const totalWeighting = section.assessments.reduce((sum, a) => sum + a.weighting, 0);

    return {
      examsCount,
      questionsCount,
      unitsCount: section.units.length,
      assessmentsCount: section.assessments.length,
      totalWeighting,
      objectivesCount: section.objectives.length
    };
  }
}

export const sectionsService = new SectionsService();
export default sectionsService;

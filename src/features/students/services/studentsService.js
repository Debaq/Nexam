import { db } from '@/core/storage/db';
import { v4 as uuidv4 } from 'uuid';

/**
 * Validar y formatear RUT chileno
 * @param {string} rut - RUT sin formato o con formato
 * @returns {Object} { valid: boolean, formatted: string, error: string }
 */
export const validateRut = (rut) => {
  // Limpiar el RUT (quitar puntos, guiones y espacios)
  const cleanRut = rut.replace(/[.\-\s]/g, '').toUpperCase();

  // Verificar largo mínimo
  if (cleanRut.length < 2) {
    return { valid: false, formatted: '', error: 'RUT muy corto' };
  }

  // Separar número y dígito verificador
  const rutNum = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);

  // Verificar que el número sea válido
  if (!/^\d+$/.test(rutNum)) {
    return { valid: false, formatted: '', error: 'RUT contiene caracteres inválidos' };
  }

  // Calcular dígito verificador
  let suma = 0;
  let multiplicador = 2;

  for (let i = rutNum.length - 1; i >= 0; i--) {
    suma += parseInt(rutNum[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const dvEsperado = 11 - (suma % 11);
  const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();

  // Verificar si el dígito verificador es correcto
  if (dv !== dvCalculado) {
    return { valid: false, formatted: '', error: 'Dígito verificador incorrecto' };
  }

  // Formatear RUT: XX.XXX.XXX-X
  const formatted = rutNum.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv;

  return { valid: true, formatted, error: '' };
};

/**
 * Servicio para gestión de estudiantes
 */
export const studentsService = {
  /**
   * CREATE - Crear un nuevo estudiante
   * @param {Object} studentData - Datos del estudiante
   * @returns {Promise<Object>} Estudiante creado
   */
  async create(studentData) {
    // Validar RUT
    const rutValidation = validateRut(studentData.rut);
    if (!rutValidation.valid) {
      throw new Error(`RUT inválido: ${rutValidation.error}`);
    }

    // Verificar que no exista otro estudiante con el mismo RUT
    const existing = await db.students.where('rut').equals(rutValidation.formatted).first();
    if (existing) {
      throw new Error('Ya existe un estudiante con este RUT');
    }

    const now = new Date();
    const student = {
      id: uuidv4(),
      ...studentData,
      rut: rutValidation.formatted,
      createdAt: now,
      updatedAt: now
    };

    await db.students.add(student);
    return student;
  },

  /**
   * READ - Obtener todos los estudiantes
   * @returns {Promise<Array>} Array de estudiantes
   */
  async getAll() {
    return await db.students.toArray();
  },

  /**
   * READ - Obtener estudiante por ID
   * @param {string} id - ID del estudiante
   * @returns {Promise<Object|undefined>} Estudiante encontrado
   */
  async getById(id) {
    return await db.students.get(id);
  },

  /**
   * READ - Buscar estudiante por RUT
   * @param {string} rut - RUT del estudiante
   * @returns {Promise<Object|undefined>} Estudiante encontrado
   */
  async getByRut(rut) {
    const rutValidation = validateRut(rut);
    if (!rutValidation.valid) return undefined;

    return await db.students.where('rut').equals(rutValidation.formatted).first();
  },

  /**
   * READ - Buscar estudiantes por nombre o apellido
   * @param {string} searchText - Texto a buscar
   * @returns {Promise<Array>} Array de estudiantes
   */
  async search(searchText) {
    const searchLower = searchText.toLowerCase();
    return await db.students
      .filter(s =>
        s.name.toLowerCase().includes(searchLower) ||
        s.lastName.toLowerCase().includes(searchLower) ||
        s.email.toLowerCase().includes(searchLower)
      )
      .toArray();
  },

  /**
   * UPDATE - Actualizar un estudiante
   * @param {string} id - ID del estudiante
   * @param {Object} updates - Campos a actualizar
   * @returns {Promise<Object>} Estudiante actualizado
   */
  async update(id, updates) {
    // Si se actualiza el RUT, validarlo
    if (updates.rut) {
      const rutValidation = validateRut(updates.rut);
      if (!rutValidation.valid) {
        throw new Error(`RUT inválido: ${rutValidation.error}`);
      }

      // Verificar que no exista otro estudiante con el mismo RUT
      const existing = await db.students
        .where('rut')
        .equals(rutValidation.formatted)
        .and(s => s.id !== id)
        .first();

      if (existing) {
        throw new Error('Ya existe otro estudiante con este RUT');
      }

      updates.rut = rutValidation.formatted;
    }

    await db.students.update(id, {
      ...updates,
      updatedAt: new Date()
    });

    return await db.students.get(id);
  },

  /**
   * DELETE - Eliminar un estudiante
   * @param {string} id - ID del estudiante
   * @returns {Promise<void>}
   */
  async delete(id) {
    await db.students.delete(id);
  },

  /**
   * DELETE - Eliminar múltiples estudiantes
   * @param {string[]} ids - Array de IDs
   * @returns {Promise<void>}
   */
  async deleteMany(ids) {
    await db.students.bulkDelete(ids);
  },

  /**
   * BULK - Crear múltiples estudiantes
   * @param {Array<Object>} studentsData - Array de datos de estudiantes
   * @returns {Promise<Object>} { created: Array, errors: Array }
   */
  async bulkCreate(studentsData) {
    const created = [];
    const errors = [];

    for (const studentData of studentsData) {
      try {
        const student = await this.create(studentData);
        created.push(student);
      } catch (error) {
        errors.push({
          data: studentData,
          error: error.message
        });
      }
    }

    return { created, errors };
  },

  /**
   * UTILITY - Validar datos de estudiante
   * @param {Object} student - Datos del estudiante
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validate(student) {
    const errors = [];

    // Validar RUT
    if (!student.rut) {
      errors.push('El RUT es obligatorio');
    } else {
      const rutValidation = validateRut(student.rut);
      if (!rutValidation.valid) {
        errors.push(`RUT inválido: ${rutValidation.error}`);
      }
    }

    // Validar nombre
    if (!student.name || student.name.trim() === '') {
      errors.push('El nombre es obligatorio');
    }

    // Validar apellido
    if (!student.lastName || student.lastName.trim() === '') {
      errors.push('El apellido es obligatorio');
    }

    // Validar email (opcional pero debe ser válido si existe)
    if (student.email && student.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(student.email)) {
        errors.push('Email inválido');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * UTILITY - Obtener estadísticas generales
   * @returns {Promise<Object>} Objeto con estadísticas
   */
  async getStats() {
    const students = await db.students.toArray();

    return {
      total: students.length,
      withEmail: students.filter(s => s.email && s.email.trim() !== '').length
    };
  }
};

export default studentsService;

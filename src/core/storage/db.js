import Dexie from 'dexie';

class NexamDatabase extends Dexie {
  constructor() {
    super('NexamDB');

    // Versión 1: Schema inicial
    this.version(1).stores({
      questions: 'id, category, type, *tags, createdAt, updatedAt',
      exams: 'id, date, type, createdAt, updatedAt',
      students: 'id, rut, name, lastName, email, createdAt',
      results: 'id, examId, studentId, code, correctedAt'
    });

    // Versión 2: Agregar tabla de secciones/asignaturas
    this.version(2).stores({
      questions: 'id, category, type, *tags, createdAt, updatedAt',
      exams: 'id, date, type, createdAt, updatedAt',
      students: 'id, rut, name, lastName, email, createdAt',
      results: 'id, examId, studentId, code, correctedAt',
      sections: 'id, name, code, year, semester, folder, createdAt, updatedAt'
    });

    // Versión 3: Agregar tabla de relación entre estudiantes y secciones
    this.version(3).stores({
      questions: 'id, category, type, *tags, createdAt, updatedAt',
      exams: 'id, date, type, createdAt, updatedAt',
      students: 'id, rut, name, lastName, email, createdAt, updatedAt',
      results: 'id, examId, studentId, code, correctedAt',
      sections: 'id, name, code, year, semester, folder, createdAt, updatedAt',
      studentSections: 'id, studentId, sectionId, enrollmentDate, active, year, semester, createdAt, updatedAt'
    });

    // Versión 4: Agregar relación entre exámenes y secciones
    this.version(4).stores({
      questions: 'id, category, type, *tags, createdAt, updatedAt',
      exams: 'id, date, type, createdAt, updatedAt, sectionId', // Índice para sección (puede ser null)
      students: 'id, rut, name, lastName, email, createdAt, updatedAt',
      results: 'id, examId, studentId, code, correctedAt',
      sections: 'id, name, code, year, semester, folder, createdAt, updatedAt',
      studentSections: 'id, studentId, sectionId, enrollmentDate, active, year, semester, createdAt, updatedAt'
    });

    // Versión 5: Agregar índice folder a la tabla exams
    this.version(5).stores({
      questions: 'id, category, type, *tags, createdAt, updatedAt',
      exams: 'id, date, type, folder, createdAt, updatedAt, sectionId', // Agregar índice folder
      students: 'id, rut, name, lastName, email, createdAt, updatedAt',
      results: 'id, examId, studentId, code, correctedAt',
      sections: 'id, name, code, year, semester, folder, createdAt, updatedAt',
      studentSections: 'id, studentId, sectionId, enrollmentDate, active, year, semester, createdAt, updatedAt'
    });

    // Versión 6: Agregar índices compuestos para optimizar queries
    this.version(6).stores({
      questions: 'id, category, type, *tags, createdAt, updatedAt',
      exams: 'id, date, type, folder, createdAt, updatedAt, sectionId',
      students: 'id, rut, name, lastName, email, createdAt, updatedAt',
      // Agregar índice compuesto [examId+studentId] para queries eficientes en corrección
      results: 'id, examId, studentId, [examId+studentId], code, correctedAt',
      sections: 'id, name, code, year, semester, folder, createdAt, updatedAt',
      // Agregar índice compuesto [sectionId+active] para queries eficientes
      studentSections: 'id, studentId, sectionId, [sectionId+active], enrollmentDate, active, year, semester, createdAt, updatedAt'
    });

    // Versión 7: Remover índices compuestos problemáticos y usar filtrado manual
    this.version(7).stores({
      questions: 'id, category, type, *tags, createdAt, updatedAt',
      exams: 'id, date, type, folder, createdAt, updatedAt, sectionId',
      students: 'id, rut, name, lastName, email, createdAt, updatedAt',
      results: 'id, examId, studentId, code, correctedAt',
      sections: 'id, name, code, year, semester, folder, createdAt, updatedAt',
      // Solo índices simples, sin compuestos
      studentSections: 'id, studentId, sectionId, enrollmentDate, active, year, semester, createdAt, updatedAt'
    });

    // Versión 8: Agregar campos para corrección automática
    this.version(8).stores({
      questions: 'id, category, type, *tags, createdAt, updatedAt',
      exams: 'id, date, type, folder, createdAt, updatedAt, sectionId',
      students: 'id, rut, name, lastName, email, createdAt, updatedAt',
      // Agregar índices para corrección automática: detectedRUT, needsReview
      results: 'id, examId, studentId, detectedRUT, code, correctedAt, needsReview',
      sections: 'id, name, code, year, semester, folder, createdAt, updatedAt',
      studentSections: 'id, studentId, sectionId, enrollmentDate, active, year, semester, createdAt, updatedAt'
    });

    // Versión 9: Agregar tabla para cachear modelos YOLO
    this.version(9).stores({
      questions: 'id, category, type, *tags, createdAt, updatedAt',
      exams: 'id, date, type, folder, createdAt, updatedAt, sectionId',
      students: 'id, rut, name, lastName, email, createdAt, updatedAt',
      results: 'id, examId, studentId, detectedRUT, code, correctedAt, needsReview',
      sections: 'id, name, code, year, semester, folder, createdAt, updatedAt',
      studentSections: 'id, studentId, sectionId, enrollmentDate, active, year, semester, createdAt, updatedAt',
      // Tabla para cachear modelos ML (key: URL del modelo, value: ArrayBuffer + metadata)
      modelCache: 'url, downloadedAt, size'
    });

    // Definir colecciones tipadas
    this.questions = this.table('questions');
    this.exams = this.table('exams');
    this.students = this.table('students');
    this.results = this.table('results');
    this.sections = this.table('sections');
    this.studentSections = this.table('studentSections');
    this.modelCache = this.table('modelCache');
  }
}

// Exportar instancia única (singleton)
export const db = new NexamDatabase();

// Verificar conexión
db.open().catch(err => {
  console.error('Error al abrir IndexedDB:', err);
});

export default db;

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

    // Definir colecciones tipadas
    this.questions = this.table('questions');
    this.exams = this.table('exams');
    this.students = this.table('students');
    this.results = this.table('results');
  }
}

// Exportar instancia única (singleton)
export const db = new NexamDatabase();

// Verificar conexión
db.open().catch(err => {
  console.error('Error al abrir IndexedDB:', err);
});

export default db;

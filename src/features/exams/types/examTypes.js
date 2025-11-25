/**
 * Tipos para la funcionalidad de exámenes
 */

/**
 * @typedef {Object} ExamConfig
 * @property {string} title - Título del examen
 * @property {Date} date - Fecha del examen
 * @property {string[]} questions - IDs de preguntas incluidas
 * @property {'uniform'|'differentiated'} type - Tipo de evaluación
 * @property {Object} randomization - Configuración de aleatorización
 * @property {boolean} randomization.shuffleQuestions - Mezclar preguntas
 * @property {boolean} randomization.shuffleAlternatives - Mezclar alternativas
 * @property {string[]} students - IDs de estudiantes asignados
 * @property {string} [folder] - Carpeta/categoría del examen
 */

/**
 * @typedef {Object} ExamVersion
 * @property {string} examId - ID del examen
 * @property {string} examTitle - Título del examen
 * @property {string} studentId - ID del estudiante
 * @property {string|null} code - Código único del examen
 * @property {Object[]} questions - Preguntas del examen
 * @property {Date} date - Fecha del examen
 */

/**
 * @typedef {Object} Exam
 * @property {string} id - UUID único
 * @property {string} title - Título del examen
 * @property {Date} date - Fecha del examen
 * @property {string[]} questions - IDs de preguntas incluidas
 * @property {'uniform'|'differentiated'} type - Tipo de evaluación
 * @property {Object} randomization - Configuración de aleatorización
 * @property {boolean} randomization.shuffleQuestions - Mezclar preguntas
 * @property {boolean} randomization.shuffleAlternatives - Mezclar alternativas
 * @property {string[]} students - IDs de estudiantes asignados
 * @property {Object} codes - Mapa studentId -> código único
 * @property {string} folder - Carpeta/categoría del examen
 * @property {Date} createdAt - Fecha de creación
 * @property {Date} updatedAt - Fecha de actualización
 */

export default {};
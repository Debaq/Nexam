import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/storage/db';
import { questionsService } from '../services/questionsService';

/**
 * Hook para gestión de preguntas con actualización en tiempo real
 * Usa dexie-react-hooks para suscripción automática a cambios
 */
export const useQuestions = () => {
  // Query reactiva - se actualiza automáticamente cuando cambia la DB
  const questions = useLiveQuery(
    () => db.questions.toArray(),
    []
  );

  return {
    questions: questions ?? [],
    isLoading: !questions,

    // Métodos del servicio
    create: questionsService.create.bind(questionsService),
    update: questionsService.update.bind(questionsService),
    delete: questionsService.delete.bind(questionsService),
    deleteMany: questionsService.deleteMany.bind(questionsService),
    bulkCreate: questionsService.bulkCreate.bind(questionsService),

    // Búsqueda y filtros
    getById: questionsService.getById.bind(questionsService),
    getByCategory: questionsService.getByCategory.bind(questionsService),
    getByType: questionsService.getByType.bind(questionsService),
    searchByTags: questionsService.searchByTags.bind(questionsService),
    search: questionsService.search.bind(questionsService),

    // Utilidades
    getCategories: questionsService.getCategories.bind(questionsService),
    getAllTags: questionsService.getAllTags.bind(questionsService),
    getGeneralStats: questionsService.getGeneralStats.bind(questionsService),
    validate: questionsService.validate.bind(questionsService)
  };
};

/**
 * Hook para obtener preguntas filtradas por categoría
 */
export const useQuestionsByCategory = (category) => {
  const questions = useLiveQuery(
    () => category ? db.questions.where('category').equals(category).toArray() : [],
    [category]
  );

  return questions ?? [];
};

/**
 * Hook para obtener preguntas filtradas por tipo
 */
export const useQuestionsByType = (type) => {
  const questions = useLiveQuery(
    () => type ? db.questions.where('type').equals(type).toArray() : [],
    [type]
  );

  return questions ?? [];
};

/**
 * Hook para obtener una pregunta específica por ID
 */
export const useQuestion = (id) => {
  const question = useLiveQuery(
    () => id ? db.questions.get(id) : null,
    [id]
  );

  return {
    question,
    isLoading: question === undefined,
    notFound: question === null
  };
};

/**
 * Hook para obtener categorías únicas
 */
export const useCategories = () => {
  const categories = useLiveQuery(async () => {
    const questions = await db.questions.toArray();
    const cats = [...new Set(questions.map(q => q.category))];
    return cats.filter(Boolean).sort();
  }, []);

  return categories ?? [];
};

/**
 * Hook para obtener todos los tags únicos
 */
export const useTags = () => {
  const tags = useLiveQuery(async () => {
    const questions = await db.questions.toArray();
    const allTags = questions.flatMap(q => q.tags);
    return [...new Set(allTags)].filter(Boolean).sort();
  }, []);

  return tags ?? [];
};

export default useQuestions;

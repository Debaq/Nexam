import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/storage/db';

/**
 * Hook para obtener todas las secciones ordenadas por año descendente
 */
export const useSections = () => {
  const sections = useLiveQuery(
    async () => {
      const allSections = await db.sections.toArray();
      // Ordenar por año descendente, luego por nombre
      return allSections.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return a.name.localeCompare(b.name);
      });
    },
    []
  );

  return { sections: sections || [], loading: !sections };
};

/**
 * Hook para obtener secciones de un año específico
 */
export const useSectionsByYear = (year) => {
  const sections = useLiveQuery(
    async () => {
      if (!year) return [];
      const result = await db.sections.where('year').equals(year).toArray();
      return result.sort((a, b) => a.name.localeCompare(b.name));
    },
    [year]
  );

  return { sections: sections || [], loading: !sections };
};

/**
 * Hook para obtener una sección por ID
 */
export const useSection = (id) => {
  const section = useLiveQuery(
    async () => {
      if (!id) return null;
      return await db.sections.get(id);
    },
    [id]
  );

  return { section, loading: section === undefined };
};

/**
 * Hook para obtener años únicos
 */
export const useUniqueYears = () => {
  const years = useLiveQuery(
    async () => {
      const sections = await db.sections.toArray();
      const uniqueYears = [...new Set(sections.map(s => s.year))];
      return uniqueYears.sort((a, b) => b - a);
    },
    []
  );

  return { years: years || [], loading: !years };
};

/**
 * Hook para obtener carpetas únicas
 */
export const useUniqueFolders = () => {
  const folders = useLiveQuery(
    async () => {
      const sections = await db.sections.toArray();
      return [...new Set(sections.map(s => s.folder))].sort();
    },
    []
  );

  return { folders: folders || [], loading: !folders };
};

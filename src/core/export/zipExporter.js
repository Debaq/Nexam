import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { giftParser } from './giftParser';

/**
 * Exportador/Importador de preguntas en formato ZIP
 * Permite exportar e importar preguntas con imágenes
 */
export const zipExporter = {
  /**
   * Exportar preguntas a archivo ZIP
   * @param {Array<Object>} questions - Array de preguntas
   * @param {string} [filename] - Nombre del archivo (opcional)
   * @returns {Promise<void>}
   */
  async exportQuestions(questions, filename) {
    const zip = new JSZip();

    // 1. Agregar archivo GIFT con las preguntas
    const giftContent = giftParser.export(questions);
    zip.file('questions.gift', giftContent);

    // 2. Agregar JSON completo con metadata
    const jsonContent = JSON.stringify(questions, (key, value) => {
      // Convertir Blob a base64 para JSON
      if (value instanceof Blob) {
        return {
          type: 'Blob',
          data: value // JSZip manejará esto
        };
      }
      return value;
    }, 2);
    zip.file('questions.json', jsonContent);

    // 3. Agregar carpeta de imágenes
    const imagesFolder = zip.folder('images');
    for (const question of questions) {
      if (question.image?.data) {
        const extension = question.image.data.type?.split('/')[1] || 'png';
        imagesFolder.file(`${question.id}.${extension}`, question.image.data);
      }
    }

    // 4. Agregar README con información
    const readme = this.generateReadme(questions);
    zip.file('README.txt', readme);

    // 5. Generar y descargar
    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    const fname = filename || `nexam-questions-${Date.now()}.zip`;
    saveAs(blob, fname);
  },

  /**
   * Importar preguntas desde archivo ZIP
   * @param {File} file - Archivo ZIP
   * @returns {Promise<Array<Object>>} Array de preguntas importadas
   */
  async importFromZip(file) {
    const zip = await JSZip.loadAsync(file);

    // 1. Intentar cargar desde JSON primero (más completo)
    const jsonFile = zip.file('questions.json');
    if (jsonFile) {
      const content = await jsonFile.async('string');
      const questions = JSON.parse(content);

      // Restaurar imágenes desde carpeta images/
      await this.loadImages(zip, questions);

      return questions;
    }

    // 2. Fallback a GIFT si no hay JSON
    const giftFile = zip.file('questions.gift');
    if (giftFile) {
      const content = await giftFile.async('string');
      const questions = giftParser.parse(content);

      // Intentar cargar imágenes
      await this.loadImages(zip, questions);

      return questions;
    }

    throw new Error('No se encontró archivo de preguntas válido (questions.json o questions.gift)');
  },

  /**
   * Cargar imágenes desde carpeta images/ del ZIP
   * @param {JSZip} zip - Instancia de JSZip
   * @param {Array<Object>} questions - Array de preguntas
   * @returns {Promise<void>}
   */
  async loadImages(zip, questions) {
    const imagesFolder = zip.folder('images');
    if (!imagesFolder) return;

    const imageFiles = Object.keys(zip.files).filter(name => name.startsWith('images/'));

    for (const question of questions) {
      // Buscar imagen que coincida con el ID de la pregunta
      const imagePath = imageFiles.find(path => path.includes(question.id));

      if (imagePath) {
        const imageFile = zip.file(imagePath);
        if (imageFile) {
          const blob = await imageFile.async('blob');
          question.image = {
            data: blob,
            alt: question.text.substring(0, 50) + '...'
          };
        }
      }
    }
  },

  /**
   * Generar README con información del export
   * @param {Array<Object>} questions - Array de preguntas
   * @returns {string} Contenido del README
   */
  generateReadme(questions) {
    const stats = {
      total: questions.length,
      multiple: questions.filter(q => q.type === 'multiple').length,
      boolean: questions.filter(q => q.type === 'boolean').length,
      development: questions.filter(q => q.type === 'development').length,
      withImages: questions.filter(q => q.image?.data).length
    };

    const categories = [...new Set(questions.map(q => q.category))];

    return `
NEXAM - Exportación de Preguntas
=================================

Fecha de exportación: ${new Date().toLocaleString('es-CL')}
Total de preguntas: ${stats.total}

Estadísticas:
- Selección múltiple: ${stats.multiple}
- Verdadero/Falso: ${stats.boolean}
- Desarrollo: ${stats.development}
- Con imágenes: ${stats.withImages}

Categorías incluidas:
${categories.map(c => `- ${c}`).join('\n')}

Estructura del archivo:
- questions.json: Archivo completo con metadata (usar este para importar)
- questions.gift: Formato GIFT compatible con Moodle
- images/: Carpeta con imágenes de las preguntas
- README.txt: Este archivo

Para importar en Nexam:
1. Ir a Preguntas > Importar
2. Seleccionar este archivo ZIP
3. Las preguntas se importarán automáticamente

Para importar en Moodle:
1. Usar el archivo questions.gift
2. Seguir el proceso de importación GIFT de Moodle

---
Generado por Nexam - Sistema de Evaluación Educativa
`.trim();
  },

  /**
   * Validar archivo ZIP antes de importar
   * @param {File} file - Archivo ZIP
   * @returns {Promise<Object>} { valid: boolean, errors: string[] }
   */
  async validateZip(file) {
    const errors = [];

    // Verificar que sea un archivo ZIP
    if (!file.name.endsWith('.zip')) {
      errors.push('El archivo debe ser un ZIP');
      return { valid: false, errors };
    }

    try {
      const zip = await JSZip.loadAsync(file);

      // Verificar que tenga al menos uno de los archivos requeridos
      const hasJson = zip.file('questions.json') !== null;
      const hasGift = zip.file('questions.gift') !== null;

      if (!hasJson && !hasGift) {
        errors.push('El ZIP debe contener questions.json o questions.gift');
      }

      // Si tiene JSON, verificar que sea válido
      if (hasJson) {
        const jsonFile = zip.file('questions.json');
        const content = await jsonFile.async('string');
        try {
          const questions = JSON.parse(content);
          if (!Array.isArray(questions)) {
            errors.push('questions.json debe contener un array de preguntas');
          }
        } catch (e) {
          errors.push('questions.json no es un JSON válido');
        }
      }

    } catch (error) {
      errors.push(`Error al leer el archivo ZIP: ${error.message}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

export default zipExporter;

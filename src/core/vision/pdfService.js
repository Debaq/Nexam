/**
 * 📄 PDF Service - Conversión de PDF a imágenes
 *
 * Utiliza pdf.js para extraer páginas como ImageData
 * Optimizado para batch processing de 100+ páginas
 */

class PDFService {
  constructor() {
    this.pdfjsLib = null;
    this.initPromise = null;
  }

  /**
   * Inicializa pdf.js (lazy loading)
   */
  async initialize() {
    if (this.pdfjsLib) return;

    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      // Cargar pdf.js desde CDN
      const pdfjsLibModule = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/+esm');

      // Acceder al objeto pdfjsLib correctamente
      const pdfjsLib = pdfjsLibModule.default || pdfjsLibModule;

      // Configurar pdf.js con el CDN del worker
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

      this.pdfjsLib = pdfjsLib;
      console.log('✅ pdf.js loaded successfully');
    })();

    return this.initPromise;
  }

  /**
   * Convierte un archivo PDF a un array de imágenes
   * @param {File|Blob} file - Archivo PDF
   * @param {Function} onProgress - Callback (currentPage, totalPages)
   * @returns {Promise<Array>} Array de objetos {pageNumber, image, canvas}
   */
  async convertPDFToImages(file, onProgress = null) {
    await this.initialize();

    console.log(`📄 Convirtiendo PDF: ${file.name}`);
    const startTime = performance.now();

    try {
      // Leer archivo como ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Cargar documento PDF
      const loadingTask = this.pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      const totalPages = pdf.numPages;
      console.log(`📊 Total de páginas: ${totalPages}`);

      const images = [];

      // Procesar cada página
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);

        // Escala para buena calidad (2x = 192 DPI)
        const scale = 2.0;
        const viewport = page.getViewport({ scale });

        // Crear canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Renderizar página en canvas
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        // Convertir a Blob para storage
        const blob = await new Promise(resolve => {
          canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.95);
        });

        // Crear Image para procesamiento
        const img = new Image();
        img.src = canvas.toDataURL('image/jpeg', 0.95);
        await new Promise(resolve => {
          img.onload = resolve;
        });

        images.push({
          pageNumber: pageNum,
          image: img,
          canvas: canvas,
          blob: blob,
          width: viewport.width,
          height: viewport.height
        });

        // Callback de progreso
        if (onProgress) {
          onProgress(pageNum, totalPages);
        }

        console.log(`✓ Página ${pageNum}/${totalPages} convertida`);
      }

      const endTime = performance.now();
      console.log(`✅ PDF convertido en ${((endTime - startTime) / 1000).toFixed(2)}s`);

      return images;

    } catch (error) {
      console.error('❌ Error convirtiendo PDF:', error);
      throw new Error(`Error al procesar PDF: ${error.message}`);
    }
  }

  /**
   * Convierte una sola página del PDF
   * @param {File|Blob} file - Archivo PDF
   * @param {number} pageNumber - Número de página (1-indexed)
   */
  async convertSinglePage(file, pageNumber) {
    await this.initialize();

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = this.pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    if (pageNumber < 1 || pageNumber > pdf.numPages) {
      throw new Error(`Página ${pageNumber} fuera de rango (1-${pdf.numPages})`);
    }

    const page = await pdf.getPage(pageNumber);
    const scale = 2.0;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    const blob = await new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.95);
    });

    const img = new Image();
    img.src = canvas.toDataURL('image/jpeg', 0.95);
    await new Promise(resolve => {
      img.onload = resolve;
    });

    return {
      pageNumber,
      image: img,
      canvas,
      blob,
      width: viewport.width,
      height: viewport.height
    };
  }

  /**
   * Obtiene metadatos del PDF sin convertir páginas
   */
  async getPDFInfo(file) {
    await this.initialize();

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = this.pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const metadata = await pdf.getMetadata();

    return {
      numPages: pdf.numPages,
      title: metadata.info?.Title || file.name,
      author: metadata.info?.Author || '',
      creator: metadata.info?.Creator || '',
      fileSize: file.size,
      fileName: file.name
    };
  }

  /**
   * Comprime una imagen para almacenamiento
   */
  async compressImage(canvas, quality = 0.75) {
    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', quality);
    });
  }
}

export default new PDFService();

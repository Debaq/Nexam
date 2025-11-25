/**
 * 🔢 OCR Service - Extracción de RUT con Tesseract.js
 *
 * Lazy loading de Tesseract.js para no bloquear el flujo inicial
 * Optimizado para reconocimiento de dígitos del RUT chileno
 */

class OCRService {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
    this.initPromise = null;
  }

  /**
   * Inicializa Tesseract.js (lazy loading)
   */
  async initialize() {
    if (this.isInitialized) return;

    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        console.log('📦 Cargando Tesseract.js...');
        const Tesseract = await import('tesseract.js');

        this.worker = await Tesseract.createWorker('eng', 1, {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              console.log(`OCR: ${Math.round(m.progress * 100)}%`);
            }
          }
        });

        // Configuración para dígitos
        await this.worker.setParameters({
          tessedit_char_whitelist: '0123456789kK',
          tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE,
          preserve_interword_spaces: '0'
        });

        this.isInitialized = true;
        console.log('✅ Tesseract.js listo');

      } catch (error) {
        console.error('❌ Error inicializando Tesseract:', error);
        throw error;
      }
    })();

    return this.initPromise;
  }

  /**
   * Preprocesa imagen para mejor OCR
   */
  preprocessForOCR(base64Image) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Escalar x3 para mejor reconocimiento
        canvas.width = img.width * 3;
        canvas.height = img.height * 3;

        // Dibujar con antialiasing desactivado
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convertir a escala de grises y aumentar contraste
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          // Calcular luminosidad
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;

          // Binarización con umbral
          const value = avg > 127 ? 255 : 0;

          data[i] = value;     // R
          data[i + 1] = value; // G
          data[i + 2] = value; // B
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };

      img.src = base64Image;
    });
  }

  /**
   * Calcula dígito verificador del RUT
   */
  calculateDV(rut) {
    let suma = 0;
    let multiplicador = 2;

    // Iterar desde el final
    for (let i = rut.length - 1; i >= 0; i--) {
      suma += parseInt(rut.charAt(i)) * multiplicador;
      multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }

    const resto = suma % 11;
    const dv = 11 - resto;

    if (dv === 11) return '0';
    if (dv === 10) return 'K';
    return dv.toString();
  }

  /**
   * Valida RUT completo
   */
  validateRUT(rut, dv) {
    if (!rut || rut.length < 7 || rut.length > 8) {
      return false;
    }

    const calculatedDV = this.calculateDV(rut);
    return calculatedDV.toUpperCase() === dv.toUpperCase();
  }

  /**
   * Formatea RUT: 12345678 → 12.345.678
   */
  formatRUT(rut) {
    if (!rut) return '';

    // Eliminar puntos y guiones existentes
    const clean = rut.replace(/[.-]/g, '');

    // Formatear
    const reversed = clean.split('').reverse();
    const formatted = [];

    reversed.forEach((char, idx) => {
      if (idx > 0 && idx % 3 === 0) {
        formatted.push('.');
      }
      formatted.push(char);
    });

    return formatted.reverse().join('');
  }

  /**
   * Extrae RUT desde imagen base64
   */
  async extractRUT(rutImageBase64) {
    await this.initialize();

    console.log('🔍 Extrayendo RUT...');
    const startTime = performance.now();

    try {
      // Preprocesar imagen
      const preprocessed = await this.preprocessForOCR(rutImageBase64);

      // Reconocimiento OCR
      const { data } = await this.worker.recognize(preprocessed);
      const rawText = data.text.trim();

      console.log(`   Raw OCR: "${rawText}"`);

      // Limpiar y parsear
      const cleaned = rawText.replace(/\s+/g, '').replace(/[^\dkK]/g, '');

      // Extraer dígitos
      let rut = '';
      let dv = '';

      if (cleaned.length >= 8) {
        rut = cleaned.slice(0, 8).replace(/\D/g, '');
        dv = cleaned.slice(8, 9) || cleaned.match(/[kK]/)?.[0] || '';
      } else if (cleaned.length >= 7) {
        rut = cleaned.slice(0, -1).replace(/\D/g, '');
        dv = cleaned.slice(-1);
      }

      // Si no hay DV, calcularlo
      if (!dv && rut.length >= 7) {
        dv = this.calculateDV(rut);
      }

      // Validar
      const isValid = this.validateRUT(rut, dv);

      // Si no es válido, intentar correcciones comunes
      let corrected = false;
      if (!isValid && rut.length >= 7) {
        // Recalcular DV
        const newDV = this.calculateDV(rut);
        if (this.validateRUT(rut, newDV)) {
          dv = newDV;
          corrected = true;
        }
      }

      const endTime = performance.now();

      const result = {
        success: rut.length >= 7,
        rut: this.formatRUT(rut),
        rutRaw: rut,
        dv: dv.toUpperCase(),
        isValid: this.validateRUT(rut, dv),
        corrected: corrected,
        confidence: data.confidence / 100,
        rawText: rawText,
        processingTime: endTime - startTime
      };

      if (result.success) {
        console.log(`✅ RUT extraído: ${result.rut}-${result.dv} (${result.isValid ? 'válido' : 'inválido'})`);
      } else {
        console.warn(`⚠️ No se pudo extraer RUT válido`);
      }

      return result;

    } catch (error) {
      console.error('❌ Error en OCR:', error);
      return {
        success: false,
        rut: null,
        rutRaw: null,
        dv: null,
        isValid: false,
        corrected: false,
        confidence: 0,
        rawText: '',
        error: error.message,
        processingTime: 0
      };
    }
  }

  /**
   * Extrae RUT dígito por dígito (fallback)
   * Para cuando el OCR completo falla
   */
  async extractRUTDigitByDigit(rutImageBase64) {
    // TODO: Implementar si es necesario
    // Dividir imagen en 9 ROIs y reconocer cada dígito
    console.warn('⚠️ Fallback dígito por dígito no implementado aún');
    return null;
  }

  /**
   * Termina el worker de Tesseract
   */
  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
      this.initPromise = null;
      console.log('🛑 Tesseract.js terminado');
    }
  }
}

export default new OCRService();

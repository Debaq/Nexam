/**
 * 🔍 Vision Service - Pipeline de Computer Vision
 *
 * Maneja preprocesamiento de imágenes con OpenCV.js:
 * - Detección de 3 marcadores QR (alineación)
 * - Detección de marcas laterales (filas)
 * - Cálculo de geometría del grid
 * - Extracción de ROIs (RUT + Tablas completas)
 */

class VisionService {
  constructor() {
    this.isOpenCVReady = false;
    this.initPromise = null;
  }

  /**
   * Inicializa OpenCV.js
   */
  async initialize() {
    if (this.isOpenCVReady) return true;

    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      if (window.cv && window.cv.Mat) {
        this.isOpenCVReady = true;
        console.log('✅ OpenCV.js already loaded');
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://docs.opencv.org/4.x/opencv.js';
      script.async = true;

      script.onload = () => {
        const checkCV = setInterval(() => {
          if (window.cv && window.cv.Mat) {
            clearInterval(checkCV);
            this.isOpenCVReady = true;
            console.log('✅ OpenCV.js loaded successfully');
            resolve(true);
          }
        }, 100);

        setTimeout(() => {
          clearInterval(checkCV);
          if (!this.isOpenCVReady) {
            reject(new Error('OpenCV.js timeout'));
          }
        }, 10000);
      };

      script.onerror = () => reject(new Error('Failed to load OpenCV.js'));
      document.head.appendChild(script);
    });

    return this.initPromise;
  }

  /**
   * Convierte imagen HTML a Mat de OpenCV
   */
  imageToMat(image) {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    return window.cv.imread(canvas);
  }

  /**
   * Convierte Mat de OpenCV a base64
   */
  matToBase64(mat, quality = 0.95) {
    const canvas = document.createElement('canvas');
    window.cv.imshow(canvas, mat);
    return canvas.toDataURL('image/jpeg', quality);
  }

  /**
   * Convierte Mat a canvas (para procesamiento adicional)
   */
  matToCanvas(mat) {
    const canvas = document.createElement('canvas');
    window.cv.imshow(canvas, mat);
    return canvas;
  }

  /**
   * 📐 PASO 1: Preprocesamiento
   * Grayscale + Noise reduction + Binarization
   */
  preprocessImage(mat) {
    const gray = new window.cv.Mat();
    const blurred = new window.cv.Mat();
    const binary = new window.cv.Mat();

    try {
      // Convertir a escala de grises
      if (mat.channels() === 4) {
        window.cv.cvtColor(mat, gray, window.cv.COLOR_RGBA2GRAY);
      } else if (mat.channels() === 3) {
        window.cv.cvtColor(mat, gray, window.cv.COLOR_RGB2GRAY);
      } else {
        mat.copyTo(gray);
      }

      // Reducción de ruido con Gaussian Blur
      const ksize = new window.cv.Size(5, 5);
      window.cv.GaussianBlur(gray, blurred, ksize, 0);

      // Binarización adaptativa
      window.cv.adaptiveThreshold(
        blurred,
        binary,
        255,
        window.cv.ADAPTIVE_THRESH_GAUSSIAN_C,
        window.cv.THRESH_BINARY,
        11,
        2
      );

      gray.delete();
      blurred.delete();

      return binary;
    } catch (error) {
      gray.delete();
      blurred.delete();
      binary.delete();
      throw error;
    }
  }

  /**
   * 🎯 PASO 2: Detectar 3 marcadores QR (esquinas)
   * Busca cuadrados negros concéntricos en las esquinas
   */
  detectQRMarkers(binaryMat) {
    const contours = new window.cv.MatVector();
    const hierarchy = new window.cv.Mat();
    const markers = [];

    try {
      window.cv.findContours(
        binaryMat,
        contours,
        hierarchy,
        window.cv.RETR_TREE,
        window.cv.CHAIN_APPROX_SIMPLE
      );

      // Buscar cuadrados (marcadores QR tipo)
      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const area = window.cv.contourArea(contour);

        // Área de marcadores QR (ajustar según tu PDF)
        if (area > 150 && area < 800) {
          const peri = window.cv.arcLength(contour, true);
          const approx = new window.cv.Mat();
          window.cv.approxPolyDP(contour, approx, 0.02 * peri, true);

          // Es un cuadrilátero?
          if (approx.rows === 4) {
            const rect = window.cv.boundingRect(contour);
            const aspectRatio = rect.width / rect.height;

            // Es aproximadamente cuadrado?
            if (aspectRatio > 0.75 && aspectRatio < 1.25) {
              markers.push({
                x: rect.x + rect.width / 2,
                y: rect.y + rect.height / 2,
                width: rect.width,
                height: rect.height,
                area: area
              });
            }
          }
          approx.delete();
        }
        contour.delete();
      }

      // Ordenar y filtrar para obtener exactamente 3 marcadores
      // Top-left, Top-right, Bottom-left
      markers.sort((a, b) => a.y - b.y);

      const result = {
        topLeft: null,
        topRight: null,
        bottomLeft: null
      };

      if (markers.length >= 3) {
        // Los 2 primeros son top (ordenar por X)
        const topMarkers = markers.slice(0, 2).sort((a, b) => a.x - b.x);
        result.topLeft = topMarkers[0];
        result.topRight = topMarkers[1];

        // El tercero es bottom-left (menor X de los restantes)
        const bottomMarkers = markers.slice(2).sort((a, b) => a.x - b.x);
        result.bottomLeft = bottomMarkers[0];
      }

      return result;

    } finally {
      contours.delete();
      hierarchy.delete();
    }
  }

  /**
   * 🔄 PASO 3: Corregir perspectiva (Warp)
   * Alinea la imagen usando los 3 marcadores QR
   */
  alignImage(mat, markers) {
    const { topLeft, topRight, bottomLeft } = markers;

    if (!topLeft || !topRight || !bottomLeft) {
      console.warn('⚠️ Marcadores insuficientes, usando imagen original');
      return { aligned: mat.clone(), transform: null };
    }

    try {
      // Puntos origen (detectados)
      const srcPoints = window.cv.matFromArray(4, 1, window.cv.CV_32FC2, [
        topLeft.x, topLeft.y,
        topRight.x, topRight.y,
        bottomLeft.x, bottomLeft.y,
        topRight.x, bottomLeft.y // Inferir bottom-right
      ]);

      // Puntos destino (A4 @ 192 DPI: 1587x2245px)
      const dstWidth = 1587;
      const dstHeight = 2245;
      const dstPoints = window.cv.matFromArray(4, 1, window.cv.CV_32FC2, [
        0, 0,
        dstWidth, 0,
        0, dstHeight,
        dstWidth, dstHeight
      ]);

      // Calcular matriz de transformación
      const M = window.cv.getPerspectiveTransform(srcPoints, dstPoints);
      const aligned = new window.cv.Mat();
      const dsize = new window.cv.Size(dstWidth, dstHeight);

      window.cv.warpPerspective(
        mat,
        aligned,
        M,
        dsize,
        window.cv.INTER_LINEAR,
        window.cv.BORDER_CONSTANT,
        new window.cv.Scalar(255, 255, 255, 255)
      );

      srcPoints.delete();
      dstPoints.delete();
      M.delete();

      return { aligned, transform: { dstWidth, dstHeight } };

    } catch (error) {
      console.error('❌ Error en alineación:', error);
      return { aligned: mat.clone(), transform: null };
    }
  }

  /**
   * 📍 PASO 4: Detectar marcas laterales (filas)
   * Busca cuadrados pequeños a la izquierda y derecha de las tablas
   */
  detectRowMarkers(binaryMat, side = 'left') {
    const height = binaryMat.rows;
    const width = binaryMat.cols;

    // Definir ROI para buscar marcas laterales
    const roiX = side === 'left' ? Math.floor(width * 0.03) : Math.floor(width * 0.88);
    const roiWidth = Math.floor(width * 0.08);
    const roiY = Math.floor(height * 0.12); // Después del header
    const roiHeight = Math.floor(height * 0.80);

    const rect = new window.cv.Rect(roiX, roiY, roiWidth, roiHeight);
    const roi = binaryMat.roi(rect);

    const contours = new window.cv.MatVector();
    const hierarchy = new window.cv.Mat();
    const markers = [];

    try {
      window.cv.findContours(
        roi,
        contours,
        hierarchy,
        window.cv.RETR_EXTERNAL,
        window.cv.CHAIN_APPROX_SIMPLE
      );

      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const area = window.cv.contourArea(contour);

        // Marcas laterales pequeñas (ajustar según tu PDF)
        if (area > 20 && area < 200) {
          const rect = window.cv.boundingRect(contour);
          const aspectRatio = rect.width / rect.height;

          // Aproximadamente cuadrado
          if (aspectRatio > 0.6 && aspectRatio < 1.4) {
            markers.push({
              x: roiX + rect.x + rect.width / 2,
              y: roiY + rect.y + rect.height / 2,
              width: rect.width,
              height: rect.height
            });
          }
        }
        contour.delete();
      }

      // Ordenar por Y (de arriba a abajo)
      markers.sort((a, b) => a.y - b.y);

      return markers;

    } finally {
      roi.delete();
      contours.delete();
      hierarchy.delete();
    }
  }

  /**
   * 📊 PASO 5: Calcular geometría del grid
   * Determina posición de cada celda basándose en las marcas laterales
   */
  calculateGridGeometry(alignedMat, leftMarkers, rightMarkers) {
    const width = alignedMat.cols;
    const height = alignedMat.rows;

    // Configuración de tablas (ajustar según tu PDF)
    const tableConfig = {
      left: {
        startX: Math.floor(width * 0.05),
        endX: Math.floor(width * 0.48),
        alternativeWidth: Math.floor(width * 0.05)
      },
      right: {
        startX: Math.floor(width * 0.52),
        endX: Math.floor(width * 0.95),
        alternativeWidth: Math.floor(width * 0.05)
      },
      cellHeight: 30 // Altura promedio de celda
    };

    const grids = {
      left: [],
      right: []
    };

    // Grid izquierdo
    leftMarkers.forEach((marker, idx) => {
      const numAlternatives = 5; // Por defecto, ajustar si detectas V/F
      const alternatives = [];

      for (let i = 0; i < numAlternatives; i++) {
        alternatives.push({
          letter: String.fromCharCode(65 + i), // A, B, C, D, E
          x: tableConfig.left.startX + (i * tableConfig.left.alternativeWidth),
          y: marker.y,
          width: tableConfig.left.alternativeWidth,
          height: tableConfig.cellHeight
        });
      }

      grids.left.push({
        questionNumber: idx + 1,
        y: marker.y,
        alternatives: alternatives
      });
    });

    // Grid derecho
    rightMarkers.forEach((marker, idx) => {
      const numAlternatives = 5;
      const alternatives = [];

      for (let i = 0; i < numAlternatives; i++) {
        alternatives.push({
          letter: String.fromCharCode(65 + i),
          x: tableConfig.right.startX + (i * tableConfig.right.alternativeWidth),
          y: marker.y,
          width: tableConfig.right.alternativeWidth,
          height: tableConfig.cellHeight
        });
      }

      grids.right.push({
        questionNumber: leftMarkers.length + idx + 1,
        y: marker.y,
        alternatives: alternatives
      });
    });

    return grids;
  }

  /**
   * ✂️ PASO 6: Extraer ROIs (RUT + Tablas)
   */
  extractROIs(alignedMat, grids) {
    const width = alignedMat.cols;
    const height = alignedMat.rows;

    const rois = {
      rut: null,
      tableLeft: null,
      tableRight: null
    };

    try {
      // ROI del RUT (ajustar coordenadas según tu PDF)
      const rutRect = new window.cv.Rect(
        Math.floor(width * 0.05),
        Math.floor(height * 0.06),
        Math.floor(width * 0.25),
        Math.floor(height * 0.025)
      );
      rois.rut = alignedMat.roi(rutRect);

      // ROI tabla izquierda
      if (grids.left.length > 0) {
        const firstY = grids.left[0].y - 20;
        const lastY = grids.left[grids.left.length - 1].y + 30;
        const tableLeftRect = new window.cv.Rect(
          Math.floor(width * 0.05),
          firstY,
          Math.floor(width * 0.43),
          lastY - firstY
        );
        rois.tableLeft = alignedMat.roi(tableLeftRect);
      }

      // ROI tabla derecha
      if (grids.right.length > 0) {
        const firstY = grids.right[0].y - 20;
        const lastY = grids.right[grids.right.length - 1].y + 30;
        const tableRightRect = new window.cv.Rect(
          Math.floor(width * 0.52),
          firstY,
          Math.floor(width * 0.43),
          lastY - firstY
        );
        rois.tableRight = alignedMat.roi(tableRightRect);
      }

    } catch (error) {
      console.error('❌ Error extrayendo ROIs:', error);
    }

    return rois;
  }

  /**
   * 🔍 Pipeline completo de procesamiento
   */
  async processAnswerSheet(imageData) {
    await this.initialize();

    console.log('📄 Procesando hoja de respuesta...');
    const startTime = performance.now();

    const { image } = imageData;
    let mat = this.imageToMat(image);

    const results = {
      success: false,
      original: this.matToBase64(mat, 0.75), // Comprimido para storage
      aligned: null,
      rois: null,
      grids: null,
      metadata: {
        originalSize: { width: mat.cols, height: mat.rows },
        markersFound: 0,
        leftRowMarkers: 0,
        rightRowMarkers: 0
      },
      errors: []
    };

    try {
      // 1. Preprocesamiento
      console.log('1️⃣ Preprocesando imagen...');
      const preprocessed = this.preprocessImage(mat);
      mat.delete();
      mat = preprocessed;

      // 2. Detectar marcadores QR
      console.log('2️⃣ Detectando marcadores QR...');
      const qrMarkers = this.detectQRMarkers(mat);
      const markersCount = [qrMarkers.topLeft, qrMarkers.topRight, qrMarkers.bottomLeft]
        .filter(m => m !== null).length;
      results.metadata.markersFound = markersCount;

      if (markersCount < 3) {
        results.errors.push('No se encontraron los 3 marcadores QR necesarios');
      }

      // 3. Alinear imagen
      console.log('3️⃣ Corrigiendo perspectiva...');
      const { aligned, transform } = this.alignImage(mat, qrMarkers);
      mat.delete();
      mat = aligned;
      results.aligned = this.matToBase64(mat, 0.85);

      // 4. Detectar marcas laterales
      console.log('4️⃣ Detectando marcas laterales...');
      const leftMarkers = this.detectRowMarkers(mat, 'left');
      const rightMarkers = this.detectRowMarkers(mat, 'right');
      results.metadata.leftRowMarkers = leftMarkers.length;
      results.metadata.rightRowMarkers = rightMarkers.length;

      console.log(`   ✓ Marcas izquierda: ${leftMarkers.length}`);
      console.log(`   ✓ Marcas derecha: ${rightMarkers.length}`);

      if (leftMarkers.length === 0 && rightMarkers.length === 0) {
        results.errors.push('No se detectaron marcas laterales');
      }

      // 5. Calcular geometría del grid
      console.log('5️⃣ Calculando geometría del grid...');
      const grids = this.calculateGridGeometry(mat, leftMarkers, rightMarkers);
      results.grids = grids;

      // 6. Extraer ROIs
      console.log('6️⃣ Extrayendo ROIs...');
      const rois = this.extractROIs(mat, grids);
      results.rois = {
        rut: rois.rut ? this.matToBase64(rois.rut) : null,
        tableLeft: rois.tableLeft ? this.matToBase64(rois.tableLeft) : null,
        tableRight: rois.tableRight ? this.matToBase64(rois.tableRight) : null,
        // Guardar Mats para procesamiento posterior
        rutMat: rois.rut,
        tableLeftMat: rois.tableLeft,
        tableRightMat: rois.tableRight
      };

      const endTime = performance.now();
      results.metadata.processingTime = endTime - startTime;
      results.success = results.errors.length === 0;

      console.log(`✅ Procesamiento OpenCV completado en ${(endTime - startTime).toFixed(2)}ms`);

      return results;

    } catch (error) {
      console.error('❌ Error en pipeline de visión:', error);
      results.errors.push(error.message);
      return results;
    } finally {
      if (mat && !mat.isDeleted()) {
        mat.delete();
      }
    }
  }

  /**
   * 🧹 Limpiar recursos OpenCV
   */
  cleanup(rois) {
    if (!rois) return;

    const matsToClean = ['rutMat', 'tableLeftMat', 'tableRightMat'];
    matsToClean.forEach(key => {
      if (rois[key] && !rois[key].isDeleted()) {
        rois[key].delete();
      }
    });
  }
}

export default new VisionService();

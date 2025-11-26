/**
 * ✅ Correction Service - Orquestador del Pipeline Completo
 *
 * Coordina todos los servicios para corrección automática:
 * PDF → Vision (OpenCV) → OCR (RUT) → YOLO (marcas) → Corrección → Resultados
 */

import pdfService from '@/core/vision/pdfService';
import visionService from '@/core/vision/visionService';
import ocrService from '@/core/vision/ocrService';
import yoloService from '@/core/vision/yoloService';
import { db } from '@/core/storage/db';

class CorrectionService {
  constructor() {
    this.isProcessing = false;
    this.currentProgress = {
      stage: '',
      current: 0,
      total: 0,
      percentage: 0
    };
  }

  /**
   * Verifica si todos los servicios están disponibles
   */
  async checkServicesAvailability() {
    const status = {
      opencv: false,
      tesseract: false,
      yolo: false,
      yoloModelAvailable: false
    };

    try {
      // Verificar OpenCV
      await visionService.initialize();
      status.opencv = visionService.isOpenCVReady;

      // Verificar Tesseract (lazy, no inicializar aún)
      status.tesseract = true; // Se carga cuando se necesita

      // Verificar YOLO
      status.yoloModelAvailable = await yoloService.checkModelAvailability();
      status.yolo = status.yoloModelAvailable;

    } catch (error) {
      console.error('Error verificando servicios:', error);
    }

    return status;
  }

  /**
   * Procesa un PDF completo con todas las hojas de respuesta
   */
  async processPDF(file, examId, options = {}) {
    if (this.isProcessing) {
      throw new Error('Ya hay un procesamiento en curso');
    }

    this.isProcessing = true;

    const {
      onProgress = null,
      concurrency = 4,
      autoIdentifyStudents = true
    } = options;

    try {
      // FASE 1: Convertir PDF a imágenes
      console.log('📄 FASE 1: Convirtiendo PDF a imágenes...');
      this.updateProgress('Convirtiendo PDF...', 0, 100, onProgress);

      const pages = await pdfService.convertPDFToImages(file, (current, total) => {
        this.updateProgress('Convirtiendo PDF...', current, total, onProgress);
      });

      console.log(`✓ ${pages.length} páginas convertidas`);

      // FASE 2: Inicializar servicios
      console.log('🔧 FASE 2: Inicializando servicios...');
      this.updateProgress('Inicializando servicios...', 0, 3, onProgress);

      await visionService.initialize();
      this.updateProgress('Inicializando servicios...', 1, 3, onProgress);

      const yoloStatus = await yoloService.checkModelAvailability();
      if (!yoloStatus) {
        throw new Error('MODELO_YOLO_NO_DISPONIBLE');
      }

      await yoloService.initialize((progress) => {
        this.updateProgress(`Descargando modelo YOLO... ${progress.toFixed(0)}%`, 2, 3, onProgress);
      });

      this.updateProgress('Inicializando servicios...', 3, 3, onProgress);
      console.log('✓ Servicios listos');

      // FASE 3: Procesar páginas en batch
      console.log('🔍 FASE 3: Procesando hojas de respuesta...');
      const results = await this.processBatch(pages, examId, concurrency, onProgress);

      // FASE 4: Identificar estudiantes
      if (autoIdentifyStudents) {
        console.log('👥 FASE 4: Identificando estudiantes...');
        await this.identifyStudents(results, onProgress);
      }

      // FASE 5: Guardar en IndexedDB
      console.log('💾 FASE 5: Guardando resultados...');
      await this.saveResults(results, examId, onProgress);

      console.log('✅ Procesamiento completo');

      return {
        success: true,
        totalPages: pages.length,
        processedPages: results.length,
        identified: results.filter(r => r.studentId !== null).length,
        pending: results.filter(r => r.studentId === null).length,
        errors: results.filter(r => r.needsReview).length,
        results: results
      };

    } catch (error) {
      console.error('❌ Error en procesamiento:', error);

      if (error.message === 'MODELO_YOLO_NO_DISPONIBLE') {
        throw new Error(
          '⚠️ El modelo YOLO no está disponible. ' +
          'Por favor, sube el modelo entrenado a /public/models/ o configura la URL remota.'
        );
      }

      throw error;

    } finally {
      this.isProcessing = false;
      await ocrService.terminate();
    }
  }

  /**
   * Procesa páginas en lotes
   */
  async processBatch(pages, examId, concurrency, onProgress) {
    const results = [];
    const exam = await db.exams.get(examId);

    if (!exam) {
      throw new Error('Examen no encontrado');
    }

    for (let i = 0; i < pages.length; i += concurrency) {
      const batch = pages.slice(i, i + concurrency);

      this.updateProgress(
        `Procesando hojas ${i + 1}-${Math.min(i + concurrency, pages.length)}...`,
        i,
        pages.length,
        onProgress
      );

      const batchResults = await Promise.all(
        batch.map(page => this.processPage(page, exam))
      );

      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Procesa una página individual
   */
  async processPage(pageData, exam) {
    const startTime = performance.now();
    const result = {
      pageNumber: pageData.pageNumber,
      examId: exam.id,
      studentId: null,
      detectedRUT: null,
      rutValid: false,
      rutConfidence: 0,
      answers: [],
      score: 0,
      percentage: 0,
      grade: null,
      detections: [],
      needsReview: false,
      reviewReasons: [],
      thumbnail: null,
      alignedImage: null,
      rutImage: null,
      tableLeftImage: null,
      tableRightImage: null,
      processingTime: 0,
      correctedAt: new Date()
    };

    try {
      // 1. OpenCV: Procesamiento + ROIs (sin alineación)
      const visionResult = await visionService.processAnswerSheet(pageData);

      // Solo marcar para revisión si hay errores críticos (no encontrar marcadores QR ya no es crítico)
      const criticalErrors = visionResult.errors.filter(error =>
        !error.includes('marcadores QR necesarios')
      );

      if (!visionResult.success && criticalErrors.length > 0) {
        result.needsReview = true;
        result.reviewReasons.push(...criticalErrors);
      }

      // Thumbnail (imagen original comprimida)
      result.thumbnail = visionResult.original;

      // Imágenes de debug - Pipeline del HTML
      result.debugStep1Grayscale = visionResult.debug?.step1_grayscale;
      result.debugStep4MarkersDetected = visionResult.debug?.step4_markersDetected;
      result.debugStep5Warped = visionResult.debug?.step5_warped;
      result.debugStep6GridDetected = visionResult.debug?.step6_gridDetected;
      result.debugStep7RoiLeft = visionResult.debug?.step7_roiLeft;
      result.debugStep8RoiRight = visionResult.debug?.step8_roiRight;

      // Metadata del procesamiento
      result.markersFound = visionResult.metadata?.markersFound || 0;
      result.rowsDetected = visionResult.metadata?.rowsDetected || 0;

      // DEBUG: Log para verificar qué imágenes se están guardando
      console.log('📸 Imágenes de debug capturadas:', {
        step1: !!result.debugStep1Grayscale,
        step4: !!result.debugStep4MarkersDetected,
        step5: !!result.debugStep5Warped,
        step6: !!result.debugStep6GridDetected,
        step7: !!result.debugStep7RoiLeft,
        step8: !!result.debugStep8RoiRight,
        markers: result.markersFound,
        rows: result.rowsDetected
      });

      // Imágenes auxiliares para la vista previa (ROIs procesados)
      result.rutImage = visionResult.rois?.rut;
      result.tableLeftImage = visionResult.rois?.tableLeft;
      result.tableRightImage = visionResult.rois?.tableRight;

      // 2. OCR: Extraer RUT
      if (visionResult.rois?.rut) {
        const ocrResult = await ocrService.extractRUT(visionResult.rois.rut);

        if (ocrResult.success) {
          result.detectedRUT = `${ocrResult.rut}-${ocrResult.dv}`;
          result.rutValid = ocrResult.isValid;
          result.rutConfidence = ocrResult.confidence;

          if (!ocrResult.isValid) {
            result.needsReview = true;
            result.reviewReasons.push('RUT inválido (dígito verificador)');
          }
        } else {
          result.needsReview = true;
          result.reviewReasons.push('No se pudo extraer RUT');
        }
      }

      // 3. YOLO: Detectar marcas en tablas
      const allDetections = [];

      // Detectar tabla izquierda
      if (visionResult.rois?.tableLeft) {
        const leftResult = await yoloService.detect(visionResult.rois.tableLeft);
        if (leftResult.success) {
          allDetections.push(...leftResult.detections.map(d => ({ ...d, table: 'left' })));

          // Dibujar detecciones para debug
          const leftWithDetections = await this.drawDetectionsOnImage(
            visionResult.rois.tableLeft,
            leftResult.detections
          );
          result.debugYoloLeft = leftWithDetections;
        }
      }

      // Detectar tabla derecha
      if (visionResult.rois?.tableRight) {
        const rightResult = await yoloService.detect(visionResult.rois.tableRight);
        if (rightResult.success) {
          allDetections.push(...rightResult.detections.map(d => ({ ...d, table: 'right' })));

          // Dibujar detecciones para debug
          const rightWithDetections = await this.drawDetectionsOnImage(
            visionResult.rois.tableRight,
            rightResult.detections
          );
          result.debugYoloRight = rightWithDetections;
        }
      }

      result.detections = allDetections;

      // 4. Mapear detecciones a respuestas
      // TEMPORAL: Por ahora no mapeamos porque no tenemos grids
      // TODO: Implementar detección de grid en zona de tablas
      const answers = [];

      result.answers = answers;

      // 5. Validar respuestas múltiples
      const multipleMarks = answers.filter(a => a.multipleMarks);
      if (multipleMarks.length > 0) {
        result.needsReview = true;
        result.reviewReasons.push(`${multipleMarks.length} preguntas con múltiples marcas`);
      }

      // 6. Calcular puntaje (con studentId si está identificado)
      const scoring = this.calculateScore(answers, exam, result.studentId);
      result.score = scoring.score;
      result.percentage = scoring.percentage;
      result.grade = scoring.grade;

      // Si hubo error obteniendo gabarito, marcar para revisión
      if (scoring.error) {
        result.needsReview = true;
        result.reviewReasons.push(scoring.error);
      }

      // 7. Validar detecciones de baja confianza
      const lowConfidence = allDetections.filter(d => d.confidence < 0.7);
      if (lowConfidence.length > 0) {
        result.needsReview = true;
        result.reviewReasons.push(`${lowConfidence.length} detecciones con baja confianza`);
      }

      // Cleanup OpenCV Mats
      visionService.cleanup(visionResult.rois);

    } catch (error) {
      console.error(`Error procesando página ${pageData.pageNumber}:`, error);
      result.needsReview = true;
      result.reviewReasons.push(`Error: ${error.message}`);
    }

    result.processingTime = performance.now() - startTime;
    return result;
  }

  /**
   * Mapea detecciones YOLO a respuestas por pregunta
   */
  mapDetectionsToAnswers(detections, grids) {
    const answers = [];
    const tolerance = 15; // Pixeles de tolerancia

    // Procesar tabla izquierda
    if (grids.left) {
      grids.left.forEach(row => {
        const rowDetections = detections.filter(d => {
          return d.table === 'left' &&
                 Math.abs(d.bbox.y - row.y) < tolerance;
        });

        const markedAlternatives = [];

        rowDetections.forEach(det => {
          const centerX = det.bbox.x + det.bbox.width / 2;

          row.alternatives.forEach(alt => {
            if (Math.abs(centerX - alt.x) < tolerance) {
              markedAlternatives.push({
                letter: alt.letter,
                confidence: det.confidence,
                markType: det.class
              });
            }
          });
        });

        answers.push({
          question: row.questionNumber,
          selected: markedAlternatives.length === 1 ? markedAlternatives[0].letter : null,
          confidence: markedAlternatives.length === 1 ? markedAlternatives[0].confidence : 0,
          markType: markedAlternatives.length === 1 ? markedAlternatives[0].markType : null,
          multipleMarks: markedAlternatives.length > 1,
          allMarked: markedAlternatives
        });
      });
    }

    // Procesar tabla derecha
    if (grids.right) {
      grids.right.forEach(row => {
        const rowDetections = detections.filter(d => {
          return d.table === 'right' &&
                 Math.abs(d.bbox.y - row.y) < tolerance;
        });

        const markedAlternatives = [];

        rowDetections.forEach(det => {
          const centerX = det.bbox.x + det.bbox.width / 2;

          row.alternatives.forEach(alt => {
            if (Math.abs(centerX - alt.x) < tolerance) {
              markedAlternatives.push({
                letter: alt.letter,
                confidence: det.confidence,
                markType: det.class
              });
            }
          });
        });

        answers.push({
          question: row.questionNumber,
          selected: markedAlternatives.length === 1 ? markedAlternatives[0].letter : null,
          confidence: markedAlternatives.length === 1 ? markedAlternatives[0].confidence : 0,
          markType: markedAlternatives.length === 1 ? markedAlternatives[0].markType : null,
          multipleMarks: markedAlternatives.length > 1,
          allMarked: markedAlternatives
        });
      });
    }

    return answers.sort((a, b) => a.question - b.question);
  }

  /**
   * Obtiene el gabarito (respuestas correctas) para un estudiante específico
   * @private
   */
  getAnswerKeyForStudent(exam, studentId) {
    if (!exam.finalizedVersions) {
      throw new Error('El examen no tiene gabarito. Debe estar finalizado.');
    }

    if (exam.finalizedVersions.type === 'differentiated') {
      // Examen diferenciado: cada estudiante tiene su gabarito
      const answerKey = exam.finalizedVersions.answerKeys?.[studentId];
      if (!answerKey) {
        throw new Error(`No se encontró gabarito para el estudiante ${studentId}`);
      }
      return answerKey;
    } else {
      // Examen uniforme: gabarito único para todos
      return exam.finalizedVersions.answerKey;
    }
  }

  /**
   * Calcula puntaje y nota usando el gabarito correcto
   */
  calculateScore(answers, exam, studentId = null) {
    let correctCount = 0;
    const totalQuestions = exam.questions.length;

    // Obtener gabarito correcto
    let answerKey;
    try {
      if (studentId) {
        answerKey = this.getAnswerKeyForStudent(exam, studentId);
      } else {
        // Sin studentId, intentar usar gabarito uniforme
        answerKey = exam.finalizedVersions?.answerKey;
        if (!answerKey) {
          throw new Error('Este examen no tiene gabarito. Usa el botón "Regenerar Gabaritos" en la pestaña de corrección.');
        }
      }
    } catch (error) {
      console.error('Error obteniendo gabarito:', error);
      // Retornar puntaje 0 si no hay gabarito
      return {
        score: 0,
        total: totalQuestions,
        percentage: 0,
        grade: exam.grading?.minGrade || 1.0,
        error: error.message
      };
    }

    // Comparar respuestas con gabarito
    answers.forEach(answer => {
      if (answer.multipleMarks || !answer.selected) return;

      // Buscar respuesta correcta en gabarito
      const correctAnswer = answerKey.find(ak => ak.question === answer.question);
      if (!correctAnswer) return;

      // Comparar
      if (answer.selected === correctAnswer.correctAnswer) {
        correctCount++;
      }
    });

    const percentage = (correctCount / totalQuestions) * 100;

    // Calcular nota según escala del examen
    const grading = exam.grading || {
      maxGrade: 7.0,
      minGrade: 1.0,
      demandPercentage: 60
    };

    const passingScore = Math.ceil((totalQuestions * grading.demandPercentage) / 100);
    let grade;

    if (correctCount >= passingScore) {
      const rangeTop = totalQuestions - passingScore;
      const rangeGrade = grading.maxGrade - grading.passingGrade;
      grade = grading.passingGrade + ((correctCount - passingScore) / rangeTop) * rangeGrade;
    } else {
      const rangeBottom = passingScore;
      const rangeGrade = grading.passingGrade - grading.minGrade;
      grade = grading.minGrade + (correctCount / rangeBottom) * rangeGrade;
    }

    return {
      score: correctCount,
      total: totalQuestions,
      percentage: Math.round(percentage * 10) / 10,
      grade: Math.round(grade * 10) / 10
    };
  }

  /**
   * Identifica estudiantes por RUT
   */
  async identifyStudents(results, onProgress) {
    let identified = 0;

    for (const result of results) {
      if (!result.detectedRUT || !result.rutValid) continue;

      // Buscar estudiante por RUT
      const student = await db.students
        .where('rut')
        .equals(result.detectedRUT)
        .first();

      if (student) {
        result.studentId = student.id;
        identified++;
      }
    }

    console.log(`✓ ${identified}/${results.length} estudiantes identificados`);
  }

  /**
   * Guarda resultados en IndexedDB
   */
  async saveResults(results, examId, onProgress) {
    const resultsToSave = results.map(r => ({
      id: crypto.randomUUID(),
      examId: examId,
      studentId: r.studentId,
      detectedRUT: r.detectedRUT,
      rutValid: r.rutValid,
      rutConfidence: r.rutConfidence,
      answers: r.answers,
      score: r.score,
      percentage: r.percentage,
      grade: r.grade,
      detections: r.detections,
      needsReview: r.needsReview,
      reviewReasons: r.reviewReasons,
      thumbnail: r.thumbnail,
      // Imágenes de debug - Todos los pasos
      debugStep1Grayscale: r.debugStep1Grayscale,
      debugStep2Blurred: r.debugStep2Blurred,
      debugStep3Binary: r.debugStep3Binary,
      debugStep4MarkersDetected: r.debugStep4MarkersDetected,
      debugStep5InnerROI: r.debugStep5InnerROI,
      debugStep6TableBorder: r.debugStep6TableBorder,
      debugStep7RutZone: r.debugStep7RutZone,
      debugStep8TablesZone: r.debugStep8TablesZone,
      // ROIs procesados
      rutImage: r.rutImage,
      tableLeftImage: r.tableLeftImage,
      tableRightImage: r.tableRightImage,
      processingTime: r.processingTime,
      correctedAt: r.correctedAt
    }));

    await db.results.bulkAdd(resultsToSave);
    console.log(`✓ ${resultsToSave.length} resultados guardados`);
  }

  /**
   * Actualiza progreso
   */
  updateProgress(stage, current, total, callback) {
    this.currentProgress = {
      stage,
      current,
      total,
      percentage: total > 0 ? Math.round((current / total) * 100) : 0
    };

    if (callback) {
      callback(this.currentProgress);
    }
  }

  /**
   * Obtiene progreso actual
   */
  getProgress() {
    return this.currentProgress;
  }

  /**
   * Obtiene resultados de un examen específico
   */
  async getResultsByExam(examId) {
    return await db.results.where('examId').equals(examId).toArray();
  }

  /**
   * Obtiene un resultado específico
   */
  async getResultById(resultId) {
    return await db.results.get(resultId);
  }

  /**
   * Elimina resultados de un examen
   */
  async deleteResultsByExam(examId) {
    await db.results.where('examId').equals(examId).delete();
  }

  /**
   * Dibuja las detecciones de YOLO sobre una imagen
   */
  async drawDetectionsOnImage(imageBase64, detections) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        // Dibujar imagen original
        ctx.drawImage(img, 0, 0);

        // Dibujar cada detección
        detections.forEach(detection => {
          const { bbox, class: className, confidence } = detection;

          // bbox es un objeto con {x, y, width, height}
          const { x, y, width, height } = bbox;

          // Color según clase
          const colors = {
            'mark_X': '#FF0000',       // Rojo
            'mark_circle': '#00FF00',  // Verde
            'mark_line': '#0000FF',    // Azul
            'mark_check': '#FF00FF'    // Magenta
          };
          const color = colors[className] || '#FFFF00';

          // Dibujar rectángulo
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, width, height);

          // Dibujar etiqueta con fondo
          const label = `${className} ${(confidence * 100).toFixed(0)}%`;
          ctx.font = '14px Arial';
          const textMetrics = ctx.measureText(label);

          // Fondo para el texto
          ctx.fillStyle = color;
          ctx.fillRect(x, y - 20, textMetrics.width + 8, 18);

          // Texto
          ctx.fillStyle = '#000000';
          ctx.fillText(label, x + 4, y - 6);
        });

        // Convertir a base64
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      img.onerror = reject;
      img.src = imageBase64;
    });
  }
}

export default new CorrectionService();

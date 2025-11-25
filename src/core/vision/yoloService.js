/**
 * 🤖 YOLO Service - Detección de marcas con YOLOv11n
 *
 * Utiliza ONNX Runtime Web para ejecutar el modelo en el navegador
 * Descarga el modelo desde URL remota (permite actualizaciones sin rebuild)
 */

import * as ort from 'onnxruntime-web';

class YOLOService {
  constructor() {
    this.session = null;
    this.isInitialized = false;
    this.initPromise = null;

    // Cargar URL del modelo desde localStorage o usar predeterminada
    const storedURL = localStorage.getItem('nexam_yolo_model_url');
    const defaultURL = 'http://tmeduca.org/models/nexam_v1.onnx';

    this.modelConfig = {
      // URL del modelo (configurable desde Settings)
      modelURL: storedURL || defaultURL,

      // Configuración del modelo
      inputSize: 640,
      classes: ['mark_X', 'mark_circle', 'mark_line', 'mark_check'],
      confidenceThreshold: 0.5,
      iouThreshold: 0.4
    };
    this.modelAvailable = false;
    this.downloadProgress = 0;
  }

  /**
   * Verifica si el modelo está disponible
   */
  async checkModelAvailability() {
    try {
      const response = await fetch(this.modelConfig.modelURL, { method: 'HEAD' });
      this.modelAvailable = response.ok;
      return this.modelAvailable;
    } catch (error) {
      console.warn('⚠️ Modelo YOLO no disponible:', error.message);
      this.modelAvailable = false;
      return false;
    }
  }

  /**
   * Descarga el modelo con progreso
   */
  async downloadModel(onProgress = null) {
    try {
      console.log('📥 Descargando modelo YOLO...');

      const response = await fetch(this.modelConfig.modelURL);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = parseInt(contentLength, 10);
      let loaded = 0;

      const reader = response.body.getReader();
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        loaded += value.length;

        if (onProgress && total) {
          this.downloadProgress = (loaded / total) * 100;
          onProgress(this.downloadProgress, loaded, total);
        }
      }

      // Concatenar chunks
      const blob = new Blob(chunks);
      const arrayBuffer = await blob.arrayBuffer();

      console.log('✅ Modelo descargado');
      return arrayBuffer;

    } catch (error) {
      console.error('❌ Error descargando modelo:', error);
      throw new Error(`No se pudo descargar el modelo: ${error.message}`);
    }
  }

  /**
   * Inicializa ONNX Runtime y carga el modelo
   */
  async initialize(onProgress = null) {
    if (this.isInitialized) return true;

    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        // Verificar disponibilidad del modelo
        const isAvailable = await this.checkModelAvailability();

        if (!isAvailable) {
          throw new Error('MODELO_NO_DISPONIBLE');
        }

        // Configurar ONNX Runtime
        ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.16.0/dist/';
        ort.env.wasm.numThreads = 4;

        // Descargar modelo
        const modelBuffer = await this.downloadModel(onProgress);

        // Crear sesión de inferencia
        console.log('🔧 Inicializando sesión ONNX...');
        this.session = await ort.InferenceSession.create(modelBuffer, {
          executionProviders: ['wasm'],
          graphOptimizationLevel: 'all'
        });

        console.log('✅ YOLO Service inicializado');
        this.isInitialized = true;
        return true;

      } catch (error) {
        console.error('❌ Error inicializando YOLO:', error);

        if (error.message === 'MODELO_NO_DISPONIBLE') {
          this.isInitialized = false;
          this.initPromise = null;
          throw error;
        }

        throw new Error(`Error al cargar modelo YOLO: ${error.message}`);
      }
    })();

    return this.initPromise;
  }

  /**
   * Preprocesa imagen para YOLO
   */
  preprocessImage(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data, width, height } = imageData;

    // Resize a 640x640 manteniendo aspect ratio
    const targetSize = this.modelConfig.inputSize;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = targetSize;
    tempCanvas.height = targetSize;
    const tempCtx = tempCanvas.getContext('2d');

    // Fondo blanco
    tempCtx.fillStyle = '#FFFFFF';
    tempCtx.fillRect(0, 0, targetSize, targetSize);

    // Calcular escala
    const scale = Math.min(targetSize / width, targetSize / height);
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    const x = (targetSize - scaledWidth) / 2;
    const y = (targetSize - scaledHeight) / 2;

    tempCtx.drawImage(canvas, x, y, scaledWidth, scaledHeight);

    // Convertir a tensor [1, 3, 640, 640]
    const resizedData = tempCtx.getImageData(0, 0, targetSize, targetSize);
    const pixels = resizedData.data;

    const red = [];
    const green = [];
    const blue = [];

    for (let i = 0; i < pixels.length; i += 4) {
      red.push(pixels[i] / 255.0);
      green.push(pixels[i + 1] / 255.0);
      blue.push(pixels[i + 2] / 255.0);
    }

    const inputTensor = new Float32Array([...red, ...green, ...blue]);

    return {
      tensor: inputTensor,
      scale: scale,
      offsetX: x,
      offsetY: y
    };
  }

  /**
   * Post-procesa salida de YOLO (NMS + threshold)
   */
  postprocess(output, imageInfo) {
    const { scale, offsetX, offsetY } = imageInfo;
    const detections = [];

    // Output shape: [1, 84, 8400] o [1, num_classes + 4, anchors]
    // Formato: [x, y, w, h, conf_class0, conf_class1, ...]

    const numClasses = this.modelConfig.classes.length;
    const numDetections = output.length / (4 + numClasses);

    for (let i = 0; i < numDetections; i++) {
      const offset = i * (4 + numClasses);

      // Coordenadas
      const x = output[offset];
      const y = output[offset + 1];
      const w = output[offset + 2];
      const h = output[offset + 3];

      // Encontrar clase con mayor confianza
      let maxConf = 0;
      let maxClass = 0;

      for (let c = 0; c < numClasses; c++) {
        const conf = output[offset + 4 + c];
        if (conf > maxConf) {
          maxConf = conf;
          maxClass = c;
        }
      }

      // Filtrar por threshold
      if (maxConf >= this.modelConfig.confidenceThreshold) {
        // Convertir coordenadas a imagen original
        const x1 = ((x - w / 2) - offsetX) / scale;
        const y1 = ((y - h / 2) - offsetY) / scale;
        const x2 = ((x + w / 2) - offsetX) / scale;
        const y2 = ((y + h / 2) - offsetY) / scale;

        detections.push({
          class: this.modelConfig.classes[maxClass],
          classId: maxClass,
          confidence: maxConf,
          bbox: {
            x: Math.max(0, x1),
            y: Math.max(0, y1),
            width: x2 - x1,
            height: y2 - y1
          }
        });
      }
    }

    // Non-Maximum Suppression
    return this.applyNMS(detections);
  }

  /**
   * Aplica Non-Maximum Suppression
   */
  applyNMS(detections) {
    if (detections.length === 0) return [];

    // Ordenar por confianza
    detections.sort((a, b) => b.confidence - a.confidence);

    const keep = [];
    const iouThreshold = this.modelConfig.iouThreshold;

    while (detections.length > 0) {
      const current = detections.shift();
      keep.push(current);

      detections = detections.filter(det => {
        const iou = this.calculateIOU(current.bbox, det.bbox);
        return iou < iouThreshold;
      });
    }

    return keep;
  }

  /**
   * Calcula Intersection over Union
   */
  calculateIOU(boxA, boxB) {
    const xA = Math.max(boxA.x, boxB.x);
    const yA = Math.max(boxA.y, boxB.y);
    const xB = Math.min(boxA.x + boxA.width, boxB.x + boxB.width);
    const yB = Math.min(boxA.y + boxA.height, boxB.y + boxB.height);

    const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);

    const boxAArea = boxA.width * boxA.height;
    const boxBArea = boxB.width * boxB.height;

    const unionArea = boxAArea + boxBArea - interArea;

    return interArea / unionArea;
  }

  /**
   * Detecta marcas en una imagen (tabla completa)
   */
  async detect(imageBase64OrCanvas) {
    if (!this.isInitialized) {
      throw new Error('YOLO Service no inicializado. Ejecuta initialize() primero.');
    }

    console.log('🔍 Detectando marcas con YOLO...');
    const startTime = performance.now();

    try {
      // Convertir a canvas si es base64
      let canvas;
      if (typeof imageBase64OrCanvas === 'string') {
        canvas = await this.base64ToCanvas(imageBase64OrCanvas);
      } else {
        canvas = imageBase64OrCanvas;
      }

      // Preprocesar
      const { tensor, scale, offsetX, offsetY } = this.preprocessImage(canvas);

      // Crear input tensor
      const inputTensor = new ort.Tensor('float32', tensor, [1, 3, 640, 640]);

      // Inferencia
      const feeds = { images: inputTensor };
      const results = await this.session.run(feeds);

      // Obtener output (nombre puede variar según modelo)
      const outputName = this.session.outputNames[0];
      const output = results[outputName].data;

      // Post-procesar
      const detections = this.postprocess(output, { scale, offsetX, offsetY });

      const endTime = performance.now();
      console.log(`✅ ${detections.length} marcas detectadas en ${(endTime - startTime).toFixed(2)}ms`);

      return {
        success: true,
        detections: detections,
        processingTime: endTime - startTime
      };

    } catch (error) {
      console.error('❌ Error en detección YOLO:', error);
      return {
        success: false,
        detections: [],
        error: error.message,
        processingTime: 0
      };
    }
  }

  /**
   * Convierte base64 a canvas
   */
  async base64ToCanvas(base64) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      };
      img.onerror = reject;
      img.src = base64;
    });
  }

  /**
   * Obtiene estado del servicio
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      modelAvailable: this.modelAvailable,
      modelURL: this.modelConfig.modelURL,
      downloadProgress: this.downloadProgress
    };
  }

  /**
   * Actualiza URL del modelo
   */
  setModelURL(url) {
    if (this.isInitialized) {
      console.warn('⚠️ No se puede cambiar la URL con el modelo ya cargado');
      return false;
    }
    this.modelConfig.modelURL = url;
    return true;
  }
}

export default new YOLOService();

# 📝 Sistema de Corrección Automática

Sistema completo de corrección automática de evaluaciones mediante Computer Vision (OpenCV.js + YOLOv11n + Tesseract.js).

---

## 🎯 Arquitectura del Sistema

```
PDF → pdfService → visionService → ocrService + yoloService → correctionService → IndexedDB
        ↓              ↓               ↓           ↓                  ↓
    Imágenes     OpenCV Pipeline    RUT OCR   Detección      Mapeo + Scoring
                (Alineación +                  Marcas
                 Geometría)
```

---

## 📦 Servicios

### 1. **pdfService.js** - Conversión PDF a Imágenes
- Convierte PDF a imágenes usando pdf.js
- Escala 2x para buena calidad (192 DPI)
- Soporte para batch de 100+ páginas
- Callback de progreso

**Ubicación:** `src/core/vision/pdfService.js`

```javascript
import pdfService from '@/core/vision/pdfService';

const images = await pdfService.convertPDFToImages(file, (current, total) => {
  console.log(`${current}/${total} páginas`);
});
```

---

### 2. **visionService.js** - Pipeline OpenCV
- Detección de 3 marcadores QR (alineación)
- Corrección de perspectiva (warp)
- Detección de marcas laterales (filas)
- Cálculo de geometría del grid
- Extracción de ROIs (RUT + tablas)

**Ubicación:** `src/core/vision/visionService.js`

```javascript
import visionService from '@/core/vision/visionService';

const result = await visionService.processAnswerSheet(imageData);
// result.rois: { rut, tableLeft, tableRight }
// result.grids: { left: [...], right: [...] }
```

**Coordenadas a calibrar:**
- RUT ROI: `width * 0.05`, `height * 0.06`
- Tabla izquierda: `width * 0.05` a `width * 0.48`
- Tabla derecha: `width * 0.52` a `width * 0.95`

---

### 3. **ocrService.js** - Extracción de RUT
- Lazy loading de Tesseract.js
- Preprocesamiento optimizado para dígitos
- Validación de dígito verificador
- Fallback dígito por dígito (TODO)

**Ubicación:** `src/core/vision/ocrService.js`

```javascript
import ocrService from '@/core/vision/ocrService';

const result = await ocrService.extractRUT(rutImageBase64);
// result: { rut: "12.345.678-9", isValid: true, confidence: 0.92 }
```

**Configuración Tesseract:**
- Whitelist: `0123456789kK`
- PSM: `SINGLE_LINE` (línea única)
- Preprocesamiento: resize x3, binarización

---

### 4. **yoloService.js** - Detección de Marcas
- Descarga modelo desde URL remota
- ONNX Runtime Web para inferencia
- Detección en tablas completas (NO celdas individuales)
- NMS + threshold de confianza

**Ubicación:** `src/core/vision/yoloService.js`

**Configuración del modelo:**
```javascript
modelURL: '/models/yolo11n_marks_detection.onnx'
// O URL remota:
// modelURL: 'https://tu-servidor.com/yolo11n.onnx'

inputSize: 640x640
classes: ['mark_X', 'mark_circle', 'mark_line', 'mark_check']
confidenceThreshold: 0.5
iouThreshold: 0.4
```

**Uso:**
```javascript
import yoloService from '@/core/vision/yoloService';

// Verificar disponibilidad
const available = await yoloService.checkModelAvailability();

// Inicializar (descarga el modelo)
await yoloService.initialize((progress) => {
  console.log(`Descargando: ${progress}%`);
});

// Detectar marcas
const result = await yoloService.detect(tableImageBase64);
// result.detections: [{ class, bbox, confidence }]
```

**⚠️ IMPORTANTE:** El modelo debe estar disponible en:
- `/public/models/yolo11n_marks_detection.onnx` (local)
- O configurar URL remota con `yoloService.setModelURL(url)`

---

### 5. **correctionService.js** - Orquestador
- Coordina todo el pipeline
- Procesamiento en lotes (batch)
- Mapeo detecciones → respuestas
- Cálculo de puntaje y nota
- Identificación de estudiantes
- Guardado en IndexedDB

**Ubicación:** `src/features/correction/services/correctionService.js`

**Pipeline completo:**
```javascript
import correctionService from '@/features/correction/services/correctionService';

const result = await correctionService.processPDF(
  file,
  examId,
  {
    onProgress: (progress) => {
      console.log(progress.stage, progress.percentage);
    },
    concurrency: 4,
    autoIdentifyStudents: true
  }
);

// result:
// {
//   success: true,
//   totalPages: 100,
//   processedPages: 100,
//   identified: 85,
//   pending: 15,
//   errors: 2
// }
```

**Fases del pipeline:**
1. Convertir PDF a imágenes
2. Inicializar servicios (OpenCV, YOLO)
3. Procesar páginas en batch
4. Identificar estudiantes por RUT
5. Guardar resultados en IndexedDB

---

## 🔧 Configuración

### Instalar Dependencias
```bash
npm install onnxruntime-web tesseract.js pdfjs-dist
```

### Preparar Modelo YOLO
1. Entrenar YOLOv11n con tu dataset
2. Exportar a ONNX:
```python
from ultralytics import YOLO
model = YOLO('runs/detect/train/weights/best.pt')
model.export(format='onnx', imgsz=640)
```
3. Subir modelo a `/public/models/yolo11n_marks_detection.onnx`

### Calibrar Coordenadas
Ajustar en `visionService.js`:
- Marcadores QR: área entre 150-800 px²
- Marcas laterales: área entre 20-200 px²
- ROIs: coordenadas relativas (porcentajes de width/height)

---

## 📊 Schema de Resultados

```javascript
{
  id: 'uuid',
  examId: 'exam-id',
  studentId: 'student-id' | null,  // null si no identificado
  detectedRUT: '12.345.678-9',
  rutValid: true,
  rutConfidence: 0.92,
  answers: [
    {
      question: 1,
      selected: 'B',
      confidence: 0.95,
      markType: 'mark_X',
      multipleMarks: false
    }
  ],
  score: 24,
  percentage: 80,
  grade: 6.2,
  detections: [...],  // Detecciones YOLO crudas
  needsReview: false,
  reviewReasons: [],
  thumbnail: 'base64...',
  processingTime: 1650,
  correctedAt: Date
}
```

---

## 🚨 Casos que Requieren Revisión

El sistema marca `needsReview: true` en estos casos:

1. ❌ **Marcadores QR insuficientes** (< 3)
2. ❌ **RUT inválido** (dígito verificador incorrecto)
3. ❌ **RUT no encontrado** en base de datos
4. ❌ **Múltiples marcas** en una pregunta
5. ❌ **Baja confianza** (< 0.7) en detecciones YOLO
6. ❌ **Sin marcas laterales** detectadas
7. ❌ **Error en procesamiento**

---

## 📈 Performance Estimado

**Por hoja de respuesta:**
- PDF → Imagen: ~50ms
- OpenCV (alineación): ~200ms
- OpenCV (cortes): ~50ms
- YOLO tabla izq: ~300ms
- YOLO tabla der: ~300ms
- OCR RUT: ~800ms
- **Total: ~1.7s**

**100 hojas:**
- Secuencial: ~170s (2min 50s)
- Paralelo x4: ~45s
- Con caché: ~30s

---

## 🎛️ Parámetros Ajustables

### VisionService
```javascript
// Umbral para marcadores QR
area > 150 && area < 800

// Umbral para marcas laterales
area > 20 && area < 200

// Tolerancia en mapeo (píxeles)
const tolerance = 15;
```

### YOLOService
```javascript
confidenceThreshold: 0.5  // Umbral de confianza
iouThreshold: 0.4         // NMS threshold
inputSize: 640            // Tamaño de entrada
```

### OCRService
```javascript
tessedit_char_whitelist: '0123456789kK'
tessedit_pageseg_mode: PSM.SINGLE_LINE
```

### CorrectionService
```javascript
concurrency: 4  // Páginas en paralelo
```

---

## 🐛 Debugging

### Ver output OpenCV
```javascript
const result = await visionService.processAnswerSheet(imageData);
console.log('Marcadores QR:', result.metadata.markersFound);
console.log('Marcas laterales:', result.metadata.leftRowMarkers, result.metadata.rightRowMarkers);
```

### Visualizar detecciones YOLO
```javascript
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// Dibujar imagen
const img = new Image();
img.src = result.thumbnail;
img.onload = () => {
  ctx.drawImage(img, 0, 0);

  // Superponer bboxes
  result.detections.forEach(det => {
    ctx.strokeStyle = det.confidence > 0.9 ? 'green' : 'orange';
    ctx.strokeRect(det.bbox.x, det.bbox.y, det.bbox.width, det.bbox.height);
  });
};
```

### Medir tiempos
```javascript
console.time('opencv');
const visionResult = await visionService.processAnswerSheet(image);
console.timeEnd('opencv');

console.time('yolo');
const yoloResult = await yoloService.detect(table);
console.timeEnd('yolo');
```

---

## 📚 Referencias

- [OpenCV.js Docs](https://docs.opencv.org/4.x/d5/d10/tutorial_js_root.html)
- [Tesseract.js](https://tesseract.projectnaptha.com/)
- [ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/)
- [YOLOv11 Ultralytics](https://docs.ultralytics.com/)
- [pdf.js Mozilla](https://mozilla.github.io/pdf.js/)

---

## ✅ Checklist de Implementación

- [x] pdfService - Conversión PDF
- [x] visionService - Pipeline OpenCV
- [x] ocrService - Extracción RUT
- [x] yoloService - Detección marcas
- [x] correctionService - Orquestador
- [x] CorrectionPage UI - Interfaz usuario
- [x] Schema IndexedDB actualizado
- [ ] Calibración de coordenadas con imágenes reales
- [ ] Entrenamiento modelo YOLO
- [ ] Testing con dataset completo
- [ ] UI de revisión manual
- [ ] Exportación de resultados (CSV/Excel)

---

**Estado:** ✅ Base implementada, pendiente calibración y modelo YOLO

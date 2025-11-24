# 📚 REFERENCE.md - Guía de Referencia

> Comandos, debugging, optimizaciones y recursos útiles

---

## 🛠️ Comandos Esenciales

### Desarrollo

```bash
# Servidor desarrollo
npm run dev

# Build producción
npm run build

# Preview build
npm run preview

# Linting
npm run lint

# Formateo
npm run format

# Tests
npm run test

# Tests con coverage
npm run test:coverage
```

### Python (Training)

```bash
cd training

# Generar dataset
python scripts/prepare_dataset.py

# Entrenar modelo
python scripts/train.py

# Validar modelo
python scripts/validate.py

# Exportar ONNX
python scripts/export_onnx.py
```

---

## 🐛 Debugging

### IndexedDB

```javascript
// Chrome DevTools > Application > IndexedDB

// Limpiar DB
import db from './core/storage/db';
await db.delete();
await db.open();

// Ver todas las preguntas
const questions = await db.questions.toArray();
console.table(questions);

// Buscar por ID
const q = await db.questions.get('some-id');
console.log(q);
```

### Service Worker

```javascript
// Chrome DevTools > Application > Service Workers

// Desregistrar
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(r => r.unregister());
});

// Limpiar caché
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
```

### OpenCV

```javascript
// Verificar carga
if (window.cv) {
  console.log('OpenCV version:', cv.getBuildInformation());
} else {
  console.error('OpenCV no cargado');
}

// Visualizar Mat
function showMat(mat, canvasId) {
  const canvas = document.getElementById(canvasId);
  cv.imshow(canvas, mat);
}

// Liberar memoria
mat.delete(); // SIEMPRE llamar esto
```

### YOLO Inferencia

```javascript
// Medir tiempo
console.time('yolo-inference');
const results = await detector.detect(image);
console.timeEnd('yolo-inference');

// Verificar detecciones
console.log(`Detecciones: ${results.length}`);
results.forEach(d => {
  console.log(`${d.className}: ${(d.confidence * 100).toFixed(1)}%`);
});

// Visualizar en canvas
function drawDetections(canvas, detections) {
  const ctx = canvas.getContext('2d');
  detections.forEach(d => {
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.strokeRect(d.x, d.y, d.width, d.height);
    ctx.fillStyle = 'red';
    ctx.fillText(`${d.className} ${(d.confidence * 100).toFixed(0)}%`, 
                 d.x, d.y - 5);
  });
}
```

---

## ⚡ Optimizaciones

### 1. Web Workers para YOLO

```javascript
// inference.worker.js
import * as ort from 'onnxruntime-web';

let session = null;

self.onmessage = async (e) => {
  const { type, data } = e.data;
  
  if (type === 'init') {
    session = await ort.InferenceSession.create(data.modelPath);
    self.postMessage({ type: 'ready' });
  }
  
  if (type === 'detect') {
    const results = await session.run(data.input);
    self.postMessage({ type: 'results', data: results });
  }
};
```

### 2. Lazy Loading

```javascript
// Cargar OpenCV solo cuando se necesita
async function loadOpenCV() {
  if (window.cv) return;
  
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/opencv.js';
    script.onload = () => {
      cv.onRuntimeInitialized = resolve;
    };
    document.body.appendChild(script);
  });
}

// Usar solo en módulo de corrección
import { lazy } from 'react';
const CorrectionModule = lazy(() => import('./features/correction'));
```

### 3. Caching de Detecciones

```javascript
const detectionCache = new Map();

async function detectWithCache(imageHash, detector, image) {
  if (detectionCache.has(imageHash)) {
    return detectionCache.get(imageHash);
  }
  
  const results = await detector.detect(image);
  detectionCache.set(imageHash, results);
  
  // Limpiar caché viejo
  if (detectionCache.size > 100) {
    const firstKey = detectionCache.keys().next().value;
    detectionCache.delete(firstKey);
  }
  
  return results;
}
```

### 4. Batch Processing

```javascript
async function processMultipleSheets(files) {
  const batchSize = 3;
  const results = [];
  
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(file => correctAnswerSheet(file))
    );
    results.push(...batchResults);
  }
  
  return results;
}
```

---

## 🚨 Errores Comunes

### 1. CORS con ONNX

**Error**: `Failed to fetch model`

**Solución**:
- Asegurar modelo en `public/models/`
- Verificar ruta: `/models/yolov11n-marks.onnx`
- No usar rutas relativas

### 2. Memory Leaks OpenCV

**Error**: Memoria crece indefinidamente

**Solución**:
```javascript
// SIEMPRE llamar .delete()
const mat = new cv.Mat();
try {
  // usar mat
} finally {
  mat.delete(); // Liberar memoria
}
```

### 3. IndexedDB Quota

**Error**: `QuotaExceededError`

**Solución**:
```javascript
// Limpiar datos antiguos
async function cleanOldData() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  await db.results
    .where('date')
    .below(sixMonthsAgo)
    .delete();
}
```

### 4. PWA No Instala

**Error**: PWA no muestra prompt de instalación

**Solución**:
- Verificar HTTPS (o localhost)
- Verificar `manifest.json`
- Verificar Service Worker registrado
- Chrome DevTools > Application > Manifest

---

## 📖 Recursos Útiles

### Documentación Oficial

- [React Docs](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Dexie.js](https://dexie.org)
- [React Query](https://tanstack.com/query/latest)

### Computer Vision

- [OpenCV.js Docs](https://docs.opencv.org/4.x/d5/d10/tutorial_js_root.html)
- [Ultralytics YOLOv11](https://docs.ultralytics.com)
- [ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/)

### PDFs y Export

- [jsPDF Docs](https://github.com/parallax/jsPDF)
- [jsPDF AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable)
- [JSZip Docs](https://stuk.github.io/jszip/)

### PWA

- [Workbox](https://developers.google.com/web/tools/workbox)
- [PWA Guide](https://web.dev/progressive-web-apps/)

---

## 🧪 Testing

### Tests Unitarios

```javascript
// __tests__/questionsService.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import questionsService from '../services/questionsService';
import db from '../../../core/storage/db';

describe('questionsService', () => {
  beforeEach(async () => {
    await db.questions.clear();
  });

  it('should create question', async () => {
    const question = await questionsService.create({
      text: 'Test question',
      type: 'multiple',
      alternatives: [
        { id: 'a1', text: 'Answer 1', isCorrect: true },
        { id: 'a2', text: 'Answer 2', isCorrect: false }
      ]
    });

    expect(question).toBeDefined();
    expect(question.id).toBeDefined();
    expect(question.text).toBe('Test question');
  });

  it('should find all questions', async () => {
    await questionsService.create({ text: 'Q1', type: 'multiple' });
    await questionsService.create({ text: 'Q2', type: 'boolean' });

    const questions = await questionsService.findAll();
    expect(questions).toHaveLength(2);
  });
});
```

### Tests E2E

```javascript
// e2e/questions.spec.js
import { test, expect } from '@playwright/test';

test('create question flow', async ({ page }) => {
  await page.goto('http://localhost:5173');

  await page.click('button:has-text("Nueva Pregunta")');

  await page.fill('input[name="text"]', 'What is 2+2?');
  await page.selectOption('select[name="type"]', 'multiple');

  await page.click('button:has-text("Agregar Alternativa")');
  await page.fill('input[name="alternative-0"]', '4');
  await page.check('input[name="correct-0"]');

  await page.click('button:has-text("Guardar")');

  await expect(page.locator('text=What is 2+2?')).toBeVisible();
});
```

---

## 🎯 Performance Checklist

- [ ] Lazy load OpenCV y ONNX
- [ ] Web Worker para inferencia
- [ ] Caché de detecciones
- [ ] Batch processing de imágenes
- [ ] Service Worker configurado
- [ ] Assets optimizados (imágenes comprimidas)
- [ ] Code splitting por rutas
- [ ] IndexedDB limpieza automática
- [ ] Memory profiling sin leaks

---

## 🔐 Seguridad

### Validación de Inputs

```javascript
// Validar archivos
function validateFile(file) {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  
  if (file.size > maxSize) {
    throw new Error('Archivo muy grande');
  }
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Tipo de archivo no permitido');
  }
}

// Sanitizar texto
function sanitizeText(text) {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();
}
```

---

## 📊 Monitoreo

### Performance Metrics

```javascript
// Medir FCP, LCP, FID
import { onCLS, onFID, onLCP } from 'web-vitals';

onCLS(console.log);
onFID(console.log);
onLCP(console.log);

// Custom metrics
const performanceObserver = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    console.log(entry.name, entry.duration);
  });
});

performanceObserver.observe({ entryTypes: ['measure'] });

performance.mark('start-detection');
// ... detección
performance.mark('end-detection');
performance.measure('detection-time', 'start-detection', 'end-detection');
```

---

**Para más detalles, consultar README.md y documentación por fase (SETUP, EXAMS, VISION)**

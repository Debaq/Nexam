# 🤖 VISION.md - Semana 3: Corrección Automática con IA

> Guía detallada para implementar el sistema de Computer Vision

---

## 🎯 Objetivos de la Semana 3

- ✅ Dataset anotado (1500+ imágenes)
- ✅ YOLOv11n fine-tuned (mAP50 > 0.90)
- ✅ Pipeline OpenCV (alineación)
- ✅ Detección de marcas con YOLO
- ✅ Sistema de corrección completo

---

## 📅 Día 1-2: Preparación de Dataset

### Tarea 8.1: Generar Dataset Sintético

**training/scripts/prepare_dataset.py**:

```python
import cv2
import numpy as np
from pathlib import Path
import random

OUTPUT_DIR = Path('training/dataset')
IMAGES_DIR = OUTPUT_DIR / 'images'
LABELS_DIR = OUTPUT_DIR / 'labels'
NUM_SHEETS = 1500

IMAGES_DIR.mkdir(parents=True, exist_ok=True)
LABELS_DIR.mkdir(parents=True, exist_ok=True)

def generate_answer_sheet(num_questions=40, num_alternatives=5):
    img = np.ones((1120, 800, 3), dtype=np.uint8) * 255
    
    margin = 50
    header_height = 150
    cell_size = 30
    cell_spacing = 10
    
    annotations = []
    
    # Marcas de esquina
    corner_radius = 10
    corners = [
        (margin, margin),
        (800 - margin, margin),
        (margin, 1120 - margin),
        (800 - margin, 1120 - margin)
    ]
    
    for x, y in corners:
        cv2.circle(img, (x, y), corner_radius, (0, 0, 0), -1)
    
    # Grid de respuestas
    start_y = header_height
    
    for i in range(num_questions):
        y = start_y + i * (cell_size + cell_spacing)
        
        cv2.putText(img, str(i + 1), (margin, y + 20), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
        
        for j in range(num_alternatives):
            x = margin + 40 + j * (cell_size + cell_spacing)
            
            cv2.circle(img, (x + cell_size//2, y + cell_size//2), 
                      cell_size//2 - 2, (0, 0, 0), 1)
            
            should_mark = random.random() < 0.25
            
            if should_mark:
                mark_type = random.choice(['circle', 'x', 'line'])
                mark_cell(img, x, y, cell_size, mark_type)
                
                class_id = get_class_id(mark_type)
                annotation = create_yolo_annotation(
                    class_id, x, y, cell_size, 800, 1120
                )
                annotations.append(annotation)
    
    return img, annotations

def mark_cell(img, x, y, size, mark_type):
    center_x = x + size // 2
    center_y = y + size // 2
    
    if mark_type == 'circle':
        cv2.circle(img, (center_x, center_y), size//2 - 4, (0, 0, 0), -1)
    elif mark_type == 'x':
        offset = size // 4
        cv2.line(img, (center_x - offset, center_y - offset),
                (center_x + offset, center_y + offset), (0, 0, 0), 2)
        cv2.line(img, (center_x + offset, center_y - offset),
                (center_x - offset, center_y + offset), (0, 0, 0), 2)
    elif mark_type == 'line':
        offset = size // 3
        cv2.line(img, (center_x - offset, center_y),
                (center_x + offset, center_y), (0, 0, 0), 2)

def get_class_id(mark_type):
    return {'circle': 0, 'x': 1, 'line': 2}[mark_type]

def create_yolo_annotation(class_id, x, y, size, img_width, img_height):
    x_center = (x + size / 2) / img_width
    y_center = (y + size / 2) / img_height
    width = size / img_width
    height = size / img_height
    
    return f"{class_id} {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}"

def apply_augmentation(img):
    # Rotación
    angle = random.uniform(-5, 5)
    h, w = img.shape[:2]
    M = cv2.getRotationMatrix2D((w/2, h/2), angle, 1)
    img = cv2.warpAffine(img, M, (w, h), borderValue=(255, 255, 255))
    
    # Ruido
    noise = np.random.normal(0, random.uniform(5, 15), img.shape)
    img = np.clip(img + noise, 0, 255).astype(np.uint8)
    
    # Brillo
    brightness = random.uniform(0.8, 1.2)
    img = np.clip(img * brightness, 0, 255).astype(np.uint8)
    
    # Blur
    if random.random() < 0.3:
        img = cv2.GaussianBlur(img, (3, 3), 0)
    
    return img

# Generar dataset
print(f"Generando {NUM_SHEETS} hojas...")

for i in range(NUM_SHEETS):
    img, annotations = generate_answer_sheet()
    img = apply_augmentation(img)
    
    img_path = IMAGES_DIR / f'sheet_{i:04d}.jpg'
    cv2.imwrite(str(img_path), img)
    
    label_path = LABELS_DIR / f'sheet_{i:04d}.txt'
    with open(label_path, 'w') as f:
        f.write('\n'.join(annotations))
    
    if (i + 1) % 100 == 0:
        print(f"Generadas {i + 1}/{NUM_SHEETS}")

print("Dataset generado!")

# data.yaml
import yaml
data_yaml = {
    'path': str(OUTPUT_DIR.absolute()),
    'train': 'images',
    'val': 'images',
    'nc': 3,
    'names': ['filled_circle', 'filled_x', 'filled_line']
}

with open(OUTPUT_DIR / 'data.yaml', 'w') as f:
    yaml.dump(data_yaml, f)

print("data.yaml creado")
```

---

## 📅 Día 3-4: Entrenamiento del Modelo

### Tarea 9.1: Entrenar YOLOv11n

**training/scripts/train.py**:

```python
from ultralytics import YOLO
import torch

print(f"CUDA: {torch.cuda.is_available()}")

model = YOLO('yolov11n.pt')

results = model.train(
    data='training/dataset/data.yaml',
    epochs=100,
    imgsz=640,
    batch=16,
    patience=20,
    save=True,
    project='nexam-training',
    name='yolov11n-marks',
    
    lr0=0.01,
    lrf=0.01,
    momentum=0.937,
    weight_decay=0.0005,
    
    hsv_h=0.015,
    hsv_s=0.7,
    hsv_v=0.4,
    degrees=5.0,
    translate=0.1,
    scale=0.5,
    
    verbose=True,
    plots=True
)

metrics = model.val()
print(f"\nmAP50: {metrics.maps['mAP50']:.4f}")
print(f"mAP50-95: {metrics.maps['mAP50-95']:.4f}")
```

### Tarea 9.2: Exportar a ONNX

**training/scripts/export_onnx.py**:

```python
from ultralytics import YOLO
import shutil
from pathlib import Path

model = YOLO('nexam-training/yolov11n-marks/weights/best.pt')

model.export(
    format='onnx',
    opset=12,
    simplify=True,
    dynamic=False,
    imgsz=640
)

src = Path('nexam-training/yolov11n-marks/weights/best.onnx')
dst = Path('public/models/yolov11n-marks.onnx')
dst.parent.mkdir(parents=True, exist_ok=True)
shutil.copy(src, dst)

print(f"Modelo exportado a: {dst}")
```

---

## 📅 Día 5-6: Pipeline de Corrección

### Tarea 10.1: OpenCV Wrapper

**src/core/vision/opencv.js**:

```javascript
let cv = null;

export async function initializeOpenCV() {
  if (cv) return cv;
  
  return new Promise((resolve) => {
    if (window.cv) {
      cv = window.cv;
      resolve(cv);
    } else {
      window.onOpenCVReady = () => {
        cv = window.cv;
        resolve(cv);
      };
    }
  });
}

export function preprocessImage(imageMat) {
  const gray = new cv.Mat();
  cv.cvtColor(imageMat, gray, cv.COLOR_RGBA2GRAY);
  
  const blurred = new cv.Mat();
  cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
  
  const binary = new cv.Mat();
  cv.adaptiveThreshold(
    blurred,
    binary,
    255,
    cv.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv.THRESH_BINARY,
    11,
    2
  );
  
  gray.delete();
  blurred.delete();
  
  return binary;
}

export function detectCircles(imageMat, minRadius = 10, maxRadius = 30) {
  const circles = new cv.Mat();
  
  cv.HoughCircles(
    imageMat,
    circles,
    cv.HOUGH_GRADIENT,
    1,
    50,
    100,
    30,
    minRadius,
    maxRadius
  );
  
  const detected = [];
  for (let i = 0; i < circles.cols; i++) {
    detected.push({
      x: circles.data32F[i * 3],
      y: circles.data32F[i * 3 + 1],
      radius: circles.data32F[i * 3 + 2]
    });
  }
  
  circles.delete();
  return detected;
}

export function alignImage(imageMat) {
  const circles = detectCircles(imageMat);
  
  if (circles.length < 4) {
    throw new Error('No se detectaron 4 marcas de esquina');
  }
  
  const sortedByRadius = circles.sort((a, b) => b.radius - a.radius);
  const cornerMarks = sortedByRadius.slice(0, 4);
  
  // Ordenar puntos: TL, TR, BR, BL
  const sorted = cornerMarks.sort((a, b) => (a.x + a.y) - (b.x + b.y));
  const orderedPoints = [
    sorted[0],
    sorted[3],
    sorted[2],
    sorted[1]
  ];
  
  const width = 800;
  const height = 1120;
  
  const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, 
    orderedPoints.flatMap(p => [p.x, p.y])
  );
  
  const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0, 0,
    width, 0,
    width, height,
    0, height
  ]);
  
  const transformMatrix = cv.getPerspectiveTransform(srcPoints, dstPoints);
  
  const aligned = new cv.Mat();
  cv.warpPerspective(
    imageMat,
    aligned,
    transformMatrix,
    new cv.Size(width, height)
  );
  
  srcPoints.delete();
  dstPoints.delete();
  transformMatrix.delete();
  
  return aligned;
}

export default {
  initializeOpenCV,
  preprocessImage,
  detectCircles,
  alignImage
};
```

### Tarea 10.2: YOLO Detector

**src/core/vision/yolo.js**:

```javascript
import * as ort from 'onnxruntime-web';

export class MarkDetector {
  constructor(modelPath) {
    this.session = null;
    this.modelPath = modelPath;
    this.inputSize = 640;
  }
  
  async initialize() {
    this.session = await ort.InferenceSession.create(this.modelPath);
  }
  
  async detect(imageData) {
    const tensor = await this.preprocessForYOLO(imageData);
    const feeds = { images: tensor };
    const results = await this.session.run(feeds);
    const detections = this.postprocess(results.output0);
    return detections;
  }
  
  async preprocessForYOLO(imageData) {
    const canvas = document.createElement('canvas');
    canvas.width = this.inputSize;
    canvas.height = this.inputSize;
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(imageData, 0, 0, this.inputSize, this.inputSize);
    
    const imageDataRGBA = ctx.getImageData(0, 0, this.inputSize, this.inputSize);
    const pixels = imageDataRGBA.data;
    
    const float32Data = new Float32Array(3 * this.inputSize * this.inputSize);
    
    for (let i = 0; i < this.inputSize * this.inputSize; i++) {
      float32Data[i] = pixels[i * 4] / 255.0;
      float32Data[this.inputSize * this.inputSize + i] = pixels[i * 4 + 1] / 255.0;
      float32Data[2 * this.inputSize * this.inputSize + i] = pixels[i * 4 + 2] / 255.0;
    }
    
    return new ort.Tensor('float32', float32Data, [1, 3, this.inputSize, this.inputSize]);
  }
  
  postprocess(output) {
    const data = output.data;
    const shape = output.dims;
    
    const numDetections = shape[2];
    const detections = [];
    const confThreshold = 0.5;
    
    for (let i = 0; i < numDetections; i++) {
      const x = data[i];
      const y = data[numDetections + i];
      const w = data[2 * numDetections + i];
      const h = data[3 * numDetections + i];
      const conf = data[4 * numDetections + i];
      
      if (conf < confThreshold) continue;
      
      let maxProb = 0;
      let classId = 0;
      
      for (let j = 5; j < shape[1]; j++) {
        const prob = data[j * numDetections + i];
        if (prob > maxProb) {
          maxProb = prob;
          classId = j - 5;
        }
      }
      
      detections.push({
        x: x - w / 2,
        y: y - h / 2,
        width: w,
        height: h,
        confidence: conf * maxProb,
        class: classId,
        className: this.getClassName(classId)
      });
    }
    
    return this.nonMaxSuppression(detections);
  }
  
  nonMaxSuppression(detections, iouThreshold = 0.45) {
    detections.sort((a, b) => b.confidence - a.confidence);
    
    const keep = [];
    
    while (detections.length > 0) {
      const current = detections.shift();
      keep.push(current);
      
      detections = detections.filter(det => {
        const iou = this.calculateIoU(current, det);
        return iou < iouThreshold;
      });
    }
    
    return keep;
  }
  
  calculateIoU(det1, det2) {
    const x1 = Math.max(det1.x, det2.x);
    const y1 = Math.max(det1.y, det2.y);
    const x2 = Math.min(det1.x + det1.width, det2.x + det2.width);
    const y2 = Math.min(det1.y + det1.height, det2.y + det2.height);
    
    const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    const area1 = det1.width * det1.height;
    const area2 = det2.width * det2.height;
    const union = area1 + area2 - intersection;
    
    return intersection / union;
  }
  
  getClassName(classId) {
    const classes = ['filled_circle', 'filled_x', 'filled_line'];
    return classes[classId] || 'unknown';
  }
}

export default MarkDetector;
```

---

## ✅ Checklist Semana 3

- [ ] Dataset 1500+ imágenes
- [ ] Modelo entrenado
- [ ] mAP50 > 0.90
- [ ] ONNX exportado
- [ ] OpenCV pipeline
- [ ] YOLO integrado
- [ ] Corrección automática

---

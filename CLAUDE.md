# 🤖 CLAUDE.md - Nexam Development Guide

> Guía principal para desarrollo con Claude Code del Sistema Inteligente de Evaluación Educativa

---

## 📋 Información del Proyecto

**Nombre**: Nexam  
**Tipo**: Progressive Web Application (PWA)  
**Duración**: 3 semanas  
**Stack**: React + Vite + Tailwind CSS + shadcn/ui + OpenCV.js + YOLOv11n  

### Contexto

Sistema completo para gestión y corrección automática de evaluaciones educativas mediante Computer Vision.

---

## 🎯 Principios Fundamentales

### Arquitectura Modular por Features

```
src/features/
├── questions/      # Banco de preguntas
├── exams/         # Generación de evaluaciones
├── correction/    # Corrección automática IA
├── students/      # Gestión de estudiantes
└── analytics/     # Análisis y reportes
```

**REGLA CRÍTICA**: Cada feature tiene:
- `components/` - Componentes React
- `hooks/` - Custom hooks
- `services/` - Lógica de negocio
- `types/` - TypeScript definitions
- `styles/` - CSS separado

### Separación Estricta

**NO CREAR** archivos bundle tipo `app.js`

✅ `questionsService.js`, `examService.js`, `correctionService.js`  
❌ `app.js` con todo mezclado

### Internacionalización

- JSON separados en `src/locales/es/`
- No hardcodear textos
- i18n desde inicio

---

## 📦 Fases del Proyecto

### Semana 1: Fundamentos y Arquitectura
📄 **Ver detalles**: `docs/SETUP.md`

**Objetivos**:
- ✅ Setup Vite + React + Tailwind + shadcn/ui
- ✅ IndexedDB con Dexie.js
- ✅ CRUD completo de preguntas
- ✅ Import/Export GIFT y ZIP
- ✅ PWA instalable offline-first

**Entregables**:
- Proyecto base configurado
- Módulo de preguntas funcional
- Sistema de almacenamiento local

---

### Semana 2: Generación de Evaluaciones
📄 **Ver detalles**: `docs/EXAMS.md`

**Objetivos**:
- ✅ Builder de exámenes con configuración
- ✅ PDFs (pruebas + hojas respuesta)
- ✅ Sistema de códigos únicos (4 letras)
- ✅ CRUD estudiantes con validación RUT
- ✅ Aleatorización de preguntas/alternativas

**Entregables**:
- Generador de evaluaciones completo
- Sistema de gestión de estudiantes
- PDFs listos para imprimir

---

### Semana 3: Corrección Automática con IA
📄 **Ver detalles**: `docs/VISION.md`

**Objetivos**:
- ✅ Dataset anotado (1500+ imágenes)
- ✅ YOLOv11n fine-tuned (mAP50 > 0.90)
- ✅ Pipeline OpenCV (alineación)
- ✅ Detección de marcas con YOLO
- ✅ Sistema de corrección completo

**Entregables**:
- Modelo entrenado y exportado a ONNX
- Pipeline de Computer Vision
- Corrección automática funcional

---

## 🚀 Quick Start

### Instalación

```bash
# Clonar e instalar
git clone https://github.com/tu-usuario/nexam.git
cd nexam
npm install

# Desarrollo
npm run dev
```

### Dependencias Principales

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "dexie": "^3.2.4",
    "dexie-react-hooks": "^1.1.7",
    "jszip": "^3.10.1",
    "jspdf": "^2.5.1",
    "onnxruntime-web": "^1.16.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0"
  }
}
```

### Estructura Base

```
nexam/
├── src/
│   ├── features/          # Módulos por feature
│   ├── shared/           # Componentes compartidos
│   ├── core/             # Storage, vision, export
│   ├── locales/          # i18n
│   └── styles/           # CSS global
├── public/
│   └── models/           # Modelos ONNX
├── training/             # Scripts Python
│   ├── dataset/
│   └── scripts/
└── docs/                 # Documentación detallada
    ├── SETUP.md
    ├── EXAMS.md
    ├── VISION.md
    └── REFERENCE.md
```

---

## 📚 Stack Tecnológico

### Frontend

| Tecnología | Propósito |
|-----------|-----------|
| React 18.3+ | Framework UI |
| Vite 5.0+ | Build tool |
| Tailwind CSS 3.4+ | Styling |
| shadcn/ui | Componentes |

### Storage

| Tecnología | Propósito |
|-----------|-----------|
| IndexedDB | Storage local |
| Dexie.js | Wrapper IndexedDB |
| React Query | Estado servidor |

### Computer Vision

| Tecnología | Propósito |
|-----------|-----------|
| YOLOv11n | Detección marcas |
| ONNX Runtime Web | Inferencia navegador |
| OpenCV.js | Preprocesamiento |

### Export/Import

| Tecnología | Propósito |
|-----------|-----------|
| JSZip | Manejo ZIP |
| jsPDF | Generación PDF |
| GIFT Parser | Formato Moodle |

---

## 🛠️ Comandos Esenciales

```bash
# Desarrollo
npm run dev              # Servidor desarrollo
npm run build           # Build producción
npm run preview         # Preview build

# Calidad
npm run lint            # Linting
npm run test            # Tests

# Training (Python)
cd training
python scripts/prepare_dataset.py    # Generar dataset
python scripts/train.py              # Entrenar modelo
python scripts/export_onnx.py        # Exportar ONNX
```

---

## 📖 Documentación Detallada

### Para cada fase, consulta:

1. **`docs/SETUP.md`** - Semana 1
   - Setup completo paso a paso
   - Configuración IndexedDB
   - Implementación CRUD preguntas
   - Import/Export GIFT y ZIP
   - Configuración PWA

2. **`docs/EXAMS.md`** - Semana 2
   - Servicio de exámenes
   - Generación de PDFs
   - Sistema de códigos únicos
   - Gestión de estudiantes
   - Validación RUT chileno

3. **`docs/VISION.md`** - Semana 3
   - Creación de dataset
   - Fine-tuning YOLOv11n
   - Pipeline OpenCV
   - Detección con YOLO
   - Sistema de corrección

4. **`docs/REFERENCE.md`**
   - Debugging tips
   - Optimizaciones
   - Errores comunes
   - Referencias útiles

---

## ⚡ Flujo de Trabajo Recomendado

### Desarrollo Secuencial por Semana

```
Semana 1: Base Sólida
┌─────────────────────────────────────┐
│ 1. Setup proyecto                   │
│ 2. IndexedDB + schemas              │
│ 3. Servicio de preguntas            │
│ 4. Componentes UI                   │
│ 5. Import/Export                    │
│ 6. PWA setup                        │
└─────────────────────────────────────┘
         │
         ▼
Semana 2: Evaluaciones
┌─────────────────────────────────────┐
│ 1. Servicio de exámenes             │
│ 2. Generador de PDFs                │
│ 3. Sistema de códigos               │
│ 4. CRUD estudiantes                 │
│ 5. Integración completa             │
└─────────────────────────────────────┘
         │
         ▼
Semana 3: IA y Corrección
┌─────────────────────────────────────┐
│ 1. Generar dataset sintético        │
│ 2. Entrenar YOLOv11n                │
│ 3. Exportar a ONNX                  │
│ 4. Pipeline OpenCV                  │
│ 5. Integración YOLO                 │
│ 6. Sistema corrección               │
│ 7. UI de corrección                 │
└─────────────────────────────────────┘
```

---

## 🎯 Schemas Principales

### Question Schema

```typescript
interface Question {
  id: string;
  text: string;
  type: 'multiple' | 'boolean' | 'development';
  alternatives: Alternative[];
  category: string;
  tags: string[];
  difficulty: {
    manual: 'easy' | 'medium' | 'hard';
    automatic: number; // 0-1
  };
  feedback: {
    general: string;
    byAlternative: Map<string, string>;
  };
  statistics: {
    timesUsed: number;
    averageScore: number;
  };
  image?: { data: Blob; alt: string };
}
```

### Exam Schema

```typescript
interface Exam {
  id: string;
  title: string;
  date: Date;
  questions: string[]; // IDs
  type: 'uniform' | 'differentiated';
  randomization: {
    shuffleQuestions: boolean;
    shuffleAlternatives: boolean;
  };
  students: string[]; // IDs
  codes: Map<string, string>; // studentId -> code
}
```

---

## 🔍 Pipeline de Corrección

```
┌─────────────┐
│ Imagen      │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────┐
│ 1. Preprocesamiento (OpenCV)│
│    - Grayscale               │
│    - Noise reduction         │
│    - Binarization            │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ 2. Alineación               │
│    - Detectar marcas esquina│
│    - Warp perspective        │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ 3. Detección (YOLOv11n)     │
│    - Inferencia ONNX         │
│    - Detectar marcas         │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ 4. Validación               │
│    - Extraer respuestas      │
│    - Matching gabarito       │
│    - Calcular puntaje        │
└──────┬───────────────────────┘
       │
       ▼
┌─────────────┐
│ Resultados  │
└─────────────┘
```

---

## 🐛 Debugging Quick Tips

### IndexedDB
```javascript
// Chrome DevTools > Application > IndexedDB
// Ver datos en tiempo real
```

### OpenCV
```javascript
// Verificar carga
if (window.cv) {
  console.log('OpenCV loaded');
}
```

### YOLO
```javascript
// Medir tiempo de inferencia
console.time('yolo-inference');
const results = await detector.detect(image);
console.timeEnd('yolo-inference');
```

---

## ✅ Checklist por Semana

### Semana 1
- [ ] Proyecto inicializado
- [ ] Tailwind + shadcn/ui configurados
- [ ] IndexedDB funcionando
- [ ] CRUD preguntas completo
- [ ] Import/Export GIFT
- [ ] Import/Export ZIP
- [ ] PWA instalable

### Semana 2
- [ ] Builder de exámenes
- [ ] PDFs de pruebas
- [ ] PDFs de hojas respuesta
- [ ] Códigos únicos generados
- [ ] CRUD estudiantes
- [ ] Validación RUT
- [ ] Aleatorización funcional

### Semana 3
- [ ] Dataset 1500+ imágenes
- [ ] Modelo entrenado
- [ ] mAP50 > 0.90
- [ ] ONNX exportado
- [ ] OpenCV pipeline
- [ ] YOLO integrado
- [ ] Corrección automática
- [ ] UI corrección

---

## 🚨 Reglas Críticas

1. **Arquitectura modular** - Un archivo por responsabilidad
2. **Separación CSS/JS** - No mezclar estilos en componentes
3. **i18n obligatorio** - Textos en JSON desde día 1
4. **Memory management** - Liberar Mats de OpenCV con `.delete()`
5. **Error handling** - Try-catch en todas las operaciones async
6. **Type safety** - Usar TypeScript donde sea posible

---

## 📞 Soporte

- **Issues**: Documentar en GitHub Issues
- **Docs completas**: Ver carpeta `docs/`
- **Referencias**: Ver `docs/REFERENCE.md`

---

## 🎓 Recursos Útiles

- [React Docs](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Dexie.js](https://dexie.org)
- [OpenCV.js](https://docs.opencv.org/4.x/d5/d10/tutorial_js_root.html)
- [Ultralytics YOLOv11](https://docs.ultralytics.com)
- [ONNX Runtime](https://onnxruntime.ai/docs/tutorials/web/)

---

**Documentación detallada por fase en carpeta `docs/`**

¡Éxito con el desarrollo! 🚀
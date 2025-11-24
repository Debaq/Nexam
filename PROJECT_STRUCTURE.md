# Estructura del Proyecto Nexam

```
nexam/
├── 📄 README.md                      # Documentación principal
├── 📄 CLAUDE.md                      # Guía para desarrollo con Claude Code
├── 📄 PROJECT_STRUCTURE.md           # Este archivo
│
├── 📦 Configuration Files
│   ├── package.json                  # Dependencias del proyecto
│   ├── vite.config.js               # Configuración Vite + PWA
│   ├── tailwind.config.js           # Configuración Tailwind CSS
│   ├── postcss.config.js            # PostCSS para Tailwind
│   ├── eslint.config.js             # Linting
│   ├── jsconfig.json                # Alias de paths (@/)
│   ├── .gitignore                   # Archivos ignorados por Git
│   └── index.html                   # HTML principal
│
├── 📁 src/                          # Código fuente
│   ├── 📄 main.jsx                  # Entry point React
│   ├── 📄 App.jsx                   # Componente principal
│   │
│   ├── 📁 features/                 # Módulos por funcionalidad
│   │   ├── 📁 questions/            # Banco de preguntas
│   │   │   ├── components/          # Componentes UI
│   │   │   ├── hooks/               # Custom hooks
│   │   │   ├── services/            # Lógica de negocio (CRUD)
│   │   │   ├── types/               # TypeScript definitions
│   │   │   ├── styles/              # CSS del módulo
│   │   │   └── README.md
│   │   │
│   │   ├── 📁 exams/                # Generación de evaluaciones
│   │   │   ├── components/          # Builder, configuración
│   │   │   ├── hooks/               # Aleatorización
│   │   │   ├── services/            # PDFs, códigos únicos
│   │   │   ├── types/               # Exam types
│   │   │   ├── styles/
│   │   │   └── README.md
│   │   │
│   │   ├── 📁 correction/           # Corrección automática IA
│   │   │   ├── components/          # UI corrección
│   │   │   ├── hooks/               # Pipeline CV
│   │   │   ├── services/            # OpenCV, YOLO
│   │   │   ├── types/               # Result types
│   │   │   ├── styles/
│   │   │   └── README.md
│   │   │
│   │   ├── 📁 students/             # Gestión de estudiantes
│   │   │   ├── components/          # Formularios
│   │   │   ├── hooks/               # Validación RUT
│   │   │   ├── services/            # CRUD estudiantes
│   │   │   ├── types/               # Student types
│   │   │   ├── styles/
│   │   │   └── README.md
│   │   │
│   │   └── 📁 analytics/            # Análisis y reportes
│   │       ├── components/          # Gráficos, dashboards
│   │       ├── hooks/               # Estadísticas
│   │       ├── services/            # Reportes
│   │       ├── types/
│   │       ├── styles/
│   │       └── README.md
│   │
│   ├── 📁 shared/                   # Código compartido
│   │   ├── components/              # Componentes reutilizables
│   │   ├── hooks/                   # Hooks compartidos
│   │   ├── utils/                   # Utilidades generales
│   │   └── README.md
│   │
│   ├── 📁 core/                     # Funcionalidades core
│   │   ├── storage/                 # IndexedDB + Dexie
│   │   │   ├── db.js                # Configuración DB
│   │   │   └── schemas.js           # Schemas de datos
│   │   │
│   │   ├── vision/                  # Computer Vision
│   │   │   ├── opencv.js            # Pipeline OpenCV
│   │   │   └── yolo.js              # Detección YOLO
│   │   │
│   │   ├── export/                  # Export/Import
│   │   │   ├── giftParser.js        # Parser GIFT
│   │   │   ├── zipExporter.js       # Export ZIP
│   │   │   └── pdfGenerator.js      # Generación PDF
│   │   │
│   │   └── README.md
│   │
│   ├── 📁 locales/                  # Internacionalización
│   │   └── es/
│   │       └── common.json          # Traducciones español
│   │
│   └── 📁 styles/                   # CSS global
│       └── index.css                # Tailwind base + variables
│
├── 📁 public/                       # Archivos estáticos
│   ├── models/                      # Modelos ONNX
│   │   └── .gitkeep
│   ├── vite.svg
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   └── manifest.json
│
├── 📁 training/                     # Entrenamiento YOLO
│   ├── 📁 dataset/                  # Dataset para YOLO
│   │   ├── images/
│   │   │   ├── train/
│   │   │   ├── val/
│   │   │   └── test/
│   │   └── labels/
│   │       ├── train/
│   │       ├── val/
│   │       └── test/
│   │
│   ├── 📁 scripts/                  # Scripts Python
│   │   ├── prepare_dataset.py       # Generar dataset sintético
│   │   ├── train.py                 # Entrenar YOLOv11n
│   │   ├── export_onnx.py           # Exportar a ONNX
│   │   └── validate.py              # Validar modelo
│   │
│   ├── 📁 runs/                     # Resultados entrenamientos
│   └── README.md
│
└── 📁 docs/                         # Documentación detallada
    ├── SETUP.md                     # Semana 1: Setup y preguntas
    ├── EXAMS.md                     # Semana 2: Evaluaciones
    ├── VISION.md                    # Semana 3: Computer Vision
    └── REFERENCE.md                 # Referencias y debugging
```

## 📌 Convenciones

### Nomenclatura de archivos
- Componentes: `PascalCase.jsx` (ej: `QuestionForm.jsx`)
- Servicios: `camelCase.js` (ej: `questionsService.js`)
- Hooks: `camelCase.js` con prefijo `use` (ej: `useQuestions.js`)
- Estilos: `kebab-case.css` (ej: `question-form.css`)
- Types: `index.ts` o `types.ts`

### Estructura de un feature
Cada feature sigue la misma estructura:
```
feature-name/
├── components/        # UI específica del feature
├── hooks/            # Lógica React
├── services/         # Lógica de negocio
├── types/            # TypeScript definitions
├── styles/           # CSS del módulo
└── README.md         # Documentación del feature
```

### Imports con alias
Usar `@/` para imports desde `src/`:
```javascript
import { db } from '@/core/storage/db';
import { Button } from '@/shared/components/Button';
import { useQuestions } from '@/features/questions/hooks/useQuestions';
```

## 🎯 Principios de Arquitectura

### 1. Separación por Features
Cada módulo (feature) es independiente y autocontenido.

### 2. Un archivo, una responsabilidad
- `questionsService.js` - solo CRUD de preguntas
- `examService.js` - solo generación de exámenes
- NO crear `app.js` con todo mezclado

### 3. Código compartido en shared/
Solo código que usan MÚLTIPLES features.

### 4. Core para funcionalidad base
Storage, Vision, Export son core del sistema.

### 5. Estilos separados
No mezclar CSS en JSX. Usar archivos `.css` separados o Tailwind.

## 🔄 Flujo de Datos

```
User Interface (Components)
        ↓
Custom Hooks (hooks/)
        ↓
Services (services/)
        ↓
Core Modules (storage/vision/export)
        ↓
External APIs (IndexedDB/ONNX/OpenCV)
```

## 📚 Dependencias Clave

### Producción
- `react` + `react-dom` - Framework UI
- `dexie` + `dexie-react-hooks` - IndexedDB
- `jszip` + `jspdf` + `file-saver` - Export/Import
- `lucide-react` - Iconos
- `tailwindcss` - Estilos

### Desarrollo
- `vite` - Build tool
- `vite-plugin-pwa` - PWA
- `eslint` - Linting
- `tailwindcss-animate` - Animaciones

### Python (Training)
- `ultralytics` - YOLOv11
- `opencv-python` - Procesamiento
- `numpy` - Operaciones
- `pillow` - Imágenes

## 🚀 Comandos Principales

```bash
# Desarrollo
npm run dev              # Servidor desarrollo
npm run build           # Build producción
npm run preview         # Preview build
npm run lint            # Linting

# Training (desde training/)
python scripts/prepare_dataset.py
python scripts/train.py
python scripts/export_onnx.py
```

## 📖 Documentación por Fase

1. **Semana 1** → `docs/SETUP.md`
   - Setup proyecto
   - IndexedDB
   - CRUD preguntas
   - Import/Export
   - PWA

2. **Semana 2** → `docs/EXAMS.md`
   - Generación exámenes
   - PDFs
   - Códigos únicos
   - Gestión estudiantes

3. **Semana 3** → `docs/VISION.md`
   - Dataset YOLO
   - Entrenamiento
   - Pipeline OpenCV
   - Corrección automática

4. **Referencia** → `docs/REFERENCE.md`
   - Debugging
   - Troubleshooting
   - Optimizaciones

---

**Para comenzar el desarrollo, ver `docs/SETUP.md`**

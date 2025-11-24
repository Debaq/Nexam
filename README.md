# 🤖 Guía de Desarrollo para Claude Code - Nexam

> Instrucciones detalladas para desarrollo asistido por IA del Sistema Inteligente de Evaluación Educativa

---

## 📋 Información del Proyecto

**Nombre**: Nexam  
**Tipo**: Progressive Web Application (PWA)  
**Duración**: 3 semanas  
**Stack**: React + Vite + Tailwind CSS + shadcn/ui + OpenCV.js + YOLOv11n  

### Contexto

Nexam es un sistema completo para gestión y corrección automática de evaluaciones educativas mediante Computer Vision. El proyecto se divide en 3 fases principales que deben completarse en orden secuencial.

---

## 🎯 Principios de Desarrollo

### Arquitectura Modular por Features

```
src/features/
├── questions/      # Banco de preguntas
├── exams/         # Generación de evaluaciones
├── correction/    # Corrección automática IA
├── students/      # Gestión de estudiantes
└── analytics/     # Análisis y reportes
```

**REGLA CRÍTICA**: Cada feature debe tener:
- `components/` - Componentes React específicos
- `hooks/` - Custom hooks
- `services/` - Lógica de negocio
- `types/` - TypeScript definitions
- `styles/` - CSS específico (separado)

### Separación Estricta de Archivos

**NO CREAR archivos bundle tipo `app.js`**

Cada módulo debe estar en su propio archivo:
- ✅ `questionsService.js`
- ✅ `examService.js`
- ✅ `correctionService.js`
- ❌ `app.js` con todo mezclado

### Internacionalización

- Archivos JSON separados en `src/locales/es/`
- No hardcodear textos en componentes
- Usar sistema i18n desde el inicio

---

## 📦 Fase 1: Fundamentos y Arquitectura

**Duración**: Semana 1 (7 días)  
**Objetivo**: Base sólida del proyecto con banco de preguntas funcional

### Día 1-2: Setup Inicial

#### Tarea 1.1: Inicializar Proyecto

```bash
# Crear proyecto con Vite
npm create vite@latest nexam -- --template react
cd nexam
npm install
```

**Dependencias a instalar**:

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "dexie": "^3.2.4",
    "dexie-react-hooks": "^1.1.7",
    "react-query": "^3.39.3",
    "jszip": "^3.10.1",
    "jspdf": "^2.5.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "typescript": "^5.3.3",
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "eslint": "^8.55.0",
    "prettier": "^3.1.1",
    "vitest": "^1.0.4"
  }
}
```

#### Tarea 1.2: Configurar Tailwind CSS

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**tailwind.config.js**:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
      },
    },
  },
  plugins: [],
}
```

**src/styles/globals.css**:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
  }
}
```

#### Tarea 1.3: Configurar shadcn/ui

```bash
npx shadcn-ui@latest init
```

Instalar componentes base:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
```

#### Tarea 1.4: Estructura de Carpetas

Crear la siguiente estructura:

```bash
mkdir -p src/{features,shared,core,locales,styles}
mkdir -p src/features/{questions,exams,correction,students,analytics}
mkdir -p src/shared/{components,services,utils,hooks,constants}
mkdir -p src/core/{storage,vision,export}

# Para cada feature, crear subdirectorios
for feature in questions exams correction students analytics; do
  mkdir -p src/features/$feature/{components,hooks,services,types,styles}
done
```

### Día 3-4: Módulo de Banco de Preguntas

#### Tarea 2.1: Configurar IndexedDB

**src/core/storage/db.js**:

```javascript
import Dexie from 'dexie';

export const db = new Dexie('NexamDB');

db.version(1).stores({
  questions: '++id, text, type, category, *tags, difficulty.manual, difficulty.automatic, createdAt, updatedAt',
  exams: '++id, title, date, type, createdAt',
  students: '++id, rut, name, email',
  results: '++id, examId, studentId, score, date',
  settings: 'key'
});

// Hooks para auto-timestamps
db.questions.hook('creating', (primKey, obj, trans) => {
  obj.createdAt = new Date();
  obj.updatedAt = new Date();
});

db.questions.hook('updating', (mods, primKey, obj, trans) => {
  mods.updatedAt = new Date();
});

export default db;
```

**src/core/storage/schemas.js**:

```javascript
/**
 * Schema de Question
 */
export const QuestionSchema = {
  id: 'string',
  text: 'string',
  type: 'multiple | boolean | development',
  alternatives: [
    {
      id: 'string',
      text: 'string',
      isCorrect: 'boolean'
    }
  ],
  category: 'string',
  tags: ['string'],
  difficulty: {
    manual: 'easy | medium | hard',
    automatic: 'number' // 0-1
  },
  feedback: {
    general: 'string',
    byAlternative: {
      alternativeId: 'string'
    }
  },
  comments: 'string',
  statistics: {
    timesUsed: 'number',
    averageScore: 'number',
    lastUsed: 'Date'
  },
  image: {
    data: 'Blob',
    alt: 'string'
  } || null,
  createdAt: 'Date',
  updatedAt: 'Date'
};

/**
 * Schema de Exam
 */
export const ExamSchema = {
  id: 'string',
  title: 'string',
  date: 'Date',
  duration: 'number', // minutos
  questions: ['string'], // IDs
  type: 'uniform | differentiated',
  randomization: {
    shuffleQuestions: 'boolean',
    shuffleAlternatives: 'boolean'
  },
  students: ['string'], // IDs
  codes: {
    studentId: 'string (4 letras)'
  },
  createdAt: 'Date'
};

/**
 * Schema de Student
 */
export const StudentSchema = {
  id: 'string',
  rut: 'string',
  name: 'string',
  email: 'string',
  createdAt: 'Date'
};

/**
 * Schema de Result
 */
export const ResultSchema = {
  id: 'string',
  examId: 'string',
  studentId: 'string',
  examCode: 'string',
  responses: [
    {
      questionId: 'string',
      answer: 'string',
      status: 'answered | unanswered | ambiguous'
    }
  ],
  score: 'number',
  feedback: 'string',
  date: 'Date'
};
```

#### Tarea 2.2: Servicio de Preguntas

**src/features/questions/services/questionsService.js**:

```javascript
import db from '../../../core/storage/db';
import { v4 as uuidv4 } from 'uuid';

/**
 * Servicio para gestión de preguntas
 */
export const questionsService = {
  /**
   * Crear nueva pregunta
   */
  async create(questionData) {
    const question = {
      id: uuidv4(),
      ...questionData,
      statistics: {
        timesUsed: 0,
        averageScore: 0,
        lastUsed: null
      }
    };
    
    const id = await db.questions.add(question);
    return await db.questions.get(id);
  },

  /**
   * Obtener pregunta por ID
   */
  async findById(id) {
    return await db.questions.get(id);
  },

  /**
   * Obtener todas las preguntas con filtros
   */
  async findAll(filters = {}) {
    let query = db.questions;
    
    if (filters.category) {
      query = query.where('category').equals(filters.category);
    }
    
    if (filters.type) {
      query = query.where('type').equals(filters.type);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      query = query.where('tags').anyOf(filters.tags);
    }
    
    if (filters.difficulty) {
      query = query.where('difficulty.manual').equals(filters.difficulty);
    }
    
    const questions = await query.toArray();
    
    // Filtro de búsqueda de texto
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return questions.filter(q => 
        q.text.toLowerCase().includes(searchLower)
      );
    }
    
    return questions;
  },

  /**
   * Actualizar pregunta
   */
  async update(id, updates) {
    await db.questions.update(id, updates);
    return await db.questions.get(id);
  },

  /**
   * Eliminar pregunta
   */
  async delete(id) {
    return await db.questions.delete(id);
  },

  /**
   * Actualizar estadísticas de pregunta
   */
  async updateStatistics(questionId, results) {
    const question = await db.questions.get(questionId);
    
    const newTimesUsed = question.statistics.timesUsed + results.length;
    const totalScore = question.statistics.averageScore * question.statistics.timesUsed;
    const newScore = results.reduce((sum, r) => sum + (r.correct ? 1 : 0), 0);
    const newAverageScore = (totalScore + newScore) / newTimesUsed;
    
    await db.questions.update(questionId, {
      'statistics.timesUsed': newTimesUsed,
      'statistics.averageScore': newAverageScore,
      'statistics.lastUsed': new Date()
    });
    
    // Calcular dificultad automática
    await this.calculateAutomaticDifficulty(questionId);
  },

  /**
   * Calcular dificultad automática basada en estadísticas
   */
  async calculateAutomaticDifficulty(questionId) {
    const question = await db.questions.get(questionId);
    
    if (question.statistics.timesUsed < 10) {
      // No suficientes datos
      return;
    }
    
    const avgScore = question.statistics.averageScore;
    
    // Mapear average score a dificultad [0, 1]
    // Alto score = fácil (0), Bajo score = difícil (1)
    const automaticDifficulty = 1 - avgScore;
    
    await db.questions.update(questionId, {
      'difficulty.automatic': automaticDifficulty
    });
  },

  /**
   * Obtener categorías únicas
   */
  async getCategories() {
    const questions = await db.questions.toArray();
    const categories = [...new Set(questions.map(q => q.category))];
    return categories.filter(Boolean);
  },

  /**
   * Obtener tags únicos
   */
  async getTags() {
    const questions = await db.questions.toArray();
    const allTags = questions.flatMap(q => q.tags || []);
    return [...new Set(allTags)];
  }
};

export default questionsService;
```

#### Tarea 2.3: Hook Personalizado

**src/features/questions/hooks/useQuestions.js**:

```javascript
import { useQuery, useMutation, useQueryClient } from 'react-query';
import questionsService from '../services/questionsService';

/**
 * Hook para gestión de preguntas
 */
export function useQuestions(filters = {}) {
  const queryClient = useQueryClient();
  
  // Query para obtener preguntas
  const questionsQuery = useQuery(
    ['questions', filters],
    () => questionsService.findAll(filters),
    {
      staleTime: 5 * 60 * 1000, // 5 minutos
    }
  );
  
  // Mutation para crear pregunta
  const createMutation = useMutation(
    (questionData) => questionsService.create(questionData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['questions']);
      }
    }
  );
  
  // Mutation para actualizar pregunta
  const updateMutation = useMutation(
    ({ id, updates }) => questionsService.update(id, updates),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['questions']);
      }
    }
  );
  
  // Mutation para eliminar pregunta
  const deleteMutation = useMutation(
    (id) => questionsService.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['questions']);
      }
    }
  );
  
  return {
    questions: questionsQuery.data || [],
    isLoading: questionsQuery.isLoading,
    error: questionsQuery.error,
    createQuestion: createMutation.mutate,
    updateQuestion: updateMutation.mutate,
    deleteQuestion: deleteMutation.mutate,
    isCreating: createMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading
  };
}

export default useQuestions;
```

#### Tarea 2.4: Componentes UI

**src/features/questions/components/QuestionCard.jsx**:

```jsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Pencil, Trash2 } from 'lucide-react';

export function QuestionCard({ question, onEdit, onDelete }) {
  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-red-100 text-red-800'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  const getTypeLabel = (type) => {
    const labels = {
      multiple: 'Opción Múltiple',
      boolean: 'Verdadero/Falso',
      development: 'Desarrollo'
    };
    return labels[type] || type;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex-1">
          <CardTitle className="text-lg font-medium line-clamp-2">
            {question.text}
          </CardTitle>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">{getTypeLabel(question.type)}</Badge>
            <Badge className={getDifficultyColor(question.difficulty.manual)}>
              {question.difficulty.manual}
            </Badge>
            {question.category && (
              <Badge variant="secondary">{question.category}</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(question)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(question.id)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {question.type === 'multiple' && (
          <div className="space-y-1">
            {question.alternatives.map((alt, index) => (
              <div
                key={alt.id}
                className={`text-sm p-2 rounded ${
                  alt.isCorrect ? 'bg-green-50 font-medium' : 'bg-gray-50'
                }`}
              >
                {String.fromCharCode(65 + index)}) {alt.text}
              </div>
            ))}
          </div>
        )}
        
        {question.tags && question.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {question.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        {question.statistics.timesUsed > 0 && (
          <div className="text-xs text-gray-500 mt-3">
            Usada {question.statistics.timesUsed} veces • 
            Promedio: {(question.statistics.averageScore * 100).toFixed(0)}%
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default QuestionCard;
```

**src/features/questions/components/QuestionList.jsx**:

```jsx
import React, { useState } from 'react';
import { useQuestions } from '../hooks/useQuestions';
import { QuestionCard } from './QuestionCard';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Plus, Search } from 'lucide-react';

export function QuestionList({ onEdit, onCreate }) {
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    difficulty: '',
    category: ''
  });

  const { questions, isLoading, deleteQuestion } = useQuestions(filters);

  if (isLoading) {
    return <div className="text-center py-8">Cargando preguntas...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar preguntas..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>
        
        <Select
          value={filters.type}
          onValueChange={(value) => setFilters({ ...filters, type: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="multiple">Opción Múltiple</SelectItem>
            <SelectItem value="boolean">Verdadero/Falso</SelectItem>
            <SelectItem value="development">Desarrollo</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.difficulty}
          onValueChange={(value) => setFilters({ ...filters, difficulty: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Dificultad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            <SelectItem value="easy">Fácil</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="hard">Difícil</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Pregunta
        </Button>
      </div>

      {/* Lista de preguntas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {questions.map(question => (
          <QuestionCard
            key={question.id}
            question={question}
            onEdit={onEdit}
            onDelete={deleteQuestion}
          />
        ))}
      </div>

      {questions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No se encontraron preguntas. Crea una nueva pregunta para comenzar.
        </div>
      )}
    </div>
  );
}

export default QuestionList;
```

### Día 5-6: Import/Export

#### Tarea 3.1: Parser GIFT

**src/core/export/giftParser.js**:

```javascript
/**
 * Parser para formato GIFT (Moodle)
 */

/**
 * Exportar preguntas a formato GIFT
 */
export function exportToGIFT(questions) {
  let giftContent = '';
  
  questions.forEach(question => {
    giftContent += `// ${question.category || 'Sin categoría'}\n`;
    giftContent += `::${question.id}:: `;
    giftContent += `${escapeGIFT(question.text)} `;
    
    if (question.type === 'multiple') {
      giftContent += '{\n';
      question.alternatives.forEach(alt => {
        const prefix = alt.isCorrect ? '=' : '~';
        const feedback = question.feedback.byAlternative?.[alt.id] 
          ? `#${escapeGIFT(question.feedback.byAlternative[alt.id])}` 
          : '';
        giftContent += `  ${prefix}${escapeGIFT(alt.text)}${feedback}\n`;
      });
      giftContent += '}\n\n';
    } else if (question.type === 'boolean') {
      const answer = question.correctAnswer === 'true' ? 'TRUE' : 'FALSE';
      giftContent += `{${answer}}\n\n`;
    } else if (question.type === 'development') {
      giftContent += '{}\n\n';
    }
  });
  
  return giftContent;
}

/**
 * Importar preguntas desde formato GIFT
 */
export function importFromGIFT(giftContent) {
  const questions = [];
  const lines = giftContent.split('\n');
  
  let currentQuestion = null;
  let inAlternatives = false;
  let category = '';
  
  for (let line of lines) {
    line = line.trim();
    
    // Ignorar líneas vacías y comentarios simples
    if (!line || line.startsWith('//')) {
      if (line.startsWith('// ')) {
        category = line.substring(3).trim();
      }
      continue;
    }
    
    // Detectar inicio de pregunta
    if (line.includes('::') && !inAlternatives) {
      if (currentQuestion) {
        questions.push(currentQuestion);
      }
      
      const parts = line.split('::');
      const id = parts[1];
      const text = parts[2].split('{')[0].trim();
      
      currentQuestion = {
        text: unescapeGIFT(text),
        category: category,
        alternatives: [],
        type: 'multiple',
        difficulty: { manual: 'medium', automatic: 0 },
        tags: [],
        feedback: { general: '', byAlternative: {} },
        comments: '',
        statistics: { timesUsed: 0, averageScore: 0, lastUsed: null }
      };
      
      if (line.includes('{')) {
        inAlternatives = true;
      }
    }
    
    // Procesar alternativas
    if (inAlternatives && (line.startsWith('=') || line.startsWith('~'))) {
      const isCorrect = line.startsWith('=');
      const content = line.substring(1).split('#');
      const text = content[0].trim();
      const feedback = content[1] ? content[1].trim() : '';
      
      const altId = `alt_${currentQuestion.alternatives.length}`;
      currentQuestion.alternatives.push({
        id: altId,
        text: unescapeGIFT(text),
        isCorrect: isCorrect
      });
      
      if (feedback) {
        currentQuestion.feedback.byAlternative[altId] = unescapeGIFT(feedback);
      }
    }
    
    // Detectar fin de pregunta
    if (line === '}') {
      inAlternatives = false;
    }
  }
  
  // Agregar última pregunta
  if (currentQuestion) {
    questions.push(currentQuestion);
  }
  
  return questions;
}

/**
 * Escapar caracteres especiales para GIFT
 */
function escapeGIFT(text) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/~/g, '\\~')
    .replace(/=/g, '\\=')
    .replace(/#/g, '\\#')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/:/g, '\\:');
}

/**
 * Desescapar caracteres especiales de GIFT
 */
function unescapeGIFT(text) {
  return text
    .replace(/\\~/g, '~')
    .replace(/\\=/g, '=')
    .replace(/\\#/g, '#')
    .replace(/\\{/g, '{')
    .replace(/\\}/g, '}')
    .replace(/\\:/g, ':')
    .replace(/\\\\/g, '\\');
}

export default {
  exportToGIFT,
  importFromGIFT
};
```

#### Tarea 3.2: Manejo de ZIP

**src/core/export/zipHandler.js**:

```javascript
import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';

/**
 * Exportar preguntas a ZIP con JSON + imágenes
 */
export async function exportToZIP(questions) {
  const zip = new JSZip();
  const imagesFolder = zip.folder('images');
  
  // Preparar datos de preguntas sin blobs
  const questionsData = await Promise.all(
    questions.map(async (question) => {
      const questionCopy = { ...question };
      
      // Si tiene imagen, guardarla en carpeta y referenciarla
      if (question.image?.data) {
        const imageId = `${question.id}_${uuidv4()}`;
        const ext = question.image.data.type.split('/')[1] || 'png';
        const filename = `${imageId}.${ext}`;
        
        imagesFolder.file(filename, question.image.data);
        
        questionCopy.image = {
          filename: filename,
          alt: question.image.alt
        };
      }
      
      return questionCopy;
    })
  );
  
  // Agregar JSON con metadatos
  zip.file('questions.json', JSON.stringify(questionsData, null, 2));
  
  // Generar blob del ZIP
  const blob = await zip.generateAsync({ type: 'blob' });
  return blob;
}

/**
 * Importar preguntas desde ZIP con JSON + imágenes
 */
export async function importFromZIP(zipFile) {
  const zip = await JSZip.loadAsync(zipFile);
  
  // Leer JSON
  const jsonFile = zip.file('questions.json');
  if (!jsonFile) {
    throw new Error('Archivo questions.json no encontrado en el ZIP');
  }
  
  const jsonContent = await jsonFile.async('string');
  const questionsData = JSON.parse(jsonContent);
  
  // Cargar imágenes
  const questions = await Promise.all(
    questionsData.map(async (question) => {
      if (question.image?.filename) {
        const imageFile = zip.file(`images/${question.image.filename}`);
        if (imageFile) {
          const blob = await imageFile.async('blob');
          question.image = {
            data: blob,
            alt: question.image.alt
          };
        }
      }
      return question;
    })
  );
  
  return questions;
}

export default {
  exportToZIP,
  importFromZIP
};
```

### Día 7: PWA Setup

#### Tarea 4.1: Configurar Workbox

**vite.config.js**:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Nexam - Sistema de Evaluación',
        short_name: 'Nexam',
        description: 'Sistema inteligente de evaluación educativa',
        theme_color: '#0ea5e9',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 año
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
```

---

## 📦 Fase 2: Generación de Evaluaciones

**Duración**: Semana 2 (7 días)  
**Objetivo**: Sistema completo de generación de PDFs y hojas de respuesta

### Día 1-2: Módulo de Exámenes

#### Tarea 5.1: Servicio de Exámenes

**src/features/exams/services/examService.js**:

```javascript
import db from '../../../core/storage/db';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generar código único de 4 letras
 */
function generateUniqueCode(existingCodes) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Sin I, O
  let code;
  do {
    code = Array.from({ length: 4 }, () => 
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  } while (existingCodes.has(code));
  return code;
}

/**
 * Mezclar array (Fisher-Yates)
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const examService = {
  /**
   * Crear examen
   */
  async create(examConfig) {
    const exam = {
      id: uuidv4(),
      ...examConfig,
      codes: {},
      createdAt: new Date()
    };
    
    // Si es diferenciado, generar códigos por estudiante
    if (examConfig.type === 'differentiated') {
      const existingCodes = new Set();
      examConfig.students.forEach(studentId => {
        const code = generateUniqueCode(existingCodes);
        exam.codes[studentId] = code;
        existingCodes.add(code);
      });
    }
    
    const id = await db.exams.add(exam);
    return await db.exams.get(id);
  },

  /**
   * Obtener examen por ID
   */
  async findById(id) {
    return await db.exams.get(id);
  },

  /**
   * Generar versión de examen para estudiante
   */
  async generateExamVersion(examId, studentId) {
    const exam = await db.exams.get(examId);
    const questions = await Promise.all(
      exam.questions.map(qId => db.questions.get(qId))
    );
    
    let finalQuestions = questions;
    
    // Aleatorizar preguntas si está configurado
    if (exam.randomization.shuffleQuestions) {
      finalQuestions = shuffleArray(finalQuestions);
    }
    
    // Aleatorizar alternativas si está configurado
    if (exam.randomization.shuffleAlternatives) {
      finalQuestions = finalQuestions.map(q => {
        if (q.type === 'multiple') {
          return {
            ...q,
            alternatives: shuffleArray(q.alternatives)
          };
        }
        return q;
      });
    }
    
    return {
      examId: exam.id,
      studentId: studentId,
      code: exam.codes[studentId] || null,
      title: exam.title,
      date: exam.date,
      duration: exam.duration,
      questions: finalQuestions
    };
  },

  /**
   * Obtener todos los exámenes
   */
  async findAll() {
    return await db.exams.toArray();
  },

  /**
   * Eliminar examen
   */
  async delete(id) {
    return await db.exams.delete(id);
  }
};

export default examService;
```

### Día 3-4: Generación de PDFs

#### Tarea 6.1: Generador de PDFs

**src/features/exams/services/pdfGenerator.js**:

```javascript
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Generar PDF de hoja de prueba
 */
export function generateExamSheet(examVersion) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Marcas de alineación en esquinas
  drawAlignmentMarkers(doc, pageWidth, pageHeight);
  
  // Encabezado
  doc.setFontSize(16);
  doc.text(examVersion.title, pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Fecha: ${examVersion.date.toLocaleDateString()}`, 20, 30);
  doc.text(`Duración: ${examVersion.duration} minutos`, 20, 35);
  
  if (examVersion.code) {
    doc.setFontSize(12);
    doc.text(`Código: ${examVersion.code}`, pageWidth - 40, 30);
  }
  
  // Espacio para datos del estudiante
  doc.setFontSize(10);
  doc.text('Nombre: _______________________________________________', 20, 45);
  doc.text('RUT: ___________________', 20, 52);
  
  // Preguntas
  let yPosition = 65;
  
  examVersion.questions.forEach((question, index) => {
    // Verificar si necesitamos nueva página
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
      drawAlignmentMarkers(doc, pageWidth, pageHeight);
    }
    
    // Número de pregunta
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(`${index + 1}.`, 20, yPosition);
    
    // Texto de pregunta (con wrap)
    doc.setFont(undefined, 'normal');
    const questionLines = doc.splitTextToSize(question.text, pageWidth - 50);
    doc.text(questionLines, 28, yPosition);
    yPosition += questionLines.length * 5 + 3;
    
    // Alternativas
    if (question.type === 'multiple') {
      question.alternatives.forEach((alt, altIndex) => {
        const letter = String.fromCharCode(65 + altIndex);
        const altLines = doc.splitTextToSize(alt.text, pageWidth - 60);
        doc.text(`${letter})`, 30, yPosition);
        doc.text(altLines, 38, yPosition);
        yPosition += altLines.length * 5 + 2;
      });
    } else if (question.type === 'boolean') {
      doc.text('( ) Verdadero', 30, yPosition);
      yPosition += 7;
      doc.text('( ) Falso', 30, yPosition);
      yPosition += 7;
    } else if (question.type === 'development') {
      doc.text('_________________________________________________________', 30, yPosition);
      yPosition += 7;
      doc.text('_________________________________________________________', 30, yPosition);
      yPosition += 7;
      doc.text('_________________________________________________________', 30, yPosition);
      yPosition += 7;
    }
    
    yPosition += 8; // Espacio entre preguntas
  });
  
  return doc;
}

/**
 * Generar PDF de hoja de respuestas
 */
export function generateAnswerSheet(examVersion) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Marcas de alineación en esquinas
  drawAlignmentMarkers(doc, pageWidth, pageHeight);
  
  // Encabezado
  doc.setFontSize(14);
  doc.text('HOJA DE RESPUESTAS', pageWidth / 2, 20, { align: 'center' });
  
  // Código de prueba (si existe)
  if (examVersion.code) {
    doc.setFontSize(12);
    doc.text(`Código Prueba: ${examVersion.code}`, 20, 30);
    
    // Cuadros para verificación de código
    doc.text('Verificar código:', pageWidth - 80, 30);
    for (let i = 0; i < 4; i++) {
      doc.rect(pageWidth - 70 + (i * 10), 32, 8, 8);
    }
  }
  
  // Datos del estudiante
  doc.setFontSize(10);
  doc.text('Nombre: _______________________________________________', 20, 40);
  doc.text('RUT: ___________________', 20, 47);
  
  // Instrucciones
  doc.setFontSize(9);
  doc.text('Instrucciones: Marque con una X, círculo o raya la alternativa correcta', 20, 57);
  
  // Tabla de respuestas
  const tableData = [];
  const maxAlternatives = Math.max(
    ...examVersion.questions
      .filter(q => q.type === 'multiple')
      .map(q => q.alternatives.length),
    5
  );
  
  examVersion.questions.forEach((question, index) => {
    const row = [`${index + 1}`];
    
    if (question.type === 'multiple') {
      for (let i = 0; i < maxAlternatives; i++) {
        row.push(i < question.alternatives.length ? '( )' : '');
      }
    } else if (question.type === 'boolean') {
      row.push('( ) V', '( ) F');
      for (let i = 2; i < maxAlternatives; i++) {
        row.push('');
      }
    } else if (question.type === 'development') {
      row.push('Desarrollar');
      for (let i = 1; i < maxAlternatives; i++) {
        row.push('');
      }
    }
    
    tableData.push(row);
  });
  
  // Generar headers dinámicamente
  const headers = ['N°'];
  for (let i = 0; i < maxAlternatives; i++) {
    headers.push(String.fromCharCode(65 + i));
  }
  
  doc.autoTable({
    startY: 65,
    head: [headers],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 15, fontStyle: 'bold' }
    },
    headStyles: {
      fillColor: [200, 200, 200],
      textColor: 0
    }
  });
  
  return doc;
}

/**
 * Dibujar marcas de alineación en esquinas
 */
function drawAlignmentMarkers(doc, pageWidth, pageHeight) {
  const markerSize = 10;
  const offset = 5;
  
  // Esquina superior izquierda
  doc.circle(offset + markerSize/2, offset + markerSize/2, markerSize/2, 'F');
  
  // Esquina superior derecha
  doc.circle(pageWidth - offset - markerSize/2, offset + markerSize/2, markerSize/2, 'F');
  
  // Esquina inferior izquierda
  doc.circle(offset + markerSize/2, pageHeight - offset - markerSize/2, markerSize/2, 'F');
  
  // Esquina inferior derecha
  doc.circle(pageWidth - offset - markerSize/2, pageHeight - offset - markerSize/2, markerSize/2, 'F');
}

/**
 * Generar todos los PDFs para un examen
 */
export async function generateAllExamPDFs(exam, students) {
  const pdfs = [];
  
  for (const student of students) {
    const examVersion = await examService.generateExamVersion(exam.id, student.id);
    
    const examSheet = generateExamSheet(examVersion);
    const answerSheet = generateAnswerSheet(examVersion);
    
    pdfs.push({
      studentId: student.id,
      studentName: student.name,
      code: examVersion.code,
      examSheet: examSheet,
      answerSheet: answerSheet
    });
  }
  
  return pdfs;
}

export default {
  generateExamSheet,
  generateAnswerSheet,
  generateAllExamPDFs
};
```

### Día 5-6: Gestión de Estudiantes

#### Tarea 7.1: Servicio de Estudiantes

**src/features/students/services/studentsService.js**:

```javascript
import db from '../../../core/storage/db';
import { v4 as uuidv4 } from 'uuid';

/**
 * Validar RUT chileno
 */
function validateRUT(rut) {
  // Eliminar puntos y guión
  rut = rut.replace(/\./g, '').replace(/-/g, '');
  
  if (rut.length < 2) return false;
  
  const body = rut.slice(0, -1);
  const dv = rut.slice(-1).toUpperCase();
  
  if (!/^\d+$/.test(body)) return false;
  
  // Calcular dígito verificador
  let sum = 0;
  let multiplier = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const expectedDV = 11 - (sum % 11);
  const calculatedDV = expectedDV === 11 ? '0' : expectedDV === 10 ? 'K' : expectedDV.toString();
  
  return dv === calculatedDV;
}

/**
 * Formatear RUT chileno
 */
function formatRUT(rut) {
  rut = rut.replace(/\./g, '').replace(/-/g, '');
  const body = rut.slice(0, -1);
  const dv = rut.slice(-1);
  
  return body.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv;
}

export const studentsService = {
  /**
   * Crear estudiante
   */
  async create(studentData) {
    // Validar RUT
    if (!validateRUT(studentData.rut)) {
      throw new Error('RUT inválido');
    }
    
    const student = {
      id: uuidv4(),
      ...studentData,
      rut: formatRUT(studentData.rut),
      createdAt: new Date()
    };
    
    const id = await db.students.add(student);
    return await db.students.get(id);
  },

  /**
   * Importar desde CSV
   */
  async importFromCSV(csvContent) {
    const lines = csvContent.split('\n').filter(line => line.trim());
    const students = [];
    
    // Asumimos formato: rut,nombre,email
    for (let i = 1; i < lines.length; i++) {
      const [rut, name, email] = lines[i].split(',').map(s => s.trim());
      
      if (rut && name) {
        try {
          const student = await this.create({ rut, name, email });
          students.push(student);
        } catch (error) {
          console.error(`Error importando estudiante ${name}:`, error);
        }
      }
    }
    
    return students;
  },

  /**
   * Obtener todos los estudiantes
   */
  async findAll() {
    return await db.students.toArray();
  },

  /**
   * Buscar por RUT
   */
  async findByRUT(rut) {
    const formattedRUT = formatRUT(rut);
    return await db.students.where('rut').equals(formattedRUT).first();
  },

  /**
   * Actualizar estudiante
   */
  async update(id, updates) {
    if (updates.rut && !validateRUT(updates.rut)) {
      throw new Error('RUT inválido');
    }
    
    if (updates.rut) {
      updates.rut = formatRUT(updates.rut);
    }
    
    await db.students.update(id, updates);
    return await db.students.get(id);
  },

  /**
   * Eliminar estudiante
   */
  async delete(id) {
    return await db.students.delete(id);
  }
};

export default studentsService;
```

---

## 📦 Fase 3: Corrección Automática con IA

**Duración**: Semana 3 (7 días)  
**Objetivo**: Pipeline completo de Computer Vision para corrección automática

### Día 1-2: Preparación de Dataset

#### Tarea 8.1: Script de Generación de Dataset Sintético

**training/scripts/prepare_dataset.py**:

```python
import cv2
import numpy as np
from pathlib import Path
import json
import random

# Configuración
OUTPUT_DIR = Path('training/dataset')
IMAGES_DIR = OUTPUT_DIR / 'images'
LABELS_DIR = OUTPUT_DIR / 'labels'
NUM_SHEETS = 1500

# Crear directorios
IMAGES_DIR.mkdir(parents=True, exist_ok=True)
LABELS_DIR.mkdir(parents=True, exist_ok=True)

def generate_answer_sheet(num_questions=40, num_alternatives=5):
    """Generar hoja de respuestas sintética"""
    
    # Crear imagen blanca
    img = np.ones((1120, 800, 3), dtype=np.uint8) * 255
    
    # Parámetros
    margin = 50
    header_height = 150
    cell_size = 30
    cell_spacing = 10
    
    annotations = []
    
    # Dibujar marcas de esquina (círculos negros)
    corner_radius = 10
    corners = [
        (margin, margin),
        (800 - margin, margin),
        (margin, 1120 - margin),
        (800 - margin, 1120 - margin)
    ]
    
    for x, y in corners:
        cv2.circle(img, (x, y), corner_radius, (0, 0, 0), -1)
    
    # Dibujar grid de respuestas
    start_y = header_height
    
    for i in range(num_questions):
        y = start_y + i * (cell_size + cell_spacing)
        
        # Número de pregunta
        cv2.putText(img, str(i + 1), (margin, y + 20), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
        
        for j in range(num_alternatives):
            x = margin + 40 + j * (cell_size + cell_spacing)
            
            # Dibujar círculo vacío
            cv2.circle(img, (x + cell_size//2, y + cell_size//2), 
                      cell_size//2 - 2, (0, 0, 0), 1)
            
            # Decidir aleatoriamente si marcar
            should_mark = random.random() < 0.25  # 25% de probabilidad
            
            if should_mark:
                mark_type = random.choice(['circle', 'x', 'line'])
                mark_cell(img, x, y, cell_size, mark_type)
                
                # Anotar para YOLO
                class_id = get_class_id(mark_type)
                annotation = create_yolo_annotation(
                    class_id, x, y, cell_size, 800, 1120
                )
                annotations.append(annotation)
            else:
                # Anotar como vacío
                class_id = 3  # empty
                annotation = create_yolo_annotation(
                    class_id, x, y, cell_size, 800, 1120
                )
                annotations.append(annotation)
    
    return img, annotations

def mark_cell(img, x, y, size, mark_type):
    """Marcar una celda con diferentes tipos de marca"""
    center_x = x + size // 2
    center_y = y + size // 2
    
    if mark_type == 'circle':
        # Círculo rellenado
        cv2.circle(img, (center_x, center_y), size//2 - 4, (0, 0, 0), -1)
        
    elif mark_type == 'x':
        # X
        offset = size // 4
        cv2.line(img, (center_x - offset, center_y - offset),
                (center_x + offset, center_y + offset), (0, 0, 0), 2)
        cv2.line(img, (center_x + offset, center_y - offset),
                (center_x - offset, center_y + offset), (0, 0, 0), 2)
        
    elif mark_type == 'line':
        # Raya horizontal
        offset = size // 3
        cv2.line(img, (center_x - offset, center_y),
                (center_x + offset, center_y), (0, 0, 0), 2)

def get_class_id(mark_type):
    """Obtener ID de clase para YOLO"""
    classes = {
        'circle': 0,  # filled_circle
        'x': 1,       # filled_x
        'line': 2     # filled_line
    }
    return classes[mark_type]

def create_yolo_annotation(class_id, x, y, size, img_width, img_height):
    """Crear anotación en formato YOLO"""
    x_center = (x + size / 2) / img_width
    y_center = (y + size / 2) / img_height
    width = size / img_width
    height = size / img_height
    
    return f"{class_id} {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}"

def apply_augmentation(img):
    """Aplicar aumentaciones realistas"""
    
    # Rotación leve
    angle = random.uniform(-5, 5)
    h, w = img.shape[:2]
    M = cv2.getRotationMatrix2D((w/2, h/2), angle, 1)
    img = cv2.warpAffine(img, M, (w, h), borderValue=(255, 255, 255))
    
    # Ruido gaussiano
    noise = np.random.normal(0, random.uniform(5, 15), img.shape)
    img = np.clip(img + noise, 0, 255).astype(np.uint8)
    
    # Ajuste de brillo
    brightness = random.uniform(0.8, 1.2)
    img = np.clip(img * brightness, 0, 255).astype(np.uint8)
    
    # Blur leve
    if random.random() < 0.3:
        img = cv2.GaussianBlur(img, (3, 3), 0)
    
    return img

# Generar dataset
print(f"Generando {NUM_SHEETS} hojas de respuestas...")

for i in range(NUM_SHEETS):
    # Generar hoja
    img, annotations = generate_answer_sheet()
    
    # Aplicar aumentaciones
    img = apply_augmentation(img)
    
    # Guardar imagen
    img_path = IMAGES_DIR / f'sheet_{i:04d}.jpg'
    cv2.imwrite(str(img_path), img)
    
    # Guardar anotaciones
    label_path = LABELS_DIR / f'sheet_{i:04d}.txt'
    with open(label_path, 'w') as f:
        f.write('\n'.join(annotations))
    
    if (i + 1) % 100 == 0:
        print(f"Generadas {i + 1}/{NUM_SHEETS} hojas")

print("Dataset generado exitosamente!")

# Crear data.yaml
data_yaml = {
    'path': str(OUTPUT_DIR.absolute()),
    'train': 'images',
    'val': 'images',
    'nc': 4,
    'names': ['filled_circle', 'filled_x', 'filled_line', 'empty']
}

with open(OUTPUT_DIR / 'data.yaml', 'w') as f:
    import yaml
    yaml.dump(data_yaml, f)

print("Archivo data.yaml creado")
```

### Día 3-4: Entrenamiento del Modelo

#### Tarea 9.1: Script de Entrenamiento

**training/scripts/train.py**:

```python
from ultralytics import YOLO
import torch

# Verificar GPU
print(f"CUDA disponible: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")

# Cargar modelo base YOLOv11n
model = YOLO('yolov11n.pt')

# Entrenar
results = model.train(
    data='training/dataset/data.yaml',
    epochs=100,
    imgsz=640,
    batch=16,
    patience=20,
    save=True,
    project='nexam-training',
    name='yolov11n-marks',
    exist_ok=True,
    
    # Hiperparámetros optimizados
    lr0=0.01,
    lrf=0.01,
    momentum=0.937,
    weight_decay=0.0005,
    warmup_epochs=3,
    warmup_momentum=0.8,
    warmup_bias_lr=0.1,
    
    # Augmentation
    hsv_h=0.015,
    hsv_s=0.7,
    hsv_v=0.4,
    degrees=5.0,
    translate=0.1,
    scale=0.5,
    shear=2.0,
    perspective=0.0,
    flipud=0.0,
    fliplr=0.0,
    mosaic=1.0,
    mixup=0.0,
    copy_paste=0.0,
    
    # Callbacks
    verbose=True,
    plots=True
)

# Validar
metrics = model.val()
print(f"\nmAP50: {metrics.maps['mAP50']:.4f}")
print(f"mAP50-95: {metrics.maps['mAP50-95']:.4f}")
print(f"Precision: {metrics.maps['precision']:.4f}")
print(f"Recall: {metrics.maps['recall']:.4f}")
```

#### Tarea 9.2: Exportación a ONNX

**training/scripts/export_onnx.py**:

```python
from ultralytics import YOLO
import shutil
from pathlib import Path

# Cargar mejor modelo
model = YOLO('nexam-training/yolov11n-marks/weights/best.pt')

# Exportar a ONNX
model.export(
    format='onnx',
    opset=12,
    simplify=True,
    dynamic=False,
    imgsz=640
)

# Copiar a public/models
src = Path('nexam-training/yolov11n-marks/weights/best.onnx')
dst = Path('public/models/yolov11n-marks.onnx')
dst.parent.mkdir(parents=True, exist_ok=True)
shutil.copy(src, dst)

print(f"Modelo exportado a: {dst}")
```

### Día 5-6: Pipeline de Corrección

#### Tarea 10.1: Wrapper de OpenCV

**src/core/vision/opencv.js**:

```javascript
/**
 * Wrapper para OpenCV.js
 */

let cv = null;

/**
 * Inicializar OpenCV
 */
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

/**
 * Preprocesar imagen
 */
export function preprocessImage(imageMat) {
  // Convertir a escala de grises
  const gray = new cv.Mat();
  cv.cvtColor(imageMat, gray, cv.COLOR_RGBA2GRAY);
  
  // Reducción de ruido
  const blurred = new cv.Mat();
  cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
  
  // Binarización adaptativa
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
  
  // Operaciones morfológicas
  const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
  cv.morphologyEx(binary, binary, cv.MORPH_CLOSE, kernel);
  
  // Limpiar
  gray.delete();
  blurred.delete();
  kernel.delete();
  
  return binary;
}

/**
 * Detectar círculos (marcas de esquina)
 */
export function detectCircles(imageMat, minRadius = 10, maxRadius = 30) {
  const circles = new cv.Mat();
  
  cv.HoughCircles(
    imageMat,
    circles,
    cv.HOUGH_GRADIENT,
    1,
    50, // minDist
    100, // param1
    30, // param2
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

/**
 * Ordenar puntos en orden: TL, TR, BR, BL
 */
function orderPoints(points) {
  // Ordenar por suma (TL tendrá suma menor, BR suma mayor)
  const sorted = points.sort((a, b) => (a.x + a.y) - (b.x + b.y));
  
  const tl = sorted[0];
  const br = sorted[3];
  
  // De los 2 del medio, el de menor diferencia es TR
  const middle = [sorted[1], sorted[2]];
  const tr = middle.reduce((a, b) => 
    (a.x - a.y) > (b.x - b.y) ? a : b
  );
  const bl = middle.find(p => p !== tr);
  
  return [tl, tr, br, bl];
}

/**
 * Alinear imagen usando marcas de esquina
 */
export function alignImage(imageMat) {
  // Detectar marcas de esquina
  const circles = detectCircles(imageMat);
  
  if (circles.length < 4) {
    throw new Error('No se detectaron las 4 marcas de esquina');
  }
  
  // Tomar las 4 más grandes (probablemente las marcas)
  const sortedByRadius = circles.sort((a, b) => b.radius - a.radius);
  const cornerMarks = sortedByRadius.slice(0, 4);
  
  // Ordenar puntos
  const orderedPoints = orderPoints(cornerMarks);
  
  // Dimensiones destino
  const width = 800;
  const height = 1120;
  
  // Crear matrices de puntos
  const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, 
    orderedPoints.flatMap(p => [p.x, p.y])
  );
  
  const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0, 0,
    width, 0,
    width, height,
    0, height
  ]);
  
  // Calcular transformación
  const transformMatrix = cv.getPerspectiveTransform(srcPoints, dstPoints);
  
  // Aplicar transformación
  const aligned = new cv.Mat();
  cv.warpPerspective(
    imageMat,
    aligned,
    transformMatrix,
    new cv.Size(width, height)
  );
  
  // Limpiar
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

#### Tarea 10.2: Detector de Marcas con YOLO

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
  
  /**
   * Detectar marcas en imagen
   */
  async detect(imageData) {
    const tensor = await this.preprocessForYOLO(imageData);
    
    const feeds = { images: tensor };
    const results = await this.session.run(feeds);
    
    const detections = this.postprocess(results.output0);
    
    return detections;
  }
  
  /**
   * Preprocesar imagen para YOLO
   */
  async preprocessForYOLO(imageData) {
    // Redimensionar a 640x640
    const canvas = document.createElement('canvas');
    canvas.width = this.inputSize;
    canvas.height = this.inputSize;
    const ctx = canvas.getContext('2d');
    
    // Dibujar imagen redimensionada
    ctx.drawImage(imageData, 0, 0, this.inputSize, this.inputSize);
    
    // Obtener píxeles
    const imageDataRGBA = ctx.getImageData(0, 0, this.inputSize, this.inputSize);
    const pixels = imageDataRGBA.data;
    
    // Convertir a Float32Array normalizado [0, 1]
    const float32Data = new Float32Array(3 * this.inputSize * this.inputSize);
    
    for (let i = 0; i < this.inputSize * this.inputSize; i++) {
      float32Data[i] = pixels[i * 4] / 255.0; // R
      float32Data[this.inputSize * this.inputSize + i] = pixels[i * 4 + 1] / 255.0; // G
      float32Data[2 * this.inputSize * this.inputSize + i] = pixels[i * 4 + 2] / 255.0; // B
    }
    
    // Crear tensor [1, 3, 640, 640]
    const tensor = new ort.Tensor('float32', float32Data, [1, 3, this.inputSize, this.inputSize]);
    
    return tensor;
  }
  
  /**
   * Post-procesar salida de YOLO
   */
  postprocess(output) {
    const data = output.data;
    const shape = output.dims; // [1, 84, 8400]
    
    const numDetections = shape[2];
    const numFeatures = shape[1];
    
    const detections = [];
    const confThreshold = 0.5;
    
    for (let i = 0; i < numDetections; i++) {
      // Extraer features [x, y, w, h, conf, class_probs...]
      const x = data[i];
      const y = data[numDetections + i];
      const w = data[2 * numDetections + i];
      const h = data[3 * numDetections + i];
      const conf = data[4 * numDetections + i];
      
      if (conf < confThreshold) continue;
      
      // Encontrar clase con mayor probabilidad
      let maxProb = 0;
      let classId = 0;
      
      for (let j = 5; j < numFeatures; j++) {
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
    
    // Aplicar NMS
    return this.nonMaxSuppression(detections);
  }
  
  /**
   * Non-Maximum Suppression
   */
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
  
  /**
   * Calcular Intersection over Union
   */
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
  
  /**
   * Obtener nombre de clase
   */
  getClassName(classId) {
    const classes = ['filled_circle', 'filled_x', 'filled_line', 'empty'];
    return classes[classId] || 'unknown';
  }
}

export default MarkDetector;
```

#### Tarea 10.3: Servicio de Corrección

**src/features/correction/services/correctionService.js**:

```javascript
import { initializeOpenCV, preprocessImage, alignImage } from '../../../core/vision/opencv';
import MarkDetector from '../../../core/vision/yolo';
import db from '../../../core/storage/db';

export const correctionService = {
  detector: null,
  
  /**
   * Inicializar servicio
   */
  async initialize() {
    await initializeOpenCV();
    this.detector = new MarkDetector('/models/yolov11n-marks.onnx');
    await this.detector.initialize();
  },
  
  /**
   * Corregir hoja de respuestas
   */
  async correctAnswerSheet(imageFile, examId) {
    // 1. Cargar imagen
    const imageMat = await this.loadImage(imageFile);
    
    // 2. Preprocesar y alinear
    const preprocessed = preprocessImage(imageMat);
    const aligned = alignImage(preprocessed);
    
    // 3. Detectar marcas
    const canvas = document.createElement('canvas');
    cv.imshow(canvas, aligned);
    const detections = await this.detector.detect(canvas);
    
    // 4. Extraer respuestas
    const exam = await db.exams.get(examId);
    const responses = this.extractResponses(detections, exam);
    
    // 5. Identificar códigos (estudiante y examen)
    const codes = this.extractCodes(detections);
    
    // 6. Validar respuestas
    const results = await this.validateAnswers(responses, exam, codes.examCode);
    
    // 7. Calcular puntaje
    const score = this.calculateScore(results);
    
    // 8. Guardar resultado
    const result = await this.saveResult({
      examId,
      studentCode: codes.studentCode,
      examCode: codes.examCode,
      responses,
      results,
      score
    });
    
    // Limpiar
    imageMat.delete();
    preprocessed.delete();
    aligned.delete();
    
    return result;
  },
  
  /**
   * Cargar imagen desde archivo
   */
  async loadImage(file) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const imageMat = cv.imread(canvas);
        resolve(imageMat);
      };
      img.src = URL.createObjectURL(file);
    });
  },
  
  /**
   * Extraer respuestas de detecciones
   */
  extractResponses(detections, exam) {
    const responses = [];
    const questionHeight = 30; // Altura de cada fila en píxeles
    const headerOffset = 150; // Offset del encabezado
    
    for (let i = 0; i < exam.questions.length; i++) {
      const yMin = headerOffset + i * questionHeight;
      const yMax = yMin + questionHeight;
      
      // Filtrar detecciones de esta pregunta
      const questionDetections = detections.filter(
        d => d.y >= yMin && d.y < yMax && 
             ['filled_circle', 'filled_x', 'filled_line'].includes(d.className)
      );
      
      if (questionDetections.length === 0) {
        responses.push({
          questionIndex: i,
          answer: null,
          status: 'unanswered'
        });
      } else if (questionDetections.length === 1) {
        const alternative = this.mapDetectionToAlternative(questionDetections[0]);
        responses.push({
          questionIndex: i,
          answer: alternative,
          status: 'answered'
        });
      } else {
        // Múltiples marcas
        responses.push({
          questionIndex: i,
          answer: null,
          status: 'ambiguous',
          detections: questionDetections
        });
      }
    }
    
    return responses;
  },
  
  /**
   * Mapear detección a alternativa (A, B, C, D, E...)
   */
  mapDetectionToAlternative(detection) {
    const cellWidth = 40; // Ancho de celda en píxeles
    const startX = 90; // Inicio de la primera alternativa
    
    const alternativeIndex = Math.floor((detection.x - startX) / cellWidth);
    return String.fromCharCode(65 + alternativeIndex); // A, B, C...
  },
  
  /**
   * Extraer códigos de identificación
   */
  extractCodes(detections) {
    // TODO: Implementar detección de códigos usando OCR o detección de letras
    return {
      studentCode: null,
      examCode: null
    };
  },
  
  /**
   * Validar respuestas contra gabarito
   */
  async validateAnswers(responses, exam, examCode) {
    const results = [];
    
    // Obtener preguntas
    const questions = await Promise.all(
      exam.questions.map(qId => db.questions.get(qId))
    );
    
    // Si es examen diferenciado, necesitamos el orden específico
    // Por ahora asumimos orden estándar
    
    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];
      const question = questions[i];
      
      if (response.status === 'unanswered') {
        results.push({
          questionId: question.id,
          correct: false,
          status: 'unanswered'
        });
        continue;
      }
      
      if (response.status === 'ambiguous') {
        results.push({
          questionId: question.id,
          correct: false,
          status: 'ambiguous'
        });
        continue;
      }
      
      // Verificar si es correcta
      const correctAlternative = question.alternatives.find(a => a.isCorrect);
      const answerIndex = response.answer.charCodeAt(0) - 65;
      const isCorrect = question.alternatives[answerIndex]?.id === correctAlternative?.id;
      
      results.push({
        questionId: question.id,
        correct: isCorrect,
        status: 'graded',
        feedback: isCorrect 
          ? question.feedback.general 
          : question.feedback.byAlternative?.[question.alternatives[answerIndex]?.id]
      });
    }
    
    return results;
  },
  
  /**
   * Calcular puntaje
   */
  calculateScore(results) {
    const total = results.length;
    const correct = results.filter(r => r.correct).length;
    
    return {
      correct,
      total,
      percentage: (correct / total) * 100,
      grade: ((correct / total) * 6 + 1).toFixed(1) // Escala chilena 1-7
    };
  },
  
  /**
   * Guardar resultado
   */
  async saveResult(resultData) {
    const result = {
      id: uuidv4(),
      ...resultData,
      date: new Date()
    };
    
    await db.results.add(result);
    
    // Actualizar estadísticas de preguntas
    const exam = await db.exams.get(resultData.examId);
    for (let i = 0; i < resultData.results.length; i++) {
      const questionId = exam.questions[i];
      await questionsService.updateStatistics(questionId, [
        { correct: resultData.results[i].correct }
      ]);
    }
    
    return result;
  }
};

export default correctionService;
```

---

## 🎯 Notas Importantes para Claude Code

### Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Preview build
npm run preview

# Linting
npm run lint

# Tests
npm run test

# Generar dataset
cd training
python scripts/prepare_dataset.py

# Entrenar modelo
python scripts/train.py

# Exportar a ONNX
python scripts/export_onnx.py
```

### Debugging

- **IndexedDB**: Usar Chrome DevTools > Application > IndexedDB
- **Service Worker**: Chrome DevTools > Application > Service Workers
- **OpenCV**: Verificar que opencv.js esté cargado en Network tab
- **YOLO**: Verificar inferencia con console.time/timeEnd

### Optimizaciones

1. **Web Workers**: Mover inferencia de YOLO a Worker para no bloquear UI
2. **Lazy Loading**: Cargar OpenCV y ONNX solo cuando se necesiten
3. **Caching**: Cachear resultados de detección para imágenes repetidas
4. **Batch Processing**: Procesar múltiples hojas en paralelo

### Errores Comunes

1. **CORS con modelos ONNX**: Asegurar que estén en public/
2. **Memory leaks en OpenCV**: Siempre llamar `.delete()` en Mats
3. **IndexedDB quota**: Implementar limpieza de datos antiguos
4. **PWA no instala**: Verificar manifest.json y HTTPS

---

## 📚 Referencias

- [React Docs](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Dexie.js](https://dexie.org)
- [OpenCV.js Docs](https://docs.opencv.org/4.x/d5/d10/tutorial_js_root.html)
- [Ultralytics YOLOv11](https://docs.ultralytics.com)
- [ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/)
- [jsPDF Docs](https://github.com/parallax/jsPDF)

---

## ✅ Checklist de Desarrollo

### Semana 1
- [ ] Proyecto inicializado con Vite + React
- [ ] Tailwind CSS + shadcn/ui configurados
- [ ] IndexedDB con Dexie.js funcionando
- [ ] CRUD de preguntas completo
- [ ] Import/Export GIFT y ZIP
- [ ] PWA instalable

### Semana 2
- [ ] Builder de exámenes funcional
- [ ] Generación de PDFs (pruebas + hojas respuesta)
- [ ] Sistema de códigos únicos
- [ ] CRUD de estudiantes con validación RUT
- [ ] Pruebas diferenciadas funcionando

### Semana 3
- [ ] Dataset de 1500+ imágenes generado
- [ ] YOLOv11n entrenado (mAP50 > 0.90)
- [ ] Modelo exportado a ONNX
- [ ] Pipeline OpenCV de alineación
- [ ] Detección de marcas con YOLO
- [ ] Corrección automática end-to-end
- [ ] UI de corrección con preview

---

**¡Éxito con el desarrollo de Nexam!** 🚀
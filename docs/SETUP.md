# 📦 SETUP.md - Semana 1: Fundamentos y Arquitectura

> Guía detallada para configurar la base del proyecto Nexam

---

## 🎯 Objetivos de la Semana 1

- ✅ Proyecto Vite + React + Tailwind configurado
- ✅ IndexedDB schemas y servicios base
- ✅ CRUD de preguntas funcional
- ✅ Importación/exportación GIFT
- ✅ PWA instalable offline-first

---

## 📅 Día 1-2: Setup Inicial

### Tarea 1.1: Inicializar Proyecto

```bash
# Crear proyecto con Vite
npm create vite@latest nexam -- --template react
cd nexam
npm install
```

### Tarea 1.2: Instalar Dependencias

```bash
# Core dependencies
npm install react react-dom
npm install dexie dexie-react-hooks
npm install @tanstack/react-query
npm install jszip jspdf uuid

# Dev dependencies
npm install -D @vitejs/plugin-react vite
npm install -D typescript @types/react @types/react-dom
npm install -D eslint prettier
npm install -D vitest @testing-library/react
npm install -D tailwindcss postcss autoprefixer

# Inicializar Tailwind
npx tailwindcss init -p
```

### Tarea 1.3: Configurar Tailwind CSS

**tailwind.config.js**:

```javascript
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
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
    --primary: 199 89% 48%;
  }
  
  body {
    @apply bg-background text-foreground;
  }
}
```

### Tarea 1.4: shadcn/ui

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input card dialog dropdown-menu table tabs toast badge select
```

### Tarea 1.5: Estructura de Carpetas

```bash
mkdir -p src/{features,shared,core,locales,styles}
mkdir -p src/features/{questions,exams,correction,students,analytics}
mkdir -p src/shared/{components,services,utils,hooks,constants}
mkdir -p src/core/{storage,vision,export}

for feature in questions exams correction students analytics; do
  mkdir -p src/features/$feature/{components,hooks,services,types,styles}
done

mkdir -p src/locales/es
```

### Tarea 1.6: Configurar Vite

**vite.config.js**:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
```

---

## 📅 Día 3-4: Módulo de Banco de Preguntas

### Tarea 2.1: Configurar IndexedDB

**src/core/storage/db.js**:

```javascript
import Dexie from 'dexie';

export const db = new Dexie('NexamDB');

db.version(1).stores({
  questions: '++id, text, type, category, *tags, difficulty.manual, createdAt',
  exams: '++id, title, date, type, createdAt',
  students: '++id, rut, name, email',
  results: '++id, examId, studentId, score, date',
  settings: 'key'
});

db.questions.hook('creating', (primKey, obj) => {
  obj.createdAt = new Date();
  obj.updatedAt = new Date();
});

db.questions.hook('updating', (mods) => {
  mods.updatedAt = new Date();
});

export default db;
```

### Tarea 2.2: Servicio de Preguntas

**src/features/questions/services/questionsService.js**:

```javascript
import db from '../../../core/storage/db';
import { v4 as uuidv4 } from 'uuid';

export const questionsService = {
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

  async findById(id) {
    return await db.questions.get(id);
  },

  async findAll(filters = {}) {
    let query = db.questions;
    
    if (filters.category) {
      query = query.where('category').equals(filters.category);
    }
    
    if (filters.type) {
      query = query.where('type').equals(filters.type);
    }
    
    const questions = await query.toArray();
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return questions.filter(q => 
        q.text.toLowerCase().includes(searchLower)
      );
    }
    
    return questions;
  },

  async update(id, updates) {
    await db.questions.update(id, updates);
    return await db.questions.get(id);
  },

  async delete(id) {
    return await db.questions.delete(id);
  },

  async getCategories() {
    const questions = await db.questions.toArray();
    return [...new Set(questions.map(q => q.category).filter(Boolean))];
  },

  async getTags() {
    const questions = await db.questions.toArray();
    const allTags = questions.flatMap(q => q.tags || []);
    return [...new Set(allTags)];
  }
};

export default questionsService;
```

### Tarea 2.3: Custom Hook

**src/features/questions/hooks/useQuestions.js**:

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import questionsService from '../services/questionsService';

export function useQuestions(filters = {}) {
  const queryClient = useQueryClient();
  
  const questionsQuery = useQuery({
    queryKey: ['questions', filters],
    queryFn: () => questionsService.findAll(filters),
    staleTime: 5 * 60 * 1000,
  });
  
  const createMutation = useMutation({
    mutationFn: (data) => questionsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    }
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }) => questionsService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    }
  });
  
  const deleteMutation = useMutation({
    mutationFn: (id) => questionsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    }
  });
  
  return {
    questions: questionsQuery.data || [],
    isLoading: questionsQuery.isLoading,
    error: questionsQuery.error,
    createQuestion: createMutation.mutate,
    updateQuestion: updateMutation.mutate,
    deleteQuestion: deleteMutation.mutate,
  };
}

export default useQuestions;
```

### Tarea 2.4: Componentes UI

**src/features/questions/components/QuestionCard.jsx**:

```jsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Pencil, Trash2 } from 'lucide-react';

export function QuestionCard({ question, onEdit, onDelete }) {
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
          <CardTitle className="text-lg line-clamp-2">
            {question.text}
          </CardTitle>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">{getTypeLabel(question.type)}</Badge>
            {question.category && (
              <Badge variant="secondary">{question.category}</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(question)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(question.id)}>
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
                  alt.isCorrect ? 'bg-green-50' : 'bg-gray-50'
                }`}
              >
                {String.fromCharCode(65 + index)}) {alt.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default QuestionCard;
```

---

## 📅 Día 5-6: Import/Export

### Tarea 3.1: Parser GIFT

**src/core/export/giftParser.js**:

```javascript
export function exportToGIFT(questions) {
  let giftContent = '';
  
  questions.forEach(question => {
    giftContent += `// ${question.category || 'Sin categoría'}\n`;
    giftContent += `::${question.id}:: ${question.text} `;
    
    if (question.type === 'multiple') {
      giftContent += '{\n';
      question.alternatives.forEach(alt => {
        const prefix = alt.isCorrect ? '=' : '~';
        giftContent += `  ${prefix}${alt.text}\n`;
      });
      giftContent += '}\n\n';
    }
  });
  
  return giftContent;
}

export function importFromGIFT(giftContent) {
  const questions = [];
  const lines = giftContent.split('\n');
  
  let currentQuestion = null;
  let category = '';
  
  for (let line of lines) {
    line = line.trim();
    
    if (line.startsWith('// ')) {
      category = line.substring(3).trim();
      continue;
    }
    
    if (line.includes('::')) {
      if (currentQuestion) questions.push(currentQuestion);
      
      const parts = line.split('::');
      const text = parts[2].split('{')[0].trim();
      
      currentQuestion = {
        text,
        category,
        alternatives: [],
        type: 'multiple',
        difficulty: { manual: 'medium', automatic: 0 },
        tags: [],
      };
    }
    
    if (line.startsWith('=') || line.startsWith('~')) {
      const isCorrect = line.startsWith('=');
      const text = line.substring(1).trim();
      
      currentQuestion.alternatives.push({
        id: `alt_${currentQuestion.alternatives.length}`,
        text,
        isCorrect
      });
    }
  }
  
  if (currentQuestion) questions.push(currentQuestion);
  
  return questions;
}

export default { exportToGIFT, importFromGIFT };
```

### Tarea 3.2: Manejo de ZIP

**src/core/export/zipHandler.js**:

```javascript
import JSZip from 'jszip';

export async function exportToZIP(questions) {
  const zip = new JSZip();
  const imagesFolder = zip.folder('images');
  
  const questionsData = await Promise.all(
    questions.map(async (q) => {
      const qCopy = { ...q };
      
      if (q.image?.data) {
        const filename = `${q.id}.png`;
        imagesFolder.file(filename, q.image.data);
        qCopy.image = { filename, alt: q.image.alt };
      }
      
      return qCopy;
    })
  );
  
  zip.file('questions.json', JSON.stringify(questionsData, null, 2));
  return await zip.generateAsync({ type: 'blob' });
}

export async function importFromZIP(zipFile) {
  const zip = await JSZip.loadAsync(zipFile);
  
  const jsonFile = zip.file('questions.json');
  if (!jsonFile) throw new Error('questions.json no encontrado');
  
  const jsonContent = await jsonFile.async('string');
  const questionsData = JSON.parse(jsonContent);
  
  const questions = await Promise.all(
    questionsData.map(async (q) => {
      if (q.image?.filename) {
        const imageFile = zip.file(`images/${q.image.filename}`);
        if (imageFile) {
          const blob = await imageFile.async('blob');
          q.image = { data: blob, alt: q.image.alt };
        }
      }
      return q;
    })
  );
  
  return questions;
}

export default { exportToZIP, importFromZIP };
```

---

## 📅 Día 7: PWA Setup

### Tarea 4.1: Configurar Vite PWA

```bash
npm install -D vite-plugin-pwa
```

**vite.config.js actualizado**:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Tarea 4.2: App Principal

**src/App.jsx**:

```jsx
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QuestionList } from './features/questions/components/QuestionList';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4">
            <h1 className="text-3xl font-bold">Nexam</h1>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto py-6 px-4">
          <QuestionList 
            onCreate={() => {}}
            onEdit={(q) => console.log(q)}
          />
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
```

---

## ✅ Checklist Semana 1

- [ ] Proyecto inicializado
- [ ] Tailwind + shadcn/ui
- [ ] IndexedDB funcionando
- [ ] CRUD preguntas
- [ ] Parser GIFT
- [ ] Manejo ZIP
- [ ] PWA instalable

---

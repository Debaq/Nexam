# 🔧 Fix: Sistema de Gabarito Implementado

## ❌ Problema Detectado

El `correctionService` no tenía de dónde obtener las **respuestas correctas** para comparar con las respuestas detectadas por el sistema de visión.

### Error Original:
```javascript
// ❌ INCORRECTO
const questions = exam.questionSnapshots || [];
// Intentaba obtener respuestas correctas de questionSnapshots
// pero estos pueden tener alternativas en orden aleatorizado
```

**Problema**: No se respetaba la aleatorización individual de cada estudiante.

---

## ✅ Solución Implementada

### 1. Generación Automática de Gabarito al Finalizar Examen

**Archivo**: `src/features/exams/services/examService.js`

Se agregó el método `_generateAnswerKey()` que extrae las respuestas correctas **DESPUÉS** de aplicar aleatorización:

```javascript
_generateAnswerKey(questions) {
  return questions.map((q, index) => {
    if (q.type === 'multiple') {
      const correctIndex = q.alternatives.findIndex(alt => alt.isCorrect);
      const correctLetter = String.fromCharCode(65 + correctIndex);

      return {
        question: index + 1,
        questionId: q.id,
        type: 'multiple',
        correctAnswer: correctLetter,  // A, B, C, D, E
        correctIndex: correctIndex
      };
    }
    // ... tipos boolean, matching, development
  });
}
```

### 2. Guardado del Gabarito en finalizedVersions

**Examen diferenciado:**
```javascript
{
  type: 'differentiated',
  versions: {
    'student-1': { code: 'ABCD', questions: [...] },
    'student-2': { code: 'EFGH', questions: [...] }
  },
  answerKeys: {                           // ← NUEVO
    'student-1': [...],  // Gabarito estudiante 1
    'student-2': [...]   // Gabarito estudiante 2
  }
}
```

**Examen uniforme:**
```javascript
{
  type: 'uniform',
  version: { questions: [...] },
  answerKey: [...]                        // ← NUEVO: Gabarito único
}
```

### 3. Corrección con Gabarito Correcto

**Archivo**: `src/features/correction/services/correctionService.js`

Se agregó `getAnswerKeyForStudent()`:

```javascript
getAnswerKeyForStudent(exam, studentId) {
  if (!exam.finalizedVersions) {
    throw new Error('El examen no tiene gabarito. Debe estar finalizado.');
  }

  if (exam.finalizedVersions.type === 'differentiated') {
    // Cada estudiante tiene su gabarito
    return exam.finalizedVersions.answerKeys[studentId];
  } else {
    // Gabarito único para todos
    return exam.finalizedVersions.answerKey;
  }
}
```

Se modificó `calculateScore()`:

```javascript
// ✅ CORRECTO
calculateScore(answers, exam, studentId = null) {
  // Obtener gabarito correcto
  const answerKey = studentId
    ? this.getAnswerKeyForStudent(exam, studentId)
    : exam.finalizedVersions?.answerKey;

  // Comparar respuestas con gabarito
  answers.forEach(answer => {
    const correctAnswer = answerKey.find(ak => ak.question === answer.question);

    if (answer.selected === correctAnswer.correctAnswer) {
      correctCount++;
    }
  });

  // ...
}
```

---

## 📊 Estructura del Gabarito

```javascript
[
  {
    question: 1,              // Número de pregunta (1-indexed)
    questionId: 'uuid',       // ID original de la pregunta
    type: 'multiple',         // Tipo
    correctAnswer: 'B',       // ← LETRA de respuesta correcta
    correctIndex: 1,          // Índice en array (0-indexed)
    allAlternatives: [        // Todas las alternativas (orden final)
      { letter: 'A', text: '...', isCorrect: false },
      { letter: 'B', text: '...', isCorrect: true },
      { letter: 'C', text: '...', isCorrect: false },
      { letter: 'D', text: '...', isCorrect: false }
    ]
  },
  {
    question: 2,
    type: 'boolean',
    correctAnswer: 'V',       // V o F
    correctIndex: 0
  },
  {
    question: 3,
    type: 'development',
    correctAnswer: null,      // Requiere corrección manual
    points: 5
  }
]
```

---

## 🔄 Flujo Completo

```
1. CREAR EXAMEN
   └─ Usuario crea examen con preguntas
   └─ Configura aleatorización (opcional)

2. FINALIZAR EXAMEN (examService.finalize)
   ├─ Crear snapshot de preguntas
   ├─ Aplicar aleatorización
   │  ├─ Si diferenciado: una versión por estudiante
   │  └─ Si uniforme: una versión para todos
   └─ Generar gabarito (DESPUÉS de aleatorización)
      ├─ answerKeys[studentId] para diferenciado
      └─ answerKey único para uniforme

3. IMPRIMIR HOJAS
   └─ Hojas con orden aleatorizado (si aplica)

4. CORRECCIÓN AUTOMÁTICA (correctionService)
   ├─ Detectar RUT → Identificar estudiante
   ├─ Detectar respuestas marcadas
   ├─ Obtener gabarito correcto:
   │  └─ getAnswerKeyForStudent(exam, studentId)
   ├─ Comparar respuestas con gabarito
   └─ Calcular puntaje y nota
```

---

## 🎯 Ventajas

✅ **Corrección precisa** en exámenes aleatorizados
✅ **Gabarito inmutable** guardado con el examen
✅ **Trazabilidad completa** de respuestas correctas
✅ **Soporte múltiples versiones** (diferenciado)
✅ **Manejo de errores** si falta gabarito

---

## 🆕 Mejoras en UI

### Sidebar actualizado
- "Corrección Automática" → "Corrección Automática con IA"
- Badge "IA" agregado
- Descripción: "Corrección con IA (requiere examen finalizado)"

### CorrectionPage mejorado
Se agregó info card explicando:
1. Finalizar examen para generar gabarito
2. Imprimir hojas de respuesta
3. Escanear hojas respondidas
4. Subir PDF para corrección automática

---

## 🧪 Testing

### Verificar gabarito generado:

```javascript
import { db } from '@/core/storage/db';

const exam = await db.exams.get('exam-id');
console.log('Gabarito:', exam.finalizedVersions);

// Examen diferenciado
console.log('Gabarito estudiante 1:', exam.finalizedVersions.answerKeys['student-1']);

// Examen uniforme
console.log('Gabarito único:', exam.finalizedVersions.answerKey);
```

### Probar corrección:

```javascript
import correctionService from '@/features/correction/services/correctionService';

const exam = await db.exams.get('exam-id');
const answers = [
  { question: 1, selected: 'B', confidence: 0.95 },
  { question: 2, selected: 'A', confidence: 0.88 }
];

const scoring = correctionService.calculateScore(answers, exam, 'student-id');
console.log('Puntaje:', scoring);
// { score: 2, total: 30, percentage: 6.7, grade: 2.1 }
```

---

## 📝 Archivos Modificados

1. `src/features/exams/services/examService.js`
   - Agregado: `_generateAnswerKey()`
   - Modificado: `_generateFinalVersions()` para incluir gabaritos

2. `src/features/correction/services/correctionService.js`
   - Agregado: `getAnswerKeyForStudent()`
   - Modificado: `calculateScore()` para usar gabarito correcto

3. `src/shared/components/Layout/Sidebar.jsx`
   - Actualizado item "Corrección" con badge IA
   - Mejorada descripción

4. `src/features/correction/components/CorrectionPage.jsx`
   - Agregado info card con instrucciones

5. `CORRECTION_SYSTEM.md`
   - Agregada sección "Gabarito"
   - Actualizado pipeline

---

## ✅ Estado

**✅ FIX COMPLETADO**

El sistema ahora:
- ✅ Genera gabarito automáticamente al finalizar examen
- ✅ Guarda gabarito correcto por versión/estudiante
- ✅ Compara respuestas con gabarito apropiado
- ✅ Maneja errores si falta gabarito
- ✅ UI mejorada con instrucciones claras

**Próximo paso:** Entrenar modelo YOLO y calibrar coordenadas con hojas reales.

---

**🎉 Sistema de corrección automática con gabarito funcional!**

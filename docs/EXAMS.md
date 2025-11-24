# 📝 EXAMS.md - Semana 2: Generación de Evaluaciones

> Guía detallada para implementar el sistema de generación de evaluaciones

---

## 🎯 Objetivos de la Semana 2

- ✅ Builder de exámenes con configuración flexible
- ✅ Generación de PDFs (pruebas + hojas respuesta)
- ✅ Sistema de códigos únicos (4 letras)
- ✅ CRUD estudiantes con validación RUT
- ✅ Aleatorización configurable

---

## 📅 Día 1-2: Módulo de Exámenes

### Tarea 5.1: Servicio de Exámenes

**src/features/exams/services/examService.js**:

```javascript
import db from '../../../core/storage/db';
import { v4 as uuidv4 } from 'uuid';

function generateUniqueCode(existingCodes) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code;
  do {
    code = Array.from({ length: 4 }, () => 
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  } while (existingCodes.has(code));
  return code;
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const examService = {
  async create(examConfig) {
    const exam = {
      id: uuidv4(),
      ...examConfig,
      codes: {},
      createdAt: new Date()
    };
    
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

  async findById(id) {
    return await db.exams.get(id);
  },

  async generateExamVersion(examId, studentId) {
    const exam = await db.exams.get(examId);
    const questions = await Promise.all(
      exam.questions.map(qId => db.questions.get(qId))
    );
    
    let finalQuestions = questions;
    
    if (exam.randomization.shuffleQuestions) {
      finalQuestions = shuffleArray(finalQuestions);
    }
    
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
      studentId,
      code: exam.codes[studentId] || null,
      title: exam.title,
      date: exam.date,
      duration: exam.duration,
      questions: finalQuestions
    };
  },

  async findAll() {
    return await db.exams.toArray();
  },

  async delete(id) {
    return await db.exams.delete(id);
  }
};

export default examService;
```

---

## 📅 Día 3-4: Generación de PDFs

### Tarea 6.1: Generador de PDFs

**src/features/exams/services/pdfGenerator.js**:

```javascript
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function drawAlignmentMarkers(doc, pageWidth, pageHeight) {
  const markerSize = 10;
  const offset = 5;
  
  // Círculos en las 4 esquinas
  doc.circle(offset + markerSize/2, offset + markerSize/2, markerSize/2, 'F');
  doc.circle(pageWidth - offset - markerSize/2, offset + markerSize/2, markerSize/2, 'F');
  doc.circle(offset + markerSize/2, pageHeight - offset - markerSize/2, markerSize/2, 'F');
  doc.circle(pageWidth - offset - markerSize/2, pageHeight - offset - markerSize/2, markerSize/2, 'F');
}

export function generateExamSheet(examVersion) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
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
  
  // Datos estudiante
  doc.setFontSize(10);
  doc.text('Nombre: _______________________________________', 20, 45);
  doc.text('RUT: ___________________', 20, 52);
  
  // Preguntas
  let yPosition = 65;
  
  examVersion.questions.forEach((question, index) => {
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
      drawAlignmentMarkers(doc, pageWidth, pageHeight);
    }
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(`${index + 1}.`, 20, yPosition);
    
    doc.setFont(undefined, 'normal');
    const questionLines = doc.splitTextToSize(question.text, pageWidth - 50);
    doc.text(questionLines, 28, yPosition);
    yPosition += questionLines.length * 5 + 3;
    
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
      doc.text('_____________________________________________________', 30, yPosition);
      yPosition += 7;
      doc.text('_____________________________________________________', 30, yPosition);
      yPosition += 7;
    }
    
    yPosition += 8;
  });
  
  return doc;
}

export function generateAnswerSheet(examVersion) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  drawAlignmentMarkers(doc, pageWidth, pageHeight);
  
  doc.setFontSize(14);
  doc.text('HOJA DE RESPUESTAS', pageWidth / 2, 20, { align: 'center' });
  
  if (examVersion.code) {
    doc.setFontSize(12);
    doc.text(`Código Prueba: ${examVersion.code}`, 20, 30);
    
    // Cuadros para verificar código
    doc.text('Verificar código:', pageWidth - 80, 30);
    for (let i = 0; i < 4; i++) {
      doc.rect(pageWidth - 70 + (i * 10), 32, 8, 8);
    }
  }
  
  doc.setFontSize(10);
  doc.text('Nombre: _______________________________________', 20, 40);
  doc.text('RUT: ___________________', 20, 47);
  
  doc.setFontSize(9);
  doc.text('Instrucciones: Marque con X, círculo o raya', 20, 57);
  
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
    }
  });
  
  return doc;
}

export default { generateExamSheet, generateAnswerSheet };
```

---

## 📅 Día 5-6: Gestión de Estudiantes

### Tarea 7.1: Servicio de Estudiantes

**src/features/students/services/studentsService.js**:

```javascript
import db from '../../../core/storage/db';
import { v4 as uuidv4 } from 'uuid';

function validateRUT(rut) {
  rut = rut.replace(/\./g, '').replace(/-/g, '');
  
  if (rut.length < 2) return false;
  
  const body = rut.slice(0, -1);
  const dv = rut.slice(-1).toUpperCase();
  
  if (!/^\d+$/.test(body)) return false;
  
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

function formatRUT(rut) {
  rut = rut.replace(/\./g, '').replace(/-/g, '');
  const body = rut.slice(0, -1);
  const dv = rut.slice(-1);
  
  return body.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv;
}

export const studentsService = {
  async create(studentData) {
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

  async importFromCSV(csvContent) {
    const lines = csvContent.split('\n').filter(line => line.trim());
    const students = [];
    
    // Formato: rut,nombre,email
    for (let i = 1; i < lines.length; i++) {
      const [rut, name, email] = lines[i].split(',').map(s => s.trim());
      
      if (rut && name) {
        try {
          const student = await this.create({ rut, name, email });
          students.push(student);
        } catch (error) {
          console.error(`Error importando ${name}:`, error);
        }
      }
    }
    
    return students;
  },

  async findAll() {
    return await db.students.toArray();
  },

  async findByRUT(rut) {
    const formattedRUT = formatRUT(rut);
    return await db.students.where('rut').equals(formattedRUT).first();
  },

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

  async delete(id) {
    return await db.students.delete(id);
  }
};

export default studentsService;
```

---

## ✅ Checklist Semana 2

- [ ] Servicio de exámenes
- [ ] Generador de códigos únicos
- [ ] Aleatorización (preguntas/alternativas)
- [ ] PDFs de pruebas
- [ ] PDFs de hojas respuesta
- [ ] CRUD estudiantes
- [ ] Validación RUT chileno
- [ ] Import CSV estudiantes

---

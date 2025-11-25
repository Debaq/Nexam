/**
 * Servicio para generar hojas de respuesta con respuestas correctas marcadas
 * para revisión manual en caso de fallos del sistema
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Dibuja marcadores QR simplificados en las esquinas para alineación con OpenCV
 * Formato: cuadrado negro con borde blanco (similar a QR code finder patterns)
 */
function drawAlignmentMarkers(doc, pageWidth, pageHeight) {
  const markerSize = 15; // Tamaño del marcador
  const offset = 10; // Offset desde el borde

  // Estilo de marcadores QR simplificados (cuadrados concéntricos)
  const drawQRMarker = (x, y) => {
    // Cuadrado exterior negro
    doc.setFillColor(0, 0, 0);
    doc.rect(x, y, markerSize, markerSize, 'F');

    // Cuadrado interior blanco
    doc.setFillColor(255, 255, 255);
    doc.rect(x + 3, y + 3, markerSize - 6, markerSize - 6, 'F');

    // Cuadrado central negro
    doc.setFillColor(0, 0, 0);
    doc.rect(x + 5, y + 5, markerSize - 10, markerSize - 10, 'F');
  };

  // Marcadores en las 4 esquinas
  drawQRMarker(offset, offset); // Superior izquierda
  drawQRMarker(pageWidth - offset - markerSize, offset); // Superior derecha
  drawQRMarker(offset, pageHeight - offset - markerSize); // Inferior izquierda
  // NO ponemos en la esquina inferior derecha para no interferir con el contenido
}

/**
 * Limpia y normaliza texto para evitar problemas de codificación en PDF
 * Reemplaza caracteres problemáticos por alternativas compatibles
 */
function cleanText(text) {
  if (!text) return '';
  return String(text)
    .replace(/→/g, '->')  // Flecha a guión-mayor
    .replace(/←/g, '<-')
    .replace(/↑/g, '^')
    .replace(/↓/g, 'v')
    .replace(/•/g, '*')   // Bullets
    .replace(/–/g, '-')   // En-dash
    .replace(/—/g, '--')  // Em-dash
    .replace(/"/g, '"')   // Comillas tipográficas
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/'/g, "'")
    .replace(/…/g, '...') // Elipsis
    .trim();
}

/**
 * Generar hoja de respuesta con respuestas correctas marcadas
 * @param {Object} examVersion - Versión específica del examen
 * @param {Array} questionsWithCorrectAnswers - Preguntas con respuestas correctas
 * @returns {jsPDF} Documento PDF con la hoja de respuesta marcada
 */
export function generateMarkedAnswerSheet(examVersion, questionsWithCorrectAnswers) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  drawAlignmentMarkers(doc, pageWidth, pageHeight);

  // Título
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('HOJA DE RESPUESTAS - PAUTA', pageWidth / 2, 35, { align: 'center' });

  doc.setFont(undefined, 'normal');
  doc.setFontSize(11);
  const title = cleanText(examVersion.examTitle || examVersion.title || 'Examen');
  doc.text(title, pageWidth / 2, 42, { align: 'center' });

  // Código de prueba (si existe)
  if (examVersion.code) {
    doc.setFontSize(12);
    doc.text(`Codigo Prueba: ${examVersion.code}`, 20, 52);

    // Cuadros para verificar código manualmente
    doc.setFontSize(9);
    doc.text('Verificar codigo:', pageWidth - 80, 50);
    for (let i = 0; i < 4; i++) {
      doc.rect(pageWidth - 70 + (i * 10), 52, 8, 8);
    }
  }

  // Calcular puntaje total del examen
  const totalQuestions = examVersion.questions.length;
  const pointsPerQuestion = examVersion.pointsPerQuestion || 1;
  const totalPoints = totalQuestions * pointsPerQuestion;

  // Datos del estudiante (con ejemplo)
  doc.setFontSize(10);
  const nameY = examVersion.code ? 60 : 50;
  doc.text('Nombre: [Ejemplo para revisión]', 20, nameY);

  // RUT con 8 cuadros-1 cuadro (con ejemplo)
  doc.text('RUT:', 20, nameY + 6);
  const rutStartX = 35;
  const boxSize = 5;
  const boxGap = 1;

  // Dibujar 8 cuadros para el RUT con ejemplo
  const exampleRut = '12345678';
  for (let i = 0; i < 8; i++) {
    const x = rutStartX + (i * (boxSize + boxGap));
    doc.rect(x, nameY + 3, boxSize, boxSize);
    doc.setFontSize(8);
    doc.text(exampleRut[i], x + 1.5, nameY + 6.5);
  }
  doc.setFontSize(10);

  // Dibujar guión
  doc.text('-', rutStartX + (8 * (boxSize + boxGap)) + 1, nameY + 6);

  // Dibujar 1 cuadro para dígito verificador con ejemplo
  const verifierX = rutStartX + (8 * (boxSize + boxGap)) + 4;
  doc.rect(verifierX, nameY + 3, boxSize, boxSize);
  doc.setFontSize(8);
  doc.text('9', verifierX + 1.5, nameY + 6.5);
  doc.setFontSize(10);

  // Campos de Puntaje y Nota - alineados verticalmente con Nombre y RUT
  doc.text(`Puntaje: ___/${totalPoints} ptos.`, pageWidth - 80, nameY);
  doc.text('Nota: ___', pageWidth - 80, nameY + 6);

  // Instrucciones
  doc.setFontSize(9);
  doc.text('Pauta de corrección - Respaldo para revisión manual', 20, nameY + 15);

  // Calcular máximo de alternativas
  const maxAlternatives = Math.max(
    ...examVersion.questions
      .filter(q => q.type === 'multiple' || q.type === 'boolean')
      .map(q => q.type === 'boolean' ? 2 : q.alternatives.length),
    4
  );

  // Determinar número de columnas según cantidad de preguntas
  const questionsPerColumn = Math.ceil(totalQuestions / 2);

  const tableStartY = nameY + 20;

  // Crear tabla con 2 columnas de preguntas
  const createTableColumn = (startIdx, endIdx) => {
    const columnData = [];

    for (let i = startIdx; i < Math.min(endIdx, totalQuestions); i++) {
      const question = examVersion.questions[i];
      const questionWithCorrectAnswers = questionsWithCorrectAnswers[i];
      const row = [`${i + 1}`];

      if (question.type === 'multiple') {
        for (let j = 0; j < maxAlternatives; j++) {
          if (j < question.alternatives.length) {
            // Determinar si esta alternativa es correcta
            const altId = question.alternatives[j].id;
            const isCorrect = questionWithCorrectAnswers.correctAlternatives.includes(altId);
            // Mostrar la letra y marcar como correcta en la pauta
            const cellText = isCorrect ? `${String.fromCharCode(65 + j)}✓` : String.fromCharCode(65 + j);
            row.push(cellText);
          } else {
            row.push('///'); // Marcador para achurar
          }
        }
      } else if (question.type === 'boolean') {
        // En las preguntas booleanas, marcar V o F como correctos
        const correctAltIds = questionWithCorrectAnswers.correctAlternatives;
        const isTrueCorrect = correctAltIds.includes('true') || correctAltIds.includes('verdadero') || correctAltIds.includes('1');
        const isFalseCorrect = correctAltIds.includes('false') || correctAltIds.includes('falso') || correctAltIds.includes('0');
        
        row.push(isTrueCorrect ? 'V✓' : 'V');
        row.push(isFalseCorrect ? 'F✓' : 'F');
        for (let j = 2; j < maxAlternatives; j++) {
          row.push('///');
        }
      } else if (question.type === 'development') {
        row.push('DESARROLLO');
        for (let j = 1; j < maxAlternatives; j++) {
          row.push('///');
        }
      }

      columnData.push(row);
    }

    return columnData;
  };

  // Headers
  const headers = ['No'];
  for (let i = 0; i < maxAlternatives; i++) {
    headers.push(String.fromCharCode(65 + i));
  }

  // Primera columna (izquierda)
  const leftColumnData = createTableColumn(0, questionsPerColumn);

  // Calcular ancho de celdas de alternativas (2/3 del tamaño normal)
  const availableWidth = (pageWidth / 2) - 8 - 3 - 6;
  const normalCellWidth = availableWidth / maxAlternatives;
  const alternativeCellWidth = normalCellWidth * (2/3);

  const alternativeColumnStyles = {};
  for (let i = 1; i <= maxAlternatives; i++) {
    alternativeColumnStyles[i] = { cellWidth: alternativeCellWidth };
  }

  // Calcular ancho real de la tabla
  const tableWidth = 6 + (alternativeCellWidth * maxAlternatives);
  const gapBetweenTables = 6;

  // Calcular márgenes para centrar las tablas juntas
  const totalTablesWidth = tableWidth * 2 + gapBetweenTables;
  const leftMarginFirstTable = (pageWidth - totalTablesWidth) / 2;
  const leftMarginSecondTable = leftMarginFirstTable + tableWidth + gapBetweenTables;

  // Array para almacenar las posiciones Y de cada fila
  const leftRowPositions = [];

  autoTable(doc, {
    startY: tableStartY,
    head: [headers],
    body: leftColumnData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 1,
      halign: 'center',
      valign: 'middle',
      lineColor: [0, 0, 0],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [220, 220, 220],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 8
    },
    columnStyles: {
      0: { cellWidth: 6, fontStyle: 'bold', fillColor: [245, 245, 245] },
      ...alternativeColumnStyles
    },
    margin: { left: leftMarginFirstTable },
    tableWidth: tableWidth,
    didDrawCell: (data) => {
      // Guardar posiciones Y de las filas del body
      if (data.section === 'body' && data.column.index === 0) {
        const centerY = data.cell.y + (data.cell.height / 2);
        leftRowPositions.push(centerY);
      }

      // Achurar celdas con /// y resaltar respuestas correctas
      if (data.section === 'body') {
        const cellValue = data.cell.raw;
        if (cellValue === '///') {
          const { x, y, width, height } = data.cell;
          doc.setDrawColor(180, 180, 180);
          doc.line(x, y, x + width, y + height);
          doc.line(x + width, y, x, y + height);
        } else if (cellValue.includes('✓')) {
          // Resaltar celda con respuesta correcta
          const { x, y, width, height } = data.cell;
          doc.setFillColor(200, 255, 200); // Fondo verde claro
          doc.rect(x, y, width, height, 'F');
        }
      }
    }
  });

  // Guardar información de la primera tabla para los marcadores
  const leftTableInfo = {
    startX: leftMarginFirstTable,
    endX: leftMarginFirstTable + tableWidth,
    startY: tableStartY,
    endY: doc.lastAutoTable.finalY,
    rowPositions: leftRowPositions
  };

  // Segunda columna (derecha) - solo si hay más preguntas
  let rightTableInfo = null;
  if (totalQuestions > questionsPerColumn) {
    const rightColumnData = createTableColumn(questionsPerColumn, totalQuestions);
    const rightRowPositions = [];

    autoTable(doc, {
      startY: tableStartY,
      head: [headers],
      body: rightColumnData,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 1,
        halign: 'center',
        valign: 'middle',
        lineColor: [0, 0, 0],
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 8
      },
      columnStyles: {
        0: { cellWidth: 6, fontStyle: 'bold', fillColor: [245, 245, 245] },
        ...alternativeColumnStyles
      },
      margin: { left: leftMarginSecondTable },
      tableWidth: tableWidth,
      didDrawCell: (data) => {
        // Guardar posiciones Y de las filas del body
        if (data.section === 'body' && data.column.index === 0) {
          const centerY = data.cell.y + (data.cell.height / 2);
          rightRowPositions.push(centerY);
        }

        // Achurar celdas con /// y resaltar respuestas correctas
        if (data.section === 'body') {
          const cellValue = data.cell.raw;
          if (cellValue === '///') {
            const { x, y, width, height } = data.cell;
            doc.setDrawColor(180, 180, 180);
            doc.line(x, y, x + width, y + height);
            doc.line(x + width, y, x, y + height);
          } else if (cellValue.includes('✓')) {
            // Resaltar celda con respuesta correcta
            const { x, y, width, height } = data.cell;
            doc.setFillColor(200, 255, 200); // Fondo verde claro
            doc.rect(x, y, width, height, 'F');
          }
        }
      }
    });

    // Guardar información de la segunda tabla
    rightTableInfo = {
      startX: leftMarginSecondTable,
      endX: leftMarginSecondTable + tableWidth,
      startY: tableStartY,
      endY: doc.lastAutoTable.finalY,
      rowPositions: rightRowPositions
    };
  }

  // Marcadores laterales pequeños para detección de filas
  // CRÍTICO: Alineados exactamente con el centro de cada fila
  doc.setFillColor(0, 0, 0);
  const markerSize = 3;
  const markerOffset = 2;

  // Marcadores para tabla izquierda - alineados con cada fila
  leftTableInfo.rowPositions.forEach(centerY => {
    const markerY = centerY - (markerSize / 2);
    doc.rect(leftTableInfo.startX - markerOffset - markerSize, markerY, markerSize, markerSize, 'F');
  });

  // Marcadores para tabla derecha (si existe)
  if (rightTableInfo) {
    rightTableInfo.rowPositions.forEach(centerY => {
      const markerY = centerY - (markerSize / 2);
      doc.rect(rightTableInfo.endX + markerOffset, markerY, markerSize, markerSize, 'F');
    });
  } else {
    // Si solo hay una tabla, poner marcadores también a la derecha
    leftTableInfo.rowPositions.forEach(centerY => {
      const markerY = centerY - (markerSize / 2);
      doc.rect(leftTableInfo.endX + markerOffset, markerY, markerSize, markerSize, 'F');
    });
  }

  // Agregar pie de página con información adicional
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.text('Pauta de respuestas correctas - Para revisión manual en caso de fallos del sistema', 
           20, pageHeight - 20);
  doc.text(`Generado: ${new Date().toLocaleString('es-CL')}`, 
           pageWidth - 80, pageHeight - 20);

  return doc;
}

/**
 * Generar hoja de examen con respuestas correctas resaltadas para revisión manual
 * @param {Object} examVersion - Versión específica del examen
 * @param {Array} questionsWithCorrectAnswers - Preguntas con respuestas correctas
 * @returns {jsPDF} Documento PDF con el examen marcado
 */
export function generateMarkedExamSheet(examVersion, questionsWithCorrectAnswers) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Encabezado
  doc.setFontSize(16);
  const title = cleanText(examVersion.examTitle || examVersion.title || 'Examen');
  doc.text(title, pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  const date = examVersion.date instanceof Date ? examVersion.date : new Date(examVersion.date);
  doc.text(`Fecha: ${date.toLocaleDateString('es-CL')}`, 20, 35);
  if (examVersion.duration) {
    doc.text(`Duracion: ${examVersion.duration} minutos`, 20, 40);
  }

  if (examVersion.code) {
    doc.setFontSize(12);
    doc.text(`Codigo: ${examVersion.code}`, pageWidth - 50, 35);
  }

  // Datos estudiante
  doc.setFontSize(10);
  doc.text('Nombre: _______________________________________', 20, 50);

  // RUT con 8 cuadros-1 cuadro
  doc.text('RUT:', 20, 57);
  const rutStartX = 35;
  const boxSize = 5;
  const boxGap = 1;

  // Dibujar 8 cuadros para el RUT
  for (let i = 0; i < 8; i++) {
    doc.rect(rutStartX + (i * (boxSize + boxGap)), 54, boxSize, boxSize);
  }

  // Dibujar guión
  doc.text('-', rutStartX + (8 * (boxSize + boxGap)) + 1, 57);

  // Dibujar 1 cuadro para dígito verificador
  doc.rect(rutStartX + (8 * (boxSize + boxGap)) + 4, 54, boxSize, boxSize);

  // Preguntas
  let yPosition = 70;

  examVersion.questions.forEach((question, index) => {
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 35;
    }

    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(`${index + 1}.`, 20, yPosition);

    // Obtener la información de respuestas correctas para esta pregunta
    const questionWithCorrectAnswers = questionsWithCorrectAnswers[index];

    // Resaltar pregunta si es desarrollo
    if (question.type === 'development') {
      doc.setFillColor(245, 245, 245);
      doc.rect(28, yPosition - 8, pageWidth - 56, 15, 'F');
    }

    doc.setFont(undefined, 'normal');
    const questionText = cleanText(question.text);
    const questionLines = doc.splitTextToSize(questionText, pageWidth - 50);
    doc.text(questionLines, 28, yPosition);
    yPosition += questionLines.length * 5 + 3;

    if (question.type === 'multiple') {
      question.alternatives.forEach((alt, altIndex) => {
        const letter = String.fromCharCode(65 + altIndex);
        const altId = alt.id;
        const isCorrect = questionWithCorrectAnswers.correctAlternatives.includes(altId);
        
        // Resaltar alternativa correcta
        if (isCorrect) {
          doc.setFillColor(240, 255, 240);
          doc.rect(29, yPosition - 5, pageWidth - 60, 7, 'F');
        }

        const altText = cleanText(alt.text);
        const altLines = doc.splitTextToSize(altText, pageWidth - 60);
        doc.text(`${letter})`, 30, yPosition);
        doc.text(altLines, 38, yPosition);
        yPosition += altLines.length * 5 + 2;
      });
    } else if (question.type === 'boolean') {
      // Verificar cuál es la respuesta correcta
      const correctAltIds = questionWithCorrectAnswers.correctAlternatives;
      const isTrueCorrect = correctAltIds.includes('true') || correctAltIds.includes('verdadero') || correctAltIds.includes('1');
      const isFalseCorrect = correctAltIds.includes('false') || correctAltIds.includes('falso') || correctAltIds.includes('0');

      // Resaltar la alternativa correcta
      if (isTrueCorrect) {
        doc.setFillColor(240, 255, 240);
        doc.rect(29, yPosition - 5, pageWidth - 60 - 20, 7, 'F');
      }
      doc.text('( ) Verdadero', 30, yPosition);
      yPosition += 7;

      if (isFalseCorrect) {
        doc.setFillColor(240, 255, 240);
        doc.rect(29, yPosition - 5, pageWidth - 60 - 20, 7, 'F');
      }
      doc.text('( ) Falso', 30, yPosition);
      yPosition += 7;
    } else if (question.type === 'development') {
      doc.text('Responda acá:', 30, yPosition);
      yPosition += 7;
      doc.text('_____________________________________________________', 30, yPosition);
      yPosition += 7;
      doc.text('_____________________________________________________', 30, yPosition);
      yPosition += 7;
    }

    yPosition += 8;
  });

  // Agregar encabezado de pauta
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(200, 0, 0);
  doc.text('PAUTA DE CORRECCIÓN - Para revisión manual', pageWidth / 2, 25, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  return doc;
}
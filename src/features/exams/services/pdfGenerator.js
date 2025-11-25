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
 * Dibuja marca de agua "BORRADOR" en diagonal en toda la página
 * @param {jsPDF} doc - Documento jsPDF
 */
function drawDraftWatermark(doc) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Guardar estado actual
  doc.saveGraphicsState();

  // Configurar texto de marca de agua
  doc.setTextColor(220, 220, 220); // Gris muy claro
  doc.setFontSize(80);
  doc.setFont(undefined, 'bold');

  // Calcular centro y rotación
  const centerX = pageWidth / 2;
  const centerY = pageHeight / 2;
  const angle = -45; // 45 grados en sentido antihorario

  // Rotar y dibujar
  doc.text('BORRADOR', centerX, centerY, {
    align: 'center',
    angle: angle,
    baseline: 'middle',
    renderingMode: 'stroke',
    lineWidth: 0.3
  });

  // Restaurar estado
  doc.restoreGraphicsState();
}

export function generateExamSheet(examVersion, isDraft = true) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Dibujar marca de agua BORRADOR si es un draft
  if (isDraft) {
    drawDraftWatermark(doc);
  }

  // NO dibujamos marcadores en el examen, solo en la hoja de respuestas

  // Encabezado
  doc.setFontSize(14); // Era 16, ahora 14
  const title = cleanText(examVersion.examTitle || examVersion.title || 'Examen');
  doc.text(title, pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(8); // Era 10, ahora 8
  const date = examVersion.date instanceof Date ? examVersion.date : new Date(examVersion.date);
  doc.text(`Fecha: ${date.toLocaleDateString('es-CL')}`, 20, 35);

  let infoY = 40;
  if (examVersion.duration) {
    doc.text(`Duracion: ${examVersion.duration} minutos`, 20, infoY);
    infoY += 5;
  }

  // Porcentaje de exigencia
  if (examVersion.grading?.demandPercentage) {
    doc.text(`Exigencia: ${examVersion.grading.demandPercentage}%`, 20, infoY);
  }

  if (examVersion.code) {
    doc.setFontSize(10); // Era 12, ahora 10
    doc.text(`Codigo: ${examVersion.code}`, pageWidth - 50, 35);
  }

  // Datos estudiante
  doc.setFontSize(8); // Era 10, ahora 8
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

  // Instrucciones (si están habilitadas)
  let yPosition = 65;
  if (examVersion.pdfOptions?.showInstructions && examVersion.pdfOptions?.instructions) {
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('Instrucciones:', 20, yPosition);
    doc.setFont(undefined, 'normal');
    const instructionsLines = doc.splitTextToSize(examVersion.pdfOptions.instructions, pageWidth - 40);
    doc.text(instructionsLines, 20, yPosition + 5);
    yPosition += instructionsLines.length * 4 + 10;
  } else {
    yPosition = 70;
  }

  // Preguntas

  examVersion.questions.forEach((question, index) => {
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 35;
      // NO agregamos marcadores en páginas adicionales del examen
      // Agregar marca de agua BORRADOR en cada página
      if (isDraft) {
        drawDraftWatermark(doc);
      }
    }

    doc.setFontSize(9); // Era 11, ahora 9
    doc.setFont(undefined, 'bold');

    // Número de pregunta
    doc.text(`${index + 1}.`, 20, yPosition);

    // Puntaje (si está definido)
    const points = examVersion.pointsPerQuestion || 1;
    if (points) {
      doc.setFontSize(7); // Era 9, ahora 7
      doc.text(`(${points} ${points === 1 ? 'pto.' : 'ptos.'})`, pageWidth - 30, yPosition);
      doc.setFontSize(9); // Era 11, ahora 9
    }

    doc.setFont(undefined, 'normal');
    const questionText = cleanText(question.text);
    const questionLines = doc.splitTextToSize(questionText, pageWidth - 55);
    doc.text(questionLines, 28, yPosition);
    yPosition += questionLines.length * 2.5 + 1.5; // Era 5 + 3, ahora 2.5 + 1.5 (mitad)

    if (question.type === 'multiple') {
      question.alternatives.forEach((alt, altIndex) => {
        const letter = String.fromCharCode(65 + altIndex);
        const altText = cleanText(alt.text);
        const altLines = doc.splitTextToSize(altText, pageWidth - 60);
        doc.text(`${letter})`, 30, yPosition);
        doc.text(altLines, 38, yPosition);
        yPosition += altLines.length * 2.5 + 1; // Era 5 + 2, ahora 2.5 + 1 (mitad)
      });
    } else if (question.type === 'boolean') {
      doc.text('( ) Verdadero', 30, yPosition);
      yPosition += 3.5; // Era 7, ahora 3.5 (mitad)
      doc.text('( ) Falso', 30, yPosition);
      yPosition += 3.5; // Era 7, ahora 3.5 (mitad)
    } else if (question.type === 'development') {
      doc.text('_____________________________________________________', 30, yPosition);
      yPosition += 3.5; // Era 7, ahora 3.5 (mitad)
      doc.text('_____________________________________________________', 30, yPosition);
      yPosition += 3.5; // Era 7, ahora 3.5 (mitad)
    }

    yPosition += 4; // Era 8, ahora 4 (mitad)
  });

  return doc;
}

export function generateAnswerSheet(examVersion, isDraft = true) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  drawAlignmentMarkers(doc, pageWidth, pageHeight);

  // Dibujar marca de agua BORRADOR si es un draft
  if (isDraft) {
    drawDraftWatermark(doc);
  }

  // Título
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('HOJA DE RESPUESTAS', pageWidth / 2, 35, { align: 'center' });

  doc.setFont(undefined, 'normal');
  doc.setFontSize(11);
  const title = cleanText(examVersion.examTitle || examVersion.title || 'Examen');
  doc.text(title, pageWidth / 2, 42, { align: 'center' });

  // Código de prueba
  let infoStartY = 52;
  if (examVersion.code) {
    doc.setFontSize(12);
    doc.text(`Codigo Prueba: ${examVersion.code}`, 20, infoStartY);

    // Cuadros para verificar código manualmente
    doc.setFontSize(9);
    doc.text('Verificar codigo:', pageWidth - 80, 50);
    for (let i = 0; i < 4; i++) {
      doc.rect(pageWidth - 70 + (i * 10), 52, 8, 8);
    }
    infoStartY += 5;
  }

  // Calcular puntaje total del examen
  const totalQuestions = examVersion.questions.length;
  const pointsPerQuestion = examVersion.pointsPerQuestion || 1; // Usar valor por defecto si no está definido
  const totalPoints = totalQuestions * pointsPerQuestion;

  // Información de exigencia y puntaje de aprobación
  if (examVersion.grading?.demandPercentage) {
    doc.setFontSize(10);
    const passingPoints = Math.ceil((totalPoints * examVersion.grading.demandPercentage) / 100);
    doc.text(`Exigencia: ${examVersion.grading.demandPercentage}% | Puntaje aprobacion: ${passingPoints}/${totalPoints} pts.`, 20, infoStartY);
    infoStartY += 5;
  }

  // Datos del estudiante
  doc.setFontSize(10);
  const nameY = infoStartY + 3;
  doc.text('Nombre: _______________________________________', 20, nameY);

  // RUT con 8 cuadros-1 cuadro
  doc.text('RUT:', 20, nameY + 6);
  const rutStartX = 35;
  const boxSize = 5;
  const boxGap = 1;

  // Dibujar 8 cuadros para el RUT
  for (let i = 0; i < 8; i++) {
    doc.rect(rutStartX + (i * (boxSize + boxGap)), nameY + 3, boxSize, boxSize);
  }

  // Dibujar guión
  doc.text('-', rutStartX + (8 * (boxSize + boxGap)) + 1, nameY + 6);

  // Dibujar 1 cuadro para dígito verificador
  doc.rect(rutStartX + (8 * (boxSize + boxGap)) + 4, nameY + 3, boxSize, boxSize);

  // Campos de Puntaje y Nota - alineados verticalmente con Nombre y RUT
  doc.text(`Puntaje: ___/${totalPoints} ptos.`, pageWidth - 80, nameY);
  doc.text('Nota: ___', pageWidth - 80, nameY + 6);

  // Instrucciones (configurables o por defecto)
  let instructionsY = nameY + 15;
  if (examVersion.pdfOptions?.showInstructions && examVersion.pdfOptions?.instructions) {
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('Instrucciones:', 20, instructionsY);
    doc.setFont(undefined, 'normal');
    const instructionsLines = doc.splitTextToSize(examVersion.pdfOptions.instructions, pageWidth - 40);
    doc.text(instructionsLines, 20, instructionsY + 4);
    instructionsY += instructionsLines.length * 4 + 4;
  } else {
    // Instrucciones por defecto
    doc.setFontSize(9);
    doc.text('Instrucciones: Marque con X, circulo o raya vertical la alternativa correcta', 20, instructionsY);
    instructionsY += 4;
  }

  // Calcular máximo de alternativas
  const maxAlternatives = Math.max(
    ...examVersion.questions
      .filter(q => q.type === 'multiple' || q.type === 'boolean')
      .map(q => q.type === 'boolean' ? 2 : q.alternatives.length),
    4
  );

  // Determinar número de columnas según cantidad de preguntas
  const questionsPerColumn = Math.ceil(totalQuestions / 2);

  const tableStartY = instructionsY + 5;

  // Crear tabla con 2 columnas de preguntas
  const createTableColumn = (startIdx, endIdx) => {
    const columnData = [];

    for (let i = startIdx; i < Math.min(endIdx, totalQuestions); i++) {
      const question = examVersion.questions[i];
      const row = [`${i + 1}`];

      if (question.type === 'multiple') {
        for (let j = 0; j < maxAlternatives; j++) {
          if (j < question.alternatives.length) {
            row.push(String.fromCharCode(65 + j)); // A, B, C, D, E
          } else {
            row.push('///'); // Marcador para achurar
          }
        }
      } else if (question.type === 'boolean') {
        row.push('V', 'F');
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
  // Espacio disponible: mitad de página - márgenes - columna "No"
  const availableWidth = (pageWidth / 2) - 8 - 3 - 6; // mitad, margen izq, margen entre columnas, col "No"
  const normalCellWidth = availableWidth / maxAlternatives;
  const alternativeCellWidth = normalCellWidth * (2/3); // 2/3 del tamaño normal

  const alternativeColumnStyles = {};
  for (let i = 1; i <= maxAlternatives; i++) {
    alternativeColumnStyles[i] = { cellWidth: alternativeCellWidth };
  }

  // Calcular ancho real de la tabla
  const tableWidth = 6 + (alternativeCellWidth * maxAlternatives); // columna "No" + alternativas
  const gapBetweenTables = 6; // Espacio entre las dos tablas

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

      // Achurar celdas con ///
      if (data.section === 'body' && data.column.index > 0) {
        const cellValue = data.cell.raw;
        if (cellValue === '///') {
          const { x, y, width, height } = data.cell;
          doc.setDrawColor(180, 180, 180);
          doc.line(x, y, x + width, y + height);
          doc.line(x + width, y, x, y + height);
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

        // Achurar celdas con ///
        if (data.section === 'body' && data.column.index > 0) {
          const cellValue = data.cell.raw;
          if (cellValue === '///') {
            const { x, y, width, height } = data.cell;
            doc.setDrawColor(180, 180, 180);
            doc.line(x, y, x + width, y + height);
            doc.line(x + width, y, x, y + height);
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
  const markerSize = 3; // Tamaño del marcador cuadrado
  const markerOffset = 2; // Offset desde el borde de la tabla

  // Marcadores para tabla izquierda - alineados con cada fila
  leftTableInfo.rowPositions.forEach(centerY => {
    // Marcador a la izquierda (centrado verticalmente con la fila)
    const markerY = centerY - (markerSize / 2);
    doc.rect(leftTableInfo.startX - markerOffset - markerSize, markerY, markerSize, markerSize, 'F');
  });

  // Marcadores para tabla derecha (si existe)
  if (rightTableInfo) {
    rightTableInfo.rowPositions.forEach(centerY => {
      // Marcador a la derecha (centrado verticalmente con la fila)
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

  return doc;
}

export default { generateExamSheet, generateAnswerSheet };
/**
 * Servicio para cálculo de escalas de notas
 * Sistema de evaluación educativa chileno
 */

/**
 * Calcula la escala de notas completa
 * @param {Object} params - Parámetros de la escala
 * @param {number} params.maxGrade - Nota máxima (default: 7.0)
 * @param {number} params.minGrade - Nota mínima (default: 1.0)
 * @param {number} params.passingGrade - Nota de aprobación (default: 4.0)
 * @param {number} params.demandPercentage - Porcentaje de exigencia (default: 60)
 * @param {number} params.maxScore - Puntaje máximo (default: 100)
 * @param {number} params.step - Paso entre puntajes (default: 1)
 * @returns {Array} Array de objetos {score, grade, percentage, isPassing}
 */
export function calculateGradeScale({
  maxGrade = 7.0,
  minGrade = 1.0,
  passingGrade = 4.0,
  demandPercentage = 60,
  maxScore = 100,
  step = 1
}) {
  // Validaciones
  if (maxGrade <= minGrade) {
    throw new Error('La nota máxima debe ser mayor que la nota mínima');
  }
  if (passingGrade < minGrade || passingGrade > maxGrade) {
    throw new Error('La nota de aprobación debe estar entre la nota mínima y máxima');
  }
  if (demandPercentage <= 0 || demandPercentage > 100) {
    throw new Error('El porcentaje de exigencia debe estar entre 0 y 100');
  }
  if (maxScore <= 0) {
    throw new Error('El puntaje máximo debe ser mayor a 0');
  }
  if (step <= 0 || step > maxScore) {
    throw new Error('El paso debe ser mayor a 0 y menor o igual al puntaje máximo');
  }

  const scale = [];

  // Calcular puntaje de aprobación
  const passingScore = Math.ceil((demandPercentage / 100) * maxScore);

  // Rango de notas
  const gradeRange = maxGrade - minGrade;
  const passingRange = passingGrade - minGrade;
  const excellenceRange = maxGrade - passingGrade;

  // Generar escala
  for (let score = 0; score <= maxScore; score += step) {
    let grade;

    if (score < passingScore) {
      // Zona de reprobación (score 0 a passingScore -> minGrade a passingGrade)
      if (passingScore === 0) {
        grade = minGrade;
      } else {
        const proportion = score / passingScore;
        grade = minGrade + (proportion * passingRange);
      }
    } else {
      // Zona de aprobación (passingScore a maxScore -> passingGrade a maxGrade)
      const scoreAbovePassing = score - passingScore;
      const maxScoreAbovePassing = maxScore - passingScore;

      if (maxScoreAbovePassing === 0) {
        grade = maxGrade;
      } else {
        const proportion = scoreAbovePassing / maxScoreAbovePassing;
        grade = passingGrade + (proportion * excellenceRange);
      }
    }

    // Redondear a 1 decimal
    grade = Math.round(grade * 10) / 10;

    // Asegurar que no exceda los límites
    grade = Math.max(minGrade, Math.min(maxGrade, grade));

    const percentage = (score / maxScore) * 100;
    const isPassing = grade >= passingGrade;

    scale.push({
      score,
      grade,
      percentage: Math.round(percentage * 10) / 10,
      isPassing
    });
  }

  return scale;
}

/**
 * Calcula la nota para un puntaje específico
 * @param {number} score - Puntaje obtenido
 * @param {Object} params - Parámetros de la escala
 * @returns {Object} {score, grade, percentage, isPassing}
 */
export function calculateGradeForScore(score, params) {
  const scale = calculateGradeScale(params);

  // Buscar el puntaje exacto o el más cercano
  const exactMatch = scale.find(item => item.score === score);
  if (exactMatch) {
    return exactMatch;
  }

  // Si no hay coincidencia exacta, interpolar
  const lowerBound = scale.filter(item => item.score <= score).pop();
  const upperBound = scale.find(item => item.score > score);

  if (!lowerBound) return scale[0];
  if (!upperBound) return scale[scale.length - 1];

  // Interpolación lineal
  const scoreDiff = upperBound.score - lowerBound.score;
  const gradeDiff = upperBound.grade - lowerBound.grade;
  const scoreOffset = score - lowerBound.score;
  const proportion = scoreOffset / scoreDiff;

  const grade = lowerBound.grade + (proportion * gradeDiff);
  const roundedGrade = Math.round(grade * 10) / 10;
  const percentage = (score / params.maxScore) * 100;

  return {
    score,
    grade: roundedGrade,
    percentage: Math.round(percentage * 10) / 10,
    isPassing: roundedGrade >= params.passingGrade
  };
}

/**
 * Obtiene estadísticas de la escala
 * @param {Array} scale - Escala generada
 * @param {number} passingGrade - Nota de aprobación
 * @returns {Object} Estadísticas
 */
export function getScaleStatistics(scale, passingGrade = 4.0) {
  if (!scale || scale.length === 0) {
    return null;
  }

  const passingScores = scale.filter(item => item.isPassing);
  const failingScores = scale.filter(item => !item.isPassing);

  return {
    totalScores: scale.length,
    passingScoresCount: passingScores.length,
    failingScoresCount: failingScores.length,
    minGrade: scale[0].grade,
    maxGrade: scale[scale.length - 1].grade,
    passingScoreThreshold: passingScores.length > 0 ? passingScores[0].score : null,
    passingPercentageThreshold: passingScores.length > 0 ? passingScores[0].percentage : null
  };
}

/**
 * Exporta la escala a formato CSV
 * @param {Array} scale - Escala generada
 * @returns {string} CSV string
 */
export function exportScaleToCSV(scale) {
  const headers = ['Puntaje', 'Nota', 'Estado'];
  const rows = scale.map(item => [
    item.score,
    item.grade.toFixed(1),
    item.isPassing ? 'Aprobado' : 'Reprobado'
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Descarga la escala como archivo CSV
 * @param {Array} scale - Escala generada
 * @param {string} filename - Nombre del archivo
 */
export function downloadScaleAsCSV(scale, filename = 'escala_notas.csv') {
  const csv = exportScaleToCSV(scale);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

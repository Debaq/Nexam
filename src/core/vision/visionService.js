/**
 * 🔍 Vision Service - Pipeline de Computer Vision
 *
 * Adaptado del HTML de referencia - Algoritmo probado y funcional
 * Pipeline: Detección marcadores → Warp → Detección grid → Extracción ROIs
 */

class VisionService {
  constructor() {
    this.isOpenCVReady = false;
    this.initPromise = null;
  }

  /**
   * Inicializa OpenCV.js
   */
  async initialize() {
    if (this.isOpenCVReady) return true;

    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      if (window.cv && window.cv.Mat) {
        this.isOpenCVReady = true;
        console.log('✅ OpenCV.js already loaded');
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://docs.opencv.org/4.x/opencv.js';
      script.async = true;

      script.onload = () => {
        const checkCV = setInterval(() => {
          if (window.cv && window.cv.Mat) {
            clearInterval(checkCV);
            this.isOpenCVReady = true;
            console.log('✅ OpenCV.js loaded successfully');
            resolve(true);
          }
        }, 100);

        setTimeout(() => {
          clearInterval(checkCV);
          if (!this.isOpenCVReady) {
            reject(new Error('OpenCV.js timeout'));
          }
        }, 10000);
      };

      script.onerror = () => reject(new Error('Failed to load OpenCV.js'));
      document.head.appendChild(script);
    });

    return this.initPromise;
  }

  /**
   * Convierte imagen HTML a Mat de OpenCV
   */
  imageToMat(image) {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    return window.cv.imread(canvas);
  }

  /**
   * Convierte Mat de OpenCV a base64
   */
  matToBase64(mat, quality = 0.95) {
    const canvas = document.createElement('canvas');
    window.cv.imshow(canvas, mat);
    return canvas.toDataURL('image/jpeg', quality);
  }

  /**
   * 📐 PASO 1: Detectar 3 marcadores de esquina
   * Algoritmo del HTML - 100% funcional
   */
  detectCornerMarkers(srcMat) {
    const w = srcMat.cols;
    const h = srcMat.rows;
    const areaTotal = w * h;

    // 1. Convertir a gris
    const gray = new window.cv.Mat();
    window.cv.cvtColor(srcMat, gray, window.cv.COLOR_RGBA2GRAY);

    // 2. Threshold adaptativo invertido (detecta cuadros negros)
    const threshCorners = new window.cv.Mat();
    window.cv.adaptiveThreshold(
      gray,
      threshCorners,
      255,
      window.cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      window.cv.THRESH_BINARY_INV,
      21,
      10
    );

    // 3. Buscar contornos
    const contours = new window.cv.MatVector();
    const hierarchy = new window.cv.Mat();
    window.cv.findContours(
      threshCorners,
      contours,
      hierarchy,
      window.cv.RETR_TREE,
      window.cv.CHAIN_APPROX_SIMPLE
    );

    const marcadores = [];

    // 4. Filtrar cuadrados
    for (let i = 0; i < contours.size(); i++) {
      const cnt = contours.get(i);
      const approx = new window.cv.Mat();
      window.cv.approxPolyDP(cnt, approx, 0.04 * window.cv.arcLength(cnt, true), true);

      if (approx.rows === 4) {
        const r = window.cv.boundingRect(approx);
        const area = window.cv.contourArea(approx);

        // Rango: 0.1% a 10% del área total
        if (area > areaTotal * 0.001 && area < areaTotal * 0.1) {
          marcadores.push({
            rect: r,
            area: area,
            x: r.x + r.width / 2,
            y: r.y + r.height / 2,
            width: r.width,
            height: r.height
          });
        }
      }
      approx.delete();
    }

    console.log(`   📍 Marcadores encontrados: ${marcadores.length}`);

    // 5. Ordenar por área y tomar los 3 más grandes
    marcadores.sort((a, b) => b.area - a.area);

    if (marcadores.length < 3) {
      console.warn(`   ⚠️ Solo ${marcadores.length} marcadores (se necesitan 3)`);
      gray.delete();
      threshCorners.delete();
      contours.delete();
      hierarchy.delete();
      return null;
    }

    const esquinas = marcadores.slice(0, 3);

    // 6. Identificar posiciones (TL, TR, BL)
    const pts = esquinas.map(p => ({ x: p.x, y: p.y }));
    pts.sort((a, b) => a.y - b.y);

    const top = [pts[0], pts[1]].sort((a, b) => a.x - b.x);
    const tl = { ...esquinas.find(e => e.x === top[0].x && e.y === top[0].y) };
    const tr = { ...esquinas.find(e => e.x === top[1].x && e.y === top[1].y) };
    const bl = { ...esquinas.find(e => e.x === pts[2].x && e.y === pts[2].y) };

    console.log(`   ✓ TL: (${tl.x.toFixed(0)}, ${tl.y.toFixed(0)})`);
    console.log(`   ✓ TR: (${tr.x.toFixed(0)}, ${tr.y.toFixed(0)})`);
    console.log(`   ✓ BL: (${bl.x.toFixed(0)}, ${bl.y.toFixed(0)})`);

    // Cleanup
    gray.delete();
    threshCorners.delete();
    contours.delete();
    hierarchy.delete();

    return { topLeft: tl, topRight: tr, bottomLeft: bl };
  }

  /**
   * 🔄 PASO 2: Warp perspective (corrección de perspectiva)
   * Algoritmo del HTML - calcula BR geométricamente
   */
  warpPerspective(srcMat, markers) {
    const tl = markers.topLeft;
    const tr = markers.topRight;
    const bl = markers.bottomLeft;

    // Calcular bottom-right geométricamente
    const br = {
      x: tr.x + (bl.x - tl.x),
      y: bl.y + (tr.y - tl.y)
    };

    console.log(`   📐 BR inferido: (${br.x.toFixed(0)}, ${br.y.toFixed(0)})`);

    // Calcular dimensiones del rectángulo destino
    const w = Math.max(
      Math.hypot(br.x - bl.x, br.y - bl.y),
      Math.hypot(tr.x - tl.x, tr.y - tl.y)
    );
    const h = Math.max(
      Math.hypot(tr.x - br.x, tr.y - br.y),
      Math.hypot(tl.x - bl.x, tl.y - bl.y)
    );

    console.log(`   📏 Dimensiones: ${w.toFixed(0)}x${h.toFixed(0)}px`);

    // Puntos origen
    const srcTri = window.cv.matFromArray(4, 1, window.cv.CV_32FC2, [
      tl.x, tl.y,
      tr.x, tr.y,
      br.x, br.y,
      bl.x, bl.y
    ]);

    // Puntos destino (rectángulo perfecto)
    const dstTri = window.cv.matFromArray(4, 1, window.cv.CV_32FC2, [
      0, 0,
      w, 0,
      w, h,
      0, h
    ]);

    // Aplicar transformación
    const M = window.cv.getPerspectiveTransform(srcTri, dstTri);
    const warpedMat = new window.cv.Mat();
    window.cv.warpPerspective(srcMat, warpedMat, M, new window.cv.Size(w, h));

    // Cleanup
    srcTri.delete();
    dstTri.delete();
    M.delete();

    console.log(`   ✓ Warp completado`);
    return warpedMat;
  }

  /**
   * 📊 PASO 3: Detectar grid de respuestas
   * Algoritmo del HTML - detecta anclas izq/der y empareja filas
   */
  detectAnswerGrid(warpedMat, params = {}) {
    const {
      threshVal = 225,
      edgeMargin = 15,
      yTolerance = 10,
      xTolFactor = 1.5
    } = params;

    const w = warpedMat.cols;
    const h = warpedMat.rows;

    console.log(`   📐 Dimensiones imagen warpeada: ${w}x${h}px`);

    // 1. Convertir a gris y binarizar
    const warpedGray = new window.cv.Mat();
    window.cv.cvtColor(warpedMat, warpedGray, window.cv.COLOR_RGBA2GRAY);

    const binary = new window.cv.Mat();
    window.cv.threshold(warpedGray, binary, threshVal, 255, window.cv.THRESH_BINARY_INV);

    // 2. Buscar contornos
    const contoursGrid = new window.cv.MatVector();
    const hierarchy = new window.cv.Mat();
    window.cv.findContours(
      binary,
      contoursGrid,
      hierarchy,
      window.cv.RETR_EXTERNAL,
      window.cv.CHAIN_APPROX_SIMPLE
    );

    console.log(`   🔍 Total contornos encontrados: ${contoursGrid.size()}`);

    const rawLeft = [];
    const rawRight = [];
    const midX = w / 2;
    const allContours = []; // Para debugging

    // 3. Clasificar anclas izquierda/derecha
    for (let i = 0; i < contoursGrid.size(); i++) {
      const r = window.cv.boundingRect(contoursGrid.get(i));
      const area = window.cv.contourArea(contoursGrid.get(i));
      const ratio = r.width / r.height;
      const cx = r.x + r.width / 2;
      const cy = r.y + r.height / 2;

      allContours.push({ area, ratio, cx, cy, w: r.width, h: r.height });

      // Filtros: área razonable, aspect ratio cuadrado, no en bordes
      if (area > 30 && area < 5000 && ratio > 0.5 && ratio < 1.8) {
        if (cx > edgeMargin && cx < w - edgeMargin && cy > edgeMargin && cy < h - edgeMargin) {
          const item = { x: cx, y: cy, w: r.width, h: r.height, rect: r };
          if (cx < midX) {
            rawLeft.push(item);
          } else {
            rawRight.push(item);
          }
        }
      }
    }

    console.log(`   🔍 Anclas brutas: Izq=${rawLeft.length}, Der=${rawRight.length}`);

    // Debug: Mostrar algunos contornos para entender por qué no se detectan
    if (rawLeft.length === 0 && rawRight.length === 0) {
      console.warn(`   ⚠️ NO SE DETECTARON ANCLAS. Analizando contornos...`);
      const sample = allContours.slice(0, 10);
      console.table(sample);
    }

    // 4. Limpiar columnas (eliminar outliers en X)
    const cleanColumn = (anchors) => {
      if (anchors.length === 0) return [];
      const sorted = [...anchors].sort((a, b) => a.x - b.x);
      const midVal = sorted[Math.floor(sorted.length / 2)].x;
      const avgW = anchors.reduce((s, a) => s + a.w, 0) / anchors.length;
      const tol = avgW * xTolFactor;
      return anchors.filter(a => Math.abs(a.x - midVal) < tol);
    };

    const cleanLeft = cleanColumn(rawLeft);
    const cleanRight = cleanColumn(rawRight);

    console.log(`   ✨ Anclas limpias: Izq=${cleanLeft.length}, Der=${cleanRight.length}`);

    // 5. Calcular ancho promedio de anclas
    const allAnchors = [...cleanLeft, ...cleanRight];
    const globalAvgW = allAnchors.length > 0
      ? allAnchors.reduce((sum, a) => sum + a.w, 0) / allAnchors.length
      : 0;

    // 6. Calcular X promedio de cada columna
    const avgAnchorL = cleanLeft.length > 0
      ? cleanLeft.reduce((s, a) => s + a.x, 0) / cleanLeft.length
      : 0;
    const avgAnchorR = cleanRight.length > 0
      ? cleanRight.reduce((s, a) => s + a.x, 0) / cleanRight.length
      : 0;

    // 7. Emparejar anclas izq/der en filas
    const pairs = [];
    cleanLeft.forEach(L => {
      let bestR = null;
      let minDiff = Infinity;
      cleanRight.forEach(R => {
        const diff = Math.abs(L.y - R.y);
        if (diff < yTolerance && diff < minDiff) {
          minDiff = diff;
          bestR = R;
        }
      });
      if (bestR) {
        pairs.push({ L, R: bestR });
      }
    });

    console.log(`   ✓ Filas emparejadas: ${pairs.length}`);

    // Cleanup
    warpedGray.delete();
    binary.delete();
    contoursGrid.delete();
    hierarchy.delete();

    return {
      pairs,
      avgAnchorL,
      avgAnchorR,
      globalAvgW,
      dimensions: { w, h, midX }
    };
  }

  /**
   * 🎨 Dibujar marcadores sobre imagen (debug)
   */
  drawMarkersOnImage(mat, markers) {
    const visualMat = mat.clone();

    // Convertir a color si es grayscale
    if (visualMat.channels() === 1) {
      window.cv.cvtColor(visualMat, visualMat, window.cv.COLOR_GRAY2RGB);
    }

    const drawMarker = (marker, color, label) => {
      if (!marker) return;

      const pt1 = new window.cv.Point(
        Math.floor(marker.x - marker.width / 2),
        Math.floor(marker.y - marker.height / 2)
      );
      const pt2 = new window.cv.Point(
        Math.floor(marker.x + marker.width / 2),
        Math.floor(marker.y + marker.height / 2)
      );

      window.cv.rectangle(visualMat, pt1, pt2, color, 4);
      window.cv.circle(visualMat, new window.cv.Point(Math.floor(marker.x), Math.floor(marker.y)), 5, color, -1);
      window.cv.putText(
        visualMat,
        label,
        new window.cv.Point(Math.floor(marker.x - 20), Math.floor(marker.y - marker.height / 2 - 10)),
        window.cv.FONT_HERSHEY_SIMPLEX,
        0.8,
        color,
        2
      );
    };

    // Verde para TL, Azul para TR, Rojo para BL
    drawMarker(markers.topLeft, new window.cv.Scalar(0, 255, 0, 255), 'TL');
    drawMarker(markers.topRight, new window.cv.Scalar(255, 0, 0, 255), 'TR');
    drawMarker(markers.bottomLeft, new window.cv.Scalar(0, 0, 255, 255), 'BL');

    return visualMat;
  }

  /**
   * 🔍 Pipeline completo de procesamiento
   * Sigue EXACTAMENTE el flujo del HTML
   */
  async processAnswerSheet(imageData) {
    await this.initialize();

    console.log('📄 Procesando hoja de respuesta...');
    const startTime = performance.now();

    const { image } = imageData;
    const srcMat = this.imageToMat(image);

    const results = {
      success: false,
      original: this.matToBase64(srcMat, 0.75),
      debug: {
        step1_grayscale: null,
        step2_blurred: null,
        step3_binary: null,
        step4_markersDetected: null,
        step5_warped: null,
        step6_gridDetected: null,
        step7_roiLeft: null,
        step8_roiRight: null
      },
      rois: null,
      grids: null,
      metadata: {
        originalSize: { width: srcMat.cols, height: srcMat.rows },
        markersFound: 0,
        rowsDetected: 0
      },
      errors: []
    };

    let gray = null;
    let warpedMat = null;
    let displayGrid = null;

    try {
      // PASO 1: Grayscale (para debug)
      console.log('1️⃣ Convirtiendo a escala de grises...');
      gray = new window.cv.Mat();
      window.cv.cvtColor(srcMat, gray, window.cv.COLOR_RGBA2GRAY);
      results.debug.step1_grayscale = this.matToBase64(gray);

      // PASO 2: Detectar 3 marcadores de esquina
      console.log('2️⃣ Detectando marcadores de esquina...');
      const markers = this.detectCornerMarkers(srcMat);

      if (!markers) {
        results.errors.push('No se detectaron 3 marcadores de esquina');
        return results;
      }

      results.metadata.markersFound = 3;

      // Dibujar marcadores
      const markedMat = this.drawMarkersOnImage(srcMat, markers);
      results.debug.step4_markersDetected = this.matToBase64(markedMat);
      markedMat.delete();

      // PASO 3: Warp perspective
      console.log('3️⃣ Aplicando corrección de perspectiva...');
      warpedMat = this.warpPerspective(srcMat, markers);
      results.debug.step5_warped = this.matToBase64(warpedMat);

      // PASO 4: Detectar grid de respuestas
      console.log('4️⃣ Detectando grid de respuestas...');
      const gridData = this.detectAnswerGrid(warpedMat);
      results.metadata.rowsDetected = gridData.pairs.length;

      // PASO 5: Dibujar grid (debug) y extraer ROIs
      console.log('5️⃣ Generando visualización y ROIs...');
      displayGrid = warpedMat.clone();

      const NUM_COLS = 4; // A, B, C, D
      const cellPixW = 3.9 * gridData.globalAvgW;
      const cellPixH = 1.3 * gridData.globalAvgW;

      let boundsT1 = { minX: Infinity, minY: Infinity, maxX: 0, maxY: 0 };
      let boundsT2 = { minX: Infinity, minY: Infinity, maxX: 0, maxY: 0 };

      const updateBounds = (bounds, x, y, cw, ch) => {
        bounds.minX = Math.min(bounds.minX, x - cw / 2);
        bounds.maxX = Math.max(bounds.maxX, x + cw / 2);
        bounds.minY = Math.min(bounds.minY, y - ch / 2);
        bounds.maxY = Math.max(bounds.maxY, y + ch / 2);
      };

      // Dibujar celdas sobre cada fila
      gridData.pairs.forEach(pair => {
        const yStart = pair.L.y;
        const yEnd = pair.R.y;

        // Tabla 1 (Izquierda)
        let cursorX = gridData.dimensions.midX;
        for (let j = 0; j < NUM_COLS; j++) {
          const cx = cursorX - cellPixW / 2;
          const currentY = yStart + (yEnd - yStart) * ((cx - gridData.avgAnchorL) / (gridData.avgAnchorR - gridData.avgAnchorL));

          const pt1 = new window.cv.Point(cx - cellPixW / 2, currentY - cellPixH / 2);
          const pt2 = new window.cv.Point(cx + cellPixW / 2, currentY + cellPixH / 2);
          window.cv.rectangle(displayGrid, pt1, pt2, [0, 255, 0, 150], 1);

          updateBounds(boundsT1, cx, currentY, cellPixW, cellPixH);
          cursorX -= cellPixW;
        }

        // Tabla 2 (Derecha)
        const jump = 1.7 * gridData.globalAvgW;
        cursorX = gridData.dimensions.midX + jump;
        for (let j = 0; j < NUM_COLS; j++) {
          const cx = cursorX + cellPixW / 2;
          const currentY = yStart + (yEnd - yStart) * ((cx - gridData.avgAnchorL) / (gridData.avgAnchorR - gridData.avgAnchorL));

          const pt1 = new window.cv.Point(cx - cellPixW / 2, currentY - cellPixH / 2);
          const pt2 = new window.cv.Point(cx + cellPixW / 2, currentY + cellPixH / 2);
          window.cv.rectangle(displayGrid, pt1, pt2, [0, 255, 0, 150], 1);

          updateBounds(boundsT2, cx, currentY, cellPixW, cellPixH);
          cursorX += cellPixW;
        }
      });

      results.debug.step6_gridDetected = this.matToBase64(displayGrid);

      // PASO 6: Extraer ROIs (recortes) con padding
      const extractROI = (bounds, warpedMat) => {
        if (bounds.minX === Infinity || bounds.maxX === 0) return null;

        const padding = 10;
        const rx = Math.max(0, Math.floor(bounds.minX - padding));
        const ry = Math.max(0, Math.floor(bounds.minY - padding));
        const rw = Math.min(warpedMat.cols - rx, Math.ceil((bounds.maxX - bounds.minX) + padding * 2));
        const rh = Math.min(warpedMat.rows - ry, Math.ceil((bounds.maxY - bounds.minY) + padding * 2));

        if (rw > 0 && rh > 0) {
          const rect = new window.cv.Rect(rx, ry, rw, rh);
          return warpedMat.roi(rect);
        }
        return null;
      };

      const roiLeft = extractROI(boundsT1, warpedMat);
      const roiRight = extractROI(boundsT2, warpedMat);

      // Guardar ROIs como imágenes base64 para debug
      if (roiLeft) {
        results.debug.step7_roiLeft = this.matToBase64(roiLeft);
        roiLeft.delete(); // Limpiar después de convertir
      }
      if (roiRight) {
        results.debug.step8_roiRight = this.matToBase64(roiRight);
        roiRight.delete(); // Limpiar después de convertir
      }

      // Guardar ROIs para procesamiento posterior (solo base64, sin Mats)
      results.rois = {
        tableLeft: results.debug.step7_roiLeft,
        tableRight: results.debug.step8_roiRight
      };

      results.grids = gridData;

      const endTime = performance.now();
      results.metadata.processingTime = endTime - startTime;
      results.success = results.errors.length === 0;

      console.log(`✅ Procesamiento completado en ${(endTime - startTime).toFixed(2)}ms`);
      console.log(`   📊 ${results.metadata.rowsDetected} filas detectadas`);

      return results;

    } catch (error) {
      console.error('❌ Error en pipeline:', error);
      results.errors.push(error.message);
      return results;
    } finally {
      // Cleanup
      if (srcMat && !srcMat.isDeleted()) srcMat.delete();
      if (gray && !gray.isDeleted()) gray.delete();
      if (warpedMat && !warpedMat.isDeleted()) warpedMat.delete();
      if (displayGrid && !displayGrid.isDeleted()) displayGrid.delete();
    }
  }

  /**
   * 🧹 Limpiar recursos OpenCV
   */
  cleanup(rois) {
    if (!rois) return;

    const matsToClean = ['tableLeftMat', 'tableRightMat'];
    matsToClean.forEach(key => {
      if (rois[key] && !rois[key].isDeleted()) {
        rois[key].delete();
      }
    });
  }
}

export default new VisionService();

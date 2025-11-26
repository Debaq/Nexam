import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, RefreshCw, Eye, FileSpreadsheet, X } from 'lucide-react';
import correctionService from '@/features/correction/services/correctionService';
import { examService } from '@/features/exams/services/examService';

// Componente para mostrar miniaturas de hojas de respuesta
const AnswerSheetThumbnail = ({ sheet }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);

  const getStatusColor = (sheet) => {
    if (!sheet.rutValid) return 'border-red-500 bg-red-50';
    if (sheet.needsReview) return 'border-yellow-500 bg-yellow-50';
    return 'border-green-500 bg-green-50';
  };

  const getStatusText = (sheet) => {
    if (!sheet.rutValid) return 'RUT inválido';
    if (sheet.needsReview) return 'Requiere revisión';
    return 'Válido';
  };

  const ImagePreview = ({ src, alt, title, className = "" }) => (
    <div className={`border rounded p-2 ${className}`}>
      <h4 className="font-semibold text-sm mb-2">{title}</h4>
      {src ? (
        <div
          className="relative group"
          onClick={() => setZoomedImage(src)}
        >
          <img
            src={src}
            alt={alt}
            className="w-full max-h-60 object-contain cursor-pointer"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity rounded flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
            <span className="bg-white rounded-full p-2 shadow-lg pointer-events-auto cursor-pointer">
              <Eye className="w-4 h-4" />
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-60 bg-gray-100 rounded">
          <span className="text-gray-500">No disponible</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div
        className={`border-2 rounded-lg p-2 cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(sheet)}`}
        onClick={() => setIsModalOpen(true)}
      >
        {sheet.thumbnail ? (
          <div className="relative">
            <img
              src={sheet.thumbnail}
              alt={`Hoja de respuesta ${sheet.id}`}
              className="w-full h-32 object-contain rounded mb-2"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-200 rounded">
              <span className="text-gray-500">No imagen</span>
            </div>
            <div className="text-xs truncate text-gray-600">
              {sheet.detectedRUT || 'Sin RUT'}
            </div>
            <div className="text-xs text-gray-500">
              {sheet.score}/{sheet.percentage}%
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded mb-2">
            <FileText className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Sin imagen</span>
          </div>
        )}
        <div className="text-xs text-center mt-1 font-medium">
          {getStatusText(sheet)}
        </div>
      </div>

      {/* Modal para ver la hoja ampliada */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-auto relative">
            <button
              className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 z-10"
              onClick={() => setIsModalOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">🔬 Pipeline de Detección - {sheet.detectedRUT || 'Sin RUT'}</h3>

              {/* PASO 1: DETECCIÓN MARCADORES DE ESQUINA */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-300">
                <h4 className="font-bold text-blue-900 mb-3">📍 Paso 1: Detección de Marcadores de Esquina</h4>
                <p className="text-sm text-gray-700 mb-3">
                  Detección de los 3 cuadrados grandes de las esquinas (TL=Verde, TR=Azul, BL=Rojo)
                </p>
                <div className="grid grid-cols-1 gap-4">
                  <ImagePreview
                    src={sheet.debugStep4MarkersDetected}
                    alt="Marcadores detectados"
                    title="Marcadores de Esquina (3 cuadrados grandes)"
                    className="border-blue-400"
                  />
                </div>
              </div>

              {/* PASO 2: CORRECCIÓN DE PERSPECTIVA (WARP) */}
              <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-300">
                <h4 className="font-bold text-purple-900 mb-3">🔄 Paso 2: Corrección de Perspectiva (Warp)</h4>
                <p className="text-sm text-gray-700 mb-3">
                  Alineación de la imagen usando los 3 marcadores detectados
                </p>
                <div className="grid grid-cols-1 gap-4">
                  <ImagePreview
                    src={sheet.debugStep5Warped}
                    alt="Imagen warpeada"
                    title="Imagen Alineada (Warp Perspective)"
                    className="border-purple-400"
                  />
                </div>
              </div>

              {/* PASO 3: DETECCIÓN DEL GRID */}
              <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-300">
                <h4 className="font-bold text-green-900 mb-3">📊 Paso 3: Detección del Grid de Respuestas</h4>
                <p className="text-sm text-gray-700 mb-3">
                  Detección de anclas laterales y cálculo de celdas A, B, C, D para ambas tablas
                </p>
                <div className="grid grid-cols-1 gap-4">
                  <ImagePreview
                    src={sheet.debugStep6GridDetected}
                    alt="Grid detectado"
                    title="Grid Calculado con Celdas Dibujadas"
                    className="border-green-400"
                  />
                </div>
                {sheet.metadata?.rowsDetected > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    ✓ {sheet.metadata.rowsDetected} filas detectadas
                  </div>
                )}
              </div>

              {/* PASO 4: EXTRACCIÓN DE ROIs */}
              <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-300">
                <h4 className="font-bold text-orange-900 mb-3">✂️ Paso 4: Extracción de Tablas (ROIs)</h4>
                <p className="text-sm text-gray-700 mb-3">
                  Recorte de las dos tablas de respuestas para procesamiento
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ImagePreview
                    src={sheet.debugStep7RoiLeft}
                    alt="Tabla izquierda"
                    title="Tabla Izquierda (ROI 1)"
                    className="border-orange-400"
                  />
                  <ImagePreview
                    src={sheet.debugStep8RoiRight}
                    alt="Tabla derecha"
                    title="Tabla Derecha (ROI 2)"
                    className="border-orange-400"
                  />
                </div>
              </div>

              {/* PASO 5: DETECCIÓN YOLO (si existe) */}
              {(sheet.debugYoloLeft || sheet.debugYoloRight) && (
                <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-300">
                  <h4 className="font-bold text-red-900 mb-3">🎯 Paso 5: Detección con YOLO</h4>
                  <p className="text-sm text-gray-700 mb-3">
                    Detección de marcas pintadas usando modelo YOLOv11n
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sheet.debugYoloLeft && (
                      <ImagePreview
                        src={sheet.debugYoloLeft}
                        alt="YOLO tabla izquierda"
                        title="Detecciones YOLO - Tabla Izquierda"
                        className="border-red-400"
                      />
                    )}
                    {sheet.debugYoloRight && (
                      <ImagePreview
                        src={sheet.debugYoloRight}
                        alt="YOLO tabla derecha"
                        title="Detecciones YOLO - Tabla Derecha"
                        className="border-red-400"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* RESUMEN */}
              <div className="mt-6 p-4 bg-white border-t-4 border-blue-500 rounded-lg">
                <h4 className="font-bold text-gray-900 mb-3">📊 Resumen del Procesamiento</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Estado:</span>
                    <div className="text-lg mt-1">{getStatusText(sheet)}</div>
                  </div>
                  <div>
                    <span className="font-medium">Puntaje:</span>
                    <div className="text-lg mt-1">{sheet.score}/{sheet.percentage}%</div>
                  </div>
                  <div>
                    <span className="font-medium">Marcadores:</span>
                    <div className="text-lg mt-1">{sheet.metadata?.markersFound || 0}/3</div>
                  </div>
                  <div>
                    <span className="font-medium">Filas:</span>
                    <div className="text-lg mt-1">{sheet.metadata?.rowsDetected || 0}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de imagen ampliada */}
      {zoomedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-6xl max-h-[90vh]">
            <button
              className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 z-10"
              onClick={(e) => {
                e.stopPropagation();
                setZoomedImage(null);
              }}
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={zoomedImage}
              alt="Imagen ampliada"
              className="max-w-full max-h-[80vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};

export const CorrectionTab = ({ exam }) => {
  const [pdfFile, setPdfFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [servicesReady, setServicesReady] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerateSuccess, setRegenerateSuccess] = useState(false);
  const [uploadExpanded, setUploadExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('upload'); // Nuevo estado para pestañas
  const [answerSheets, setAnswerSheets] = useState([]); // Nuevo estado para hojas de respuestas
  const [processedResults, setProcessedResults] = useState([]); // Nuevo estado para resultados

  // Verificar servicios al montar y generar gabarito si no existe
  useEffect(() => {
    const initializeCorrection = async () => {
      // Verificar servicios
      const status = await correctionService.checkServicesAvailability();
      setServicesReady(status.opencv && status.yolo);

      // Si el examen está finalizado pero no tiene gabarito, generarlo automáticamente
      if (exam.status === 'finalized' && exam.finalizedVersions) {
        const hasAnswerKey = exam.type === 'uniform'
          ? exam.finalizedVersions.answerKey
          : exam.finalizedVersions.answerKeys;

        if (!hasAnswerKey) {
          try {
            await examService.regenerateAnswerKeys(exam.id);
            console.log('Gabarito generado automáticamente');
          } catch (error) {
            console.error('Error al generar gabarito automáticamente:', error);
          }
        }
      }
    };

    initializeCorrection();
  }, [exam]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setError(null);
      setResults(null);
      setUploadExpanded(false); // Colapsar la zona de arrastre después de seleccionar archivo
    } else {
      setError('Por favor selecciona un archivo PDF válido');
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setError(null);
      setResults(null);
      setUploadExpanded(false); // Colapsar la zona de arrastre después de arrastrar archivo
    } else {
      setError('Por favor arrastra un archivo PDF válido');
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleProcess = async () => {
    if (!pdfFile) return;

    if (exam.status !== 'finalized') {
      setError('Debes finalizar el examen primero para generar el gabarito');
      return;
    }

    setError(null);
    setResults(null);
    setIsProcessing(true);

    try {
      const result = await correctionService.processPDF(
        pdfFile,
        exam.id,
        {
          onProgress: (prog) => setProgress(prog),
          concurrency: 4,
          autoIdentifyStudents: true
        }
      );

      setResults(result);
      setProcessedResults(result.results); // Actualizar el estado de resultados procesados

      // Extraer las hojas de respuesta para la vista de hojas
      const sheets = result.results.map((sheet, index) => ({
        id: index,
        thumbnail: sheet.thumbnail,
        detectedRUT: sheet.detectedRUT,
        rutValid: sheet.rutValid,
        needsReview: sheet.needsReview,
        score: sheet.score,
        percentage: sheet.percentage,
        processingTime: sheet.processingTime,
        metadata: {
          markersFound: sheet.markersFound || 0,
          rowsDetected: sheet.rowsDetected || 0
        },
        // Imágenes de DEBUG - Pipeline del HTML
        debugStep1Grayscale: sheet.debugStep1Grayscale,
        debugStep4MarkersDetected: sheet.debugStep4MarkersDetected,
        debugStep5Warped: sheet.debugStep5Warped,
        debugStep6GridDetected: sheet.debugStep6GridDetected,
        debugStep7RoiLeft: sheet.debugStep7RoiLeft,
        debugStep8RoiRight: sheet.debugStep8RoiRight,
        // Detecciones YOLO (si existen)
        debugYoloLeft: sheet.debugYoloLeft,
        debugYoloRight: sheet.debugYoloRight,
        // ROIs procesados
        rutImage: sheet.rutImage,
        tableLeftImage: sheet.tableLeftImage,
        tableRightImage: sheet.tableRightImage,
        // También incluir el objeto completo para más detalles si es necesario
        fullResult: sheet
      }));

      setAnswerSheets(sheets);
      setActiveTab('results'); // Cambiar a la pestaña de resultados después del procesamiento
    } catch (err) {
      console.error('Error procesando PDF:', err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  const removeFile = () => {
    setPdfFile(null);
    setError(null);
    setResults(null);
    setUploadExpanded(true); // Expandir la zona de arrastre al eliminar archivo
  };


  return (
    <div className="space-y-6">

      {/* Status de servicios */}
      {!servicesReady && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">Configuración pendiente</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Falta el modelo YOLO. Sube el archivo entrenado a{' '}
                  <code className="bg-yellow-100 px-1 rounded">/public/models/nexam_v1.onnx</code>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sistema de pestañas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" disabled={isProcessing}>
            <Upload className="w-4 h-4 mr-2" />
            Subida y Procesamiento
          </TabsTrigger>
          <TabsTrigger value="answers" disabled={isProcessing}>
            <Eye className="w-4 h-4 mr-2" />
            Hojas de Respuestas
          </TabsTrigger>
          <TabsTrigger value="results" disabled={isProcessing}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Resultados
          </TabsTrigger>
        </TabsList>

        {/* Pestaña de Subida y Procesamiento */}
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Subir PDF de Hojas Escaneadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {exam.status !== 'finalized' && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 font-medium">
                    ⚠️ Debes finalizar este examen primero para poder usar la corrección automática.
                  </p>
                </div>
              )}

              {/* Mostrar área de arrastre solo si no hay archivo seleccionado, si está expandida y si el examen está finalizado */}
              {(!pdfFile || uploadExpanded) && exam.status === 'finalized' && (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => document.getElementById('pdf-upload').click()}
                >
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Arrastra el PDF aquí
                  </h3>
                  <p className="text-gray-500 mb-4">
                    o haz click para seleccionar un archivo
                  </p>
                  <Button
                    type="button"
                    disabled={!servicesReady || exam.status !== 'finalized'}
                  >
                    Seleccionar PDF
                  </Button>
                  <p className="text-xs text-gray-500 mt-3">
                    Formato soportado: PDF (máximo 200 páginas)
                  </p>

                  <input
                    id="pdf-upload"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              )}

              {/* Selected file */}
              {pdfFile && exam.status === 'finalized' && (
                <div className="mt-6 space-y-3">
                  <h4 className="font-medium">Archivo seleccionado:</h4>
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">{pdfFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      disabled={isProcessing}
                    >
                      ×
                    </Button>
                  </div>

                  <Button
                    onClick={handleProcess}
                    disabled={isProcessing || !servicesReady}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      'Procesar y Corregir'
                    )}
                  </Button>
                </div>
              )}

              {/* Error */}
              {error && (
                <Card className="mt-4 border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-900">Error</p>
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Progress */}
          {isProcessing && progress && (
            <Card>
              <CardHeader>
                <CardTitle>Procesando</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{progress.stage}</span>
                    <span className="text-sm font-mono">
                      {progress.current}/{progress.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    {progress.percentage}%
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results preview in upload tab */}
          {results && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Corrección Completada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">
                      {results.processedPages}
                    </div>
                    <div className="text-sm text-gray-600">Hojas Procesadas</div>
                  </div>

                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">
                      {results.identified}
                    </div>
                    <div className="text-sm text-gray-600">Identificados</div>
                  </div>

                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-3xl font-bold text-yellow-600">
                      {results.pending}
                    </div>
                    <div className="text-sm text-gray-600">Pendientes</div>
                  </div>

                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-3xl font-bold text-red-600">
                      {results.errors}
                    </div>
                    <div className="text-sm text-gray-600">Requieren Revisión</div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    ✅ Las correcciones han sido guardadas en la base de datos.
                    Puedes revisar los resultados en la pestaña de Resultados o las hojas de respuesta en la pestaña correspondiente.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Pestaña de Hojas de Respuestas */}
        <TabsContent value="answers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Hojas de Respuestas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {answerSheets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay hojas de respuesta procesadas aún</p>
                  <p className="text-sm mt-2">Procesa un PDF para ver las hojas de respuesta aquí</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {answerSheets.map((sheet) => (
                    <AnswerSheetThumbnail
                      key={sheet.id}
                      sheet={sheet}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña de Resultados */}
        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Resultados de Corrección
              </CardTitle>
            </CardHeader>
            <CardContent>
              {processedResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay resultados procesados aún</p>
                  <p className="text-sm mt-2">Procesa un PDF para ver los resultados aquí</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">RUT</th>
                        <th className="text-left py-3 px-4">Puntaje</th>
                        <th className="text-left py-3 px-4">Porcentaje</th>
                        <th className="text-left py-3 px-4">Nota</th>
                        <th className="text-left py-3 px-4">Estado</th>
                        <th className="text-left py-3 px-4">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedResults.map((result, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium">{result.detectedRUT || 'Sin RUT'}</div>
                            {result.studentId && (
                              <div className="text-xs text-gray-500">ID: {result.studentId}</div>
                            )}
                          </td>
                          <td className="py-3 px-4">{result.score}</td>
                          <td className="py-3 px-4">{result.percentage}%</td>
                          <td className="py-3 px-4 font-medium">{result.grade ? result.grade.toFixed(1) : 'N/A'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              !result.rutValid ? 'bg-red-100 text-red-800' :
                              result.needsReview ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {!result.rutValid ? 'RUT inválido' :
                               result.needsReview ? 'Requiere revisión' :
                               'Válido'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {result.correctedAt ? new Date(result.correctedAt).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CorrectionTab;

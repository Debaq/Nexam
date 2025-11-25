import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import correctionService from '@/features/correction/services/correctionService';

export const CorrectionTab = ({ exam }) => {
  const [pdfFile, setPdfFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [servicesReady, setServicesReady] = useState(false);

  // Verificar servicios al montar
  useEffect(() => {
    const checkServices = async () => {
      const status = await correctionService.checkServicesAvailability();
      setServicesReady(status.opencv && status.yolo);
    };
    checkServices();
  }, []);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setError(null);
      setResults(null);
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
  };

  return (
    <div className="space-y-6">
      {/* Info header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 p-2 rounded-full">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Corrección Automática con IA</h3>
            <p className="text-blue-800 mt-2">
              Sube el PDF con las hojas de respuesta escaneadas. El sistema usa Computer Vision (OpenCV + YOLO)
              para detectar RUTs, identificar respuestas marcadas y calcular notas automáticamente.
            </p>
            {exam.status !== 'finalized' && (
              <p className="text-yellow-700 mt-3 font-medium">
                ⚠️ Debes finalizar este examen primero para poder usar la corrección automática.
              </p>
            )}
          </div>
        </div>
      </div>

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
                  <code className="bg-yellow-100 px-1 rounded">/public/models/yolo11n_marks_detection.onnx</code>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Subir PDF de Hojas Escaneadas
          </CardTitle>
        </CardHeader>
        <CardContent>
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

          {/* Selected file */}
          {pdfFile && (
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

      {/* Results */}
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
                Puedes revisar los resultados en la pestaña de Análisis o exportarlos desde Reportes.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CorrectionTab;

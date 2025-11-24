import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { examService } from '../services/examService';
import { pdfGenerator } from '@/core/export/pdfGenerator';
import { CheckCircle } from 'lucide-react';

const STEPS = [
  { id: 1, name: 'Configuración', description: 'Título, fecha y tipo' },
  { id: 2, name: 'Preguntas', description: 'Seleccionar preguntas' },
  { id: 3, name: 'Estudiantes', description: 'Asignar estudiantes' },
  { id: 4, name: 'Opciones', description: 'Aleatorización' },
  { id: 5, name: 'Confirmar', description: 'Revisar y generar' }
];

export const ExamWizard = ({ open, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [examData, setExamData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    duration: 90,
    type: 'uniform',
    folder: 'Sin carpeta',
    questions: [],
    students: [],
    anonymousCount: 0,
    csvFile: null,
    pointsPerQuestion: 1,
    passingGrade: 60,
    randomization: {
      shuffleQuestions: false,
      shuffleAlternatives: false
    },
    pdfOptions: {
      subtitle: '',
      instructions: 'Lea cuidadosamente cada pregunta antes de responder. Marque sus respuestas en la hoja de respuestas adjunta.',
      logo: null,
      footerMessage: '',
      showStudentInfo: true,
      showInstructions: true,
      fontSize: 'medium',
      includeAnswerKey: true
    }
  });

  const updateExamData = (field, value) => {
    setExamData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Crear examen
      const exam = await examService.create(examData);

      // Generar PDFs si hay estudiantes
      if (examData.students.length > 0) {
        // TODO: Generar PDFs para cada estudiante
      }

      onComplete?.(exam);
      handleClose();
    } catch (error) {
      alert('Error al crear examen: ' + error.message);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setExamData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      duration: 90,
      type: 'uniform',
      folder: 'Sin carpeta',
      questions: [],
      students: [],
      anonymousCount: 0,
      csvFile: null,
      pointsPerQuestion: 1,
      passingGrade: 60,
      randomization: {
        shuffleQuestions: false,
        shuffleAlternatives: false
      },
      pdfOptions: {
        subtitle: '',
        instructions: 'Lea cuidadosamente cada pregunta antes de responder. Marque sus respuestas en la hoja de respuestas adjunta.',
        logo: null,
        footerMessage: '',
        showStudentInfo: true,
        showInstructions: true,
        fontSize: 'medium',
        includeAnswerKey: true
      }
    });
    onClose?.();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1Config examData={examData} updateExamData={updateExamData} />;
      case 2:
        return <Step2Questions examData={examData} updateExamData={updateExamData} />;
      case 3:
        return <Step3Students examData={examData} updateExamData={updateExamData} />;
      case 4:
        return <Step4Options examData={examData} updateExamData={updateExamData} />;
      case 5:
        return <Step5Confirm examData={examData} />;
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return examData.title.trim() !== '' && examData.date !== '';
      case 2:
        return true; // Preguntas son opcionales ahora
      case 3:
        return examData.type === 'uniform' || examData.students.length > 0 || examData.anonymousCount > 0;
      default:
        return true;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Examen</DialogTitle>
        </DialogHeader>

        {/* Steps indicator */}
        <div className="flex items-center justify-between mb-6">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                {index > 0 && (
                  <div className={`flex-1 h-0.5 ${currentStep > step.id - 1 ? 'bg-primary' : 'bg-gray-200'}`} />
                )}
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep > step.id ? 'bg-primary border-primary text-white' :
                  currentStep === step.id ? 'border-primary text-primary' :
                  'border-gray-300 text-gray-300'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 ${currentStep > step.id ? 'bg-primary' : 'bg-gray-200'}`} />
                )}
              </div>
              <div className="text-center mt-2">
                <div className={`text-xs font-medium ${currentStep === step.id ? 'text-primary' : 'text-gray-500'}`}>
                  {step.name}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="min-h-[300px]">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Anterior
          </Button>

          {currentStep < STEPS.length ? (
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
            >
              Siguiente
            </Button>
          ) : (
            <Button onClick={handleComplete}>
              Crear Examen
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Step 1: Configuration
const Step1Config = ({ examData, updateExamData }) => (
  <div className="space-y-4">
    <div>
      <Label htmlFor="title">Título del Examen *</Label>
      <Input
        id="title"
        value={examData.title}
        onChange={(e) => updateExamData('title', e.target.value)}
        placeholder="Ej: Examen de Matemáticas - Unidad 1"
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="date">Fecha *</Label>
        <Input
          id="date"
          type="date"
          value={examData.date}
          onChange={(e) => updateExamData('date', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="duration">Duración (minutos)</Label>
        <Input
          id="duration"
          type="number"
          value={examData.duration}
          onChange={(e) => updateExamData('duration', parseInt(e.target.value))}
          min="1"
        />
      </div>
    </div>

    <div>
      <Label htmlFor="folder">Carpeta / Categoría</Label>
      <Input
        id="folder"
        value={examData.folder}
        onChange={(e) => updateExamData('folder', e.target.value)}
        placeholder="Ej: Matemáticas 2024"
      />
      <p className="text-xs text-muted-foreground mt-1">
        Organiza tus exámenes por temática o periodo
      </p>
    </div>

    <div>
      <Label>Tipo de Evaluación</Label>
      <div className="flex gap-4 mt-2">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="type"
            value="uniform"
            checked={examData.type === 'uniform'}
            onChange={(e) => updateExamData('type', e.target.value)}
          />
          <span>Uniforme (mismo examen para todos)</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="type"
            value="differentiated"
            checked={examData.type === 'differentiated'}
            onChange={(e) => updateExamData('type', e.target.value)}
          />
          <span>Diferenciado (código único por estudiante)</span>
        </label>
      </div>
    </div>
  </div>
);

// Step 2: Select Questions
const Step2Questions = ({ examData, updateExamData }) => {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>Opcional:</strong> Puedes agregar preguntas ahora o hacerlo después desde el banco de preguntas.
        </p>
      </div>

      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">
          {examData.questions.length === 0
            ? 'No hay preguntas agregadas aún'
            : `${examData.questions.length} pregunta(s) seleccionada(s)`
          }
        </p>
        <Button variant="outline" disabled>
          Seleccionar del Banco de Preguntas
          <span className="ml-2 text-xs">(Próximamente)</span>
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Puedes continuar sin preguntas y agregarlas más tarde
      </p>
    </div>
  );
};

// Step 3: Assign Students
const Step3Students = ({ examData, updateExamData }) => {
  const [mode, setMode] = React.useState('select'); // select, csv, anonymous

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      updateExamData('csvFile', file);
      // TODO: Parsear CSV y extraer estudiantes
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>¿Cómo quieres asignar estudiantes?</Label>
        <div className="grid grid-cols-3 gap-3 mt-2">
          <button
            onClick={() => setMode('select')}
            className={`p-4 border-2 rounded-lg text-left transition-colors ${
              mode === 'select' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium">Seleccionar</div>
            <div className="text-xs text-muted-foreground mt-1">Del registro de estudiantes</div>
          </button>

          <button
            onClick={() => setMode('csv')}
            className={`p-4 border-2 rounded-lg text-left transition-colors ${
              mode === 'csv' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium">Importar CSV</div>
            <div className="text-xs text-muted-foreground mt-1">Subir nómina en CSV</div>
          </button>

          <button
            onClick={() => setMode('anonymous')}
            className={`p-4 border-2 rounded-lg text-left transition-colors ${
              mode === 'anonymous' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium">Anónimas</div>
            <div className="text-xs text-muted-foreground mt-1">Número de pruebas</div>
          </button>
        </div>
      </div>

      {mode === 'select' && (
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-3">
            Selecciona estudiantes del registro
          </p>
          <Button variant="outline" disabled>
            Seleccionar Estudiantes
            <span className="ml-2 text-xs">(Próximamente)</span>
          </Button>
          <p className="text-sm mt-2">
            Estudiantes seleccionados: {examData.students.length}
          </p>
        </div>
      )}

      {mode === 'csv' && (
        <div className="py-4">
          <Label htmlFor="csv">Archivo CSV</Label>
          <Input
            id="csv"
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Formato esperado: RUT, Nombre, Apellido, Email (opcional)
          </p>
          {examData.csvFile && (
            <p className="text-sm text-green-600 mt-2">
              ✓ Archivo cargado: {examData.csvFile.name}
            </p>
          )}
        </div>
      )}

      {mode === 'anonymous' && (
        <div className="py-4">
          <Label htmlFor="count">Número de Pruebas</Label>
          <Input
            id="count"
            type="number"
            min="1"
            value={examData.anonymousCount}
            onChange={(e) => updateExamData('anonymousCount', parseInt(e.target.value) || 0)}
            placeholder="Ej: 30"
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Se generarán {examData.anonymousCount || 0} pruebas sin asignar estudiantes
          </p>
        </div>
      )}
    </div>
  );
};

// Step 4: PDF Options & Randomization
const Step4Options = ({ examData, updateExamData }) => {
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        updateExamData('pdfOptions', {
          ...examData.pdfOptions,
          logo: event.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado del PDF */}
      <div>
        <Label className="text-base font-semibold">Encabezado del PDF</Label>
        <div className="space-y-3 mt-3">
          <div>
            <Label htmlFor="subtitle">Subtítulo (opcional)</Label>
            <Input
              id="subtitle"
              value={examData.pdfOptions.subtitle}
              onChange={(e) => updateExamData('pdfOptions', {
                ...examData.pdfOptions,
                subtitle: e.target.value
              })}
              placeholder="Ej: Primer Semestre 2024"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Aparece debajo del título principal
            </p>
          </div>

          <div>
            <Label htmlFor="logo">Logo de la institución (opcional)</Label>
            <Input
              id="logo"
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleLogoUpload}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Formatos aceptados: PNG, JPG. Máx 500KB
            </p>
            {examData.pdfOptions.logo && (
              <div className="mt-2 flex items-center gap-2">
                <img
                  src={examData.pdfOptions.logo}
                  alt="Logo preview"
                  className="h-12 object-contain"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateExamData('pdfOptions', {
                    ...examData.pdfOptions,
                    logo: null
                  })}
                >
                  Eliminar
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instrucciones */}
      <div>
        <Label className="text-base font-semibold">Instrucciones</Label>
        <div className="space-y-3 mt-3">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={examData.pdfOptions.showInstructions}
              onChange={(e) => updateExamData('pdfOptions', {
                ...examData.pdfOptions,
                showInstructions: e.target.checked
              })}
              className="mt-1"
            />
            <div>
              <div className="font-medium">Mostrar instrucciones en el PDF</div>
              <div className="text-sm text-muted-foreground">
                Incluye instrucciones al inicio del examen
              </div>
            </div>
          </label>

          {examData.pdfOptions.showInstructions && (
            <div>
              <Label htmlFor="instructions">Texto de instrucciones</Label>
              <textarea
                id="instructions"
                value={examData.pdfOptions.instructions}
                onChange={(e) => updateExamData('pdfOptions', {
                  ...examData.pdfOptions,
                  instructions: e.target.value
                })}
                className="w-full min-h-[100px] p-2 text-sm border rounded-md mt-1"
                placeholder="Escriba las instrucciones del examen..."
              />
            </div>
          )}
        </div>
      </div>

      {/* Información del estudiante */}
      <div>
        <Label className="text-base font-semibold">Información del Estudiante</Label>
        <div className="space-y-3 mt-3">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={examData.pdfOptions.showStudentInfo}
              onChange={(e) => updateExamData('pdfOptions', {
                ...examData.pdfOptions,
                showStudentInfo: e.target.checked
              })}
              className="mt-1"
            />
            <div>
              <div className="font-medium">Incluir campos para datos del estudiante</div>
              <div className="text-sm text-muted-foreground">
                Espacios para nombre, RUT, fecha, etc.
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Pie de página */}
      <div>
        <Label className="text-base font-semibold">Pie de Página</Label>
        <div className="space-y-3 mt-3">
          <div>
            <Label htmlFor="footerMessage">Mensaje final (opcional)</Label>
            <Input
              id="footerMessage"
              value={examData.pdfOptions.footerMessage}
              onChange={(e) => updateExamData('pdfOptions', {
                ...examData.pdfOptions,
                footerMessage: e.target.value
              })}
              placeholder="Ej: ¡Éxito en tu evaluación!"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Aparece al final del examen
            </p>
          </div>
        </div>
      </div>

      {/* Formato */}
      <div>
        <Label className="text-base font-semibold">Formato del PDF</Label>
        <div className="space-y-3 mt-3">
          <div>
            <Label htmlFor="fontSize">Tamaño de fuente</Label>
            <select
              id="fontSize"
              value={examData.pdfOptions.fontSize}
              onChange={(e) => updateExamData('pdfOptions', {
                ...examData.pdfOptions,
                fontSize: e.target.value
              })}
              className="w-full p-2 border rounded-md mt-1"
            >
              <option value="small">Pequeña (más preguntas por página)</option>
              <option value="medium">Media (recomendado)</option>
              <option value="large">Grande (mejor legibilidad)</option>
            </select>
          </div>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={examData.pdfOptions.includeAnswerKey}
              onChange={(e) => updateExamData('pdfOptions', {
                ...examData.pdfOptions,
                includeAnswerKey: e.target.checked
              })}
              className="mt-1"
            />
            <div>
              <div className="font-medium">Generar pauta de respuestas</div>
              <div className="text-sm text-muted-foreground">
                Crea un PDF adicional con las respuestas correctas
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Aleatorización */}
      <div>
        <Label className="text-base font-semibold">Aleatorización</Label>
        <div className="space-y-3 mt-3">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={examData.randomization.shuffleQuestions}
              onChange={(e) => updateExamData('randomization', {
                ...examData.randomization,
                shuffleQuestions: e.target.checked
              })}
              className="mt-1"
            />
            <div>
              <div className="font-medium">Mezclar orden de preguntas</div>
              <div className="text-sm text-muted-foreground">
                Cada PDF tendrá las preguntas en diferente orden
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={examData.randomization.shuffleAlternatives}
              onChange={(e) => updateExamData('randomization', {
                ...examData.randomization,
                shuffleAlternatives: e.target.checked
              })}
              className="mt-1"
            />
            <div>
              <div className="font-medium">Mezclar alternativas</div>
              <div className="text-sm text-muted-foreground">
                Las alternativas A, B, C, D estarán en diferente orden en cada PDF
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};

// Step 5: Confirmation
const Step5Confirm = ({ examData }) => (
  <div className="space-y-4">
    <div className="p-4 bg-muted rounded-lg">
      <h3 className="font-semibold mb-3">Resumen del Examen</h3>
      <div className="space-y-3">
        {/* Información básica */}
        <div>
          <h4 className="text-sm font-medium mb-2">Información Básica</h4>
          <div className="space-y-1 text-sm pl-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Título:</span>
              <span className="font-medium">{examData.title}</span>
            </div>
            {examData.pdfOptions.subtitle && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtítulo:</span>
                <span>{examData.pdfOptions.subtitle}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha:</span>
              <span>{new Date(examData.date).toLocaleDateString('es-CL')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duración:</span>
              <span>{examData.duration} minutos</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipo:</span>
              <span>{examData.type === 'uniform' ? 'Uniforme' : 'Diferenciado'}</span>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div>
          <h4 className="text-sm font-medium mb-2">Contenido</h4>
          <div className="space-y-1 text-sm pl-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Preguntas:</span>
              <span>{examData.questions.length || 'Ninguna (agregar después)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estudiantes:</span>
              <span>
                {examData.students.length > 0
                  ? examData.students.length
                  : examData.anonymousCount > 0
                    ? `${examData.anonymousCount} anónimas`
                    : 'Ninguno'}
              </span>
            </div>
          </div>
        </div>

        {/* Puntuación */}
        <div>
          <h4 className="text-sm font-medium mb-2">Puntuación y Corrección</h4>
          <div className="space-y-1 text-sm pl-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Puntos por pregunta:</span>
              <span>{examData.pointsPerQuestion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nota mínima:</span>
              <span>{examData.passingGrade}%</span>
            </div>
          </div>
        </div>

        {/* Opciones de PDF */}
        <div>
          <h4 className="text-sm font-medium mb-2">Configuración del PDF</h4>
          <div className="text-sm pl-3">
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              {examData.pdfOptions.logo && (
                <li>Incluye logo de la institución</li>
              )}
              {examData.pdfOptions.showInstructions && (
                <li>Muestra instrucciones</li>
              )}
              {examData.pdfOptions.showStudentInfo && (
                <li>Incluye campos para datos del estudiante</li>
              )}
              {examData.pdfOptions.footerMessage && (
                <li>Mensaje final: "{examData.pdfOptions.footerMessage}"</li>
              )}
              <li>Tamaño de fuente: {
                examData.pdfOptions.fontSize === 'small' ? 'Pequeña' :
                examData.pdfOptions.fontSize === 'large' ? 'Grande' : 'Media'
              }</li>
              {examData.pdfOptions.includeAnswerKey && (
                <li>Genera pauta de respuestas</li>
              )}
              {examData.randomization.shuffleQuestions && (
                <li>Preguntas en orden aleatorio</li>
              )}
              {examData.randomization.shuffleAlternatives && (
                <li>Alternativas mezcladas</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
    <p className="text-sm text-muted-foreground">
      Al confirmar se creará el examen. Podrás generar los PDFs desde la vista de detalle.
    </p>
  </div>
);

export default ExamWizard;

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { examService } from '../services/examService';
import { CheckCircle } from 'lucide-react';
import QuestionSelector from './QuestionSelector';
import { useQuestions } from '@/features/questions/hooks/useQuestions';

const STEPS = [
  { id: 1, name: 'Tipo de Examen', description: 'Con base de datos o hoja de respuestas' },
  { id: 2, name: 'Configuración', description: 'Título, fecha y variaciones' },
  { id: 3, name: 'Preguntas', description: 'Seleccionar preguntas o configurar' },
  { id: 4, name: 'Estudiantes', description: 'Asignar estudiantes' },
  { id: 5, name: 'Opciones', description: 'Aleatorización' },
  { id: 6, name: 'Confirmar', description: 'Revisar y generar' }
];

export const ExamWizard = ({ open, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [examData, setExamData] = useState({
    examType: 'withDatabase', // 'withDatabase' o 'answerSheetOnly'
    variations: 1, // Número de variaciones del examen (solo para withDatabase)
    title: '',
    date: new Date().toISOString().split('T')[0],
    duration: 90,
    folder: 'Sin carpeta',
    questions: [], // IDs de preguntas de la base de datos
    answerSheetQuestions: [], // Estructura de preguntas para hojas de respuestas
    students: [],
    anonymousCount: 0,
    csvFile: null,
    pointsPerQuestion: 1,
    passingGrade: 60,
    grading: {
      maxGrade: 7.0,
      minGrade: 1.0,
      passingGrade: 4.0,
      demandPercentage: 60
    },
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
      // Validar preguntas según el tipo de examen
      if (examData.examType === 'withDatabase') {
        if (!examData.questions || examData.questions.length === 0) {
          const confirmNoQuestions = window.confirm(
            'No has seleccionado ninguna pregunta para este examen. ¿Deseas continuar de todas formas? ' +
            'Podrás agregar preguntas más tarde desde la vista de detalle del examen.'
          );

          if (!confirmNoQuestions) {
            return;
          }
        }
      } else {
        // Para examen de hoja de respuestas, verificar que haya preguntas configuradas
        if (!examData.answerSheetQuestions || examData.answerSheetQuestions.length === 0) {
          alert('Debes configurar al menos una pregunta para el examen de hoja de respuestas.');
          return;
        }
      }

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
      examType: 'withDatabase', // 'withDatabase' o 'answerSheetOnly'
      variations: 1, // Número de variaciones del examen (solo para withDatabase)
      title: '',
      date: new Date().toISOString().split('T')[0],
      duration: 90,
      folder: 'Sin carpeta',
      questions: [], // IDs de preguntas de la base de datos
      answerSheetQuestions: [], // Estructura de preguntas para hojas de respuestas
      students: [],
      anonymousCount: 0,
      csvFile: null,
      pointsPerQuestion: 1,
      passingGrade: 60,
      grading: {
        maxGrade: 7.0,
        minGrade: 1.0,
        passingGrade: 4.0,
        demandPercentage: 60
      },
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
        return <Step1ExamType examData={examData} updateExamData={updateExamData} />;
      case 2:
        return <Step2Config examData={examData} updateExamData={updateExamData} />;
      case 3:
        return <Step3Questions examData={examData} updateExamData={updateExamData} />;
      case 4:
        return <Step4Students examData={examData} updateExamData={updateExamData} />;
      case 5:
        return <Step5Options examData={examData} updateExamData={updateExamData} />;
      case 6:
        return <Step6Confirm examData={examData} />;
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return examData.examType === 'withDatabase' || examData.examType === 'answerSheetOnly';
      case 2:
        return examData.title.trim() !== '' && examData.date !== '';
      case 3:
        // Para examen con base de datos: verificar que haya preguntas o que se vayan a añadir más tarde
        // Para hoja de respuestas: verificar que se hayan definido preguntas
        if (examData.examType === 'withDatabase') {
          return true; // Las preguntas se pueden añadir en el paso siguiente
        } else {
          // Para hoja de respuestas, verificar que se hayan definido las preguntas
          return examData.answerSheetQuestions.length > 0;
        }
      case 4:
        return true; // No es obligatorio seleccionar estudiantes
      default:
        return true;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Examen</DialogTitle>
          <DialogDescription>
            Configura un nuevo examen paso a paso: tipo, preguntas, estudiantes y opciones de personalización.
          </DialogDescription>
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

// Step 1: Choose Exam Type
const Step1ExamType = ({ examData, updateExamData }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Tipo de Examen</h3>
      <p className="text-sm text-muted-foreground">
        Elige cómo será generado este examen
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div
          className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
            examData.examType === 'withDatabase'
              ? 'border-primary bg-primary/5'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => updateExamData('examType', 'withDatabase')}
        >
          <div className="font-semibold text-lg mb-2">Con Base de Datos</div>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Basado en preguntas de la base de datos</li>
            <li>• Seleccionar desde el banco de preguntas</li>
            <li>• Puedes definir variaciones del examen</li>
            <li>• Ideal para exámenes con preguntas reutilizables</li>
          </ul>
        </div>

        <div
          className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
            examData.examType === 'answerSheetOnly'
              ? 'border-primary bg-primary/5'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => updateExamData('examType', 'answerSheetOnly')}
        >
          <div className="font-semibold text-lg mb-2">Solo Hoja de Respuestas</div>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Configurar preguntas directamente</li>
            <li>• Definir número de preguntas y alternativas</li>
            <li>• Seleccionar respuestas correctas</li>
            <li>• Ideal para exámenes únicos o temporales</li>
          </ul>
        </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mt-4">
        <p className="text-sm text-blue-900">
          <strong>Consejo:</strong> Usa "Con Base de Datos" para preguntas que reutilizarás frecuentemente. 
          Usa "Solo Hoja de Respuestas" para crear exámenes temporales sin tener que gestionar preguntas en la base de datos.
        </p>
      </div>
    </div>
  );
};

// Step 2: Configuration
const Step2Config = ({ examData, updateExamData }) => {
  const updateGradingField = (field, value) => {
    updateExamData('grading', {
      ...examData.grading,
      [field]: parseFloat(value) || 0
    });
  };

  const handleVariationsChange = (value) => {
    const variations = Math.max(1, parseInt(value) || 1);
    updateExamData('variations', variations);

    // Si hay más de una variación, activar mezcla de preguntas
    if (variations > 1) {
      updateExamData('randomization', {
        ...examData.randomization,
        shuffleQuestions: true
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Información Básica */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>

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

        {/* Configuración de variaciones */}
        <div>
          <Label htmlFor="variations">Número de Variaciones</Label>
          <Input
            id="variations"
            type="number"
            value={examData.variations}
            onChange={(e) => handleVariationsChange(e.target.value)}
            min="1"
            max="10"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Número de versiones diferentes del examen (mezcla preguntas)
          </p>
        </div>
      </div>

      {/* Configuración de Calificación */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-semibold text-gray-900">Escala de Calificación</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="maxGrade">Nota Máxima</Label>
            <Input
              id="maxGrade"
              type="number"
              step="0.1"
              min="1"
              max="10"
              value={examData.grading.maxGrade}
              onChange={(e) => updateGradingField('maxGrade', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="minGrade">Nota Mínima</Label>
            <Input
              id="minGrade"
              type="number"
              step="0.1"
              min="1"
              max="10"
              value={examData.grading.minGrade}
              onChange={(e) => updateGradingField('minGrade', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="passingGrade">Nota de Aprobación</Label>
            <Input
              id="passingGrade"
              type="number"
              step="0.1"
              min="1"
              max="10"
              value={examData.grading.passingGrade}
              onChange={(e) => updateGradingField('passingGrade', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="demandPercentage">% de Exigencia</Label>
            <Input
              id="demandPercentage"
              type="number"
              step="1"
              min="1"
              max="100"
              value={examData.grading.demandPercentage}
              onChange={(e) => updateGradingField('demandPercentage', e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Porcentaje mínimo para alcanzar la nota de aprobación
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Step 3: Select Questions
const Step3Questions = ({ examData, updateExamData }) => {
  // Si es examen con base de datos, usar el selector de preguntas existente
  if (examData.examType === 'withDatabase') {
    const { questions } = useQuestions();

    const handleQuestionsChange = (questions) => {
      // Extraer solo los IDs de las preguntas para almacenar
      const questionIds = questions.map(q => q.id);
      updateExamData('questions', questionIds);
    };

    // Convertir las preguntas seleccionadas a objetos completos para el selector
    const selectedQuestions = examData.questions.map(questionId =>
      questions.find(q => q.id === questionId)
    ).filter(Boolean); // Filtrar las que no se encuentran

    return (
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Importante:</strong> Selecciona las preguntas para este examen. Puedes continuar sin preguntas y agregarlas más tarde.
          </p>
        </div>

        <QuestionSelector
          selectedQuestions={selectedQuestions}
          onQuestionsChange={handleQuestionsChange}
        />

        <div className="flex justify-between items-center mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Preguntas seleccionadas: {examData.questions.length}
          </p>
          <div className="text-sm font-medium">
            {examData.questions.length > 0 && (
              <span className="text-green-600">
                ✓ {examData.questions.length} pregunta(s) agregada(s)
              </span>
            )}
          </div>
        </div>
      </div>
    );
  } 
  // Si es examen de hoja de respuestas, mostrar configuración de preguntas
  else if (examData.examType === 'answerSheetOnly') {
    const [numQuestions, setNumQuestions] = useState(examData.answerSheetQuestions.length || 5);
    const [numAlternatives, setNumAlternatives] = useState(examData.answerSheetQuestions[0]?.alternatives?.length || 4);

    // Actualizar preguntas cuando cambie el número de preguntas o alternativas
    React.useEffect(() => {
      // Crear o actualizar la estructura de las preguntas
      const updatedQuestions = [];
      for (let i = 0; i < numQuestions; i++) {
        if (examData.answerSheetQuestions[i]) {
          // Mantener la pregunta existente si ya existe
          updatedQuestions.push({
            ...examData.answerSheetQuestions[i],
            alternatives: examData.answerSheetQuestions[i].alternatives.slice(0, numAlternatives)
          });
        } else {
          // Crear nueva pregunta con alternativas vacías
          const alternatives = [];
          for (let j = 0; j < numAlternatives; j++) {
            alternatives.push({
              text: '',
              isCorrect: false,
              id: `alt-${i}-${j}`
            });
          }
          updatedQuestions.push({
            id: `q-${i}`,
            text: `Pregunta ${i + 1}`,
            alternatives: alternatives
          });
        }
      }
      
      updateExamData('answerSheetQuestions', updatedQuestions);
    }, [numQuestions, numAlternatives]);

    const updateAlternativeText = (questionIndex, alternativeIndex, text) => {
      const updatedQuestions = [...examData.answerSheetQuestions];
      updatedQuestions[questionIndex].alternatives[alternativeIndex].text = text;
      updateExamData('answerSheetQuestions', updatedQuestions);
    };

    const toggleAlternativeCorrect = (questionIndex, alternativeIndex) => {
      const updatedQuestions = [...examData.answerSheetQuestions];
      
      // Desmarcar todas las alternativas de esta pregunta como correctas
      updatedQuestions[questionIndex].alternatives.forEach(alt => {
        alt.isCorrect = false;
      });
      
      // Marcar solo la seleccionada como correcta
      updatedQuestions[questionIndex].alternatives[alternativeIndex].isCorrect = true;
      
      updateExamData('answerSheetQuestions', updatedQuestions);
    };

    return (
      <div className="space-y-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Configuración de Examen:</strong> Define el número de preguntas y alternativas para crear la hoja de respuestas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="numQuestions">Número de Preguntas</Label>
            <Input
              id="numQuestions"
              type="number"
              value={numQuestions}
              onChange={(e) => {
                const value = Math.max(1, parseInt(e.target.value) || 1);
                setNumQuestions(value);
              }}
              min="1"
              max="100"
            />
          </div>
          
          <div>
            <Label htmlFor="numAlternatives">Número de Alternativas por Pregunta</Label>
            <Input
              id="numAlternatives"
              type="number"
              value={numAlternatives}
              onChange={(e) => {
                const value = Math.max(2, parseInt(e.target.value) || 2);
                setNumAlternatives(value);
              }}
              min="2"
              max="10"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Preguntas y Alternativas</h3>
          
          {examData.answerSheetQuestions.map((question, questionIndex) => (
            <div key={question.id} className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">Pregunta {questionIndex + 1}</h4>
              
              <div className="space-y-3">
                {question.alternatives.map((alternative, altIndex) => (
                  <div key={alternative.id} className="flex items-center gap-3">
                    <input
                      type="radio"
                      id={`correct-${questionIndex}-${altIndex}`}
                      name={`correct-${questionIndex}`}
                      checked={alternative.isCorrect}
                      onChange={() => toggleAlternativeCorrect(questionIndex, altIndex)}
                    />
                    <Label htmlFor={`correct-${questionIndex}-${altIndex}`} className="flex-1">
                      <Input
                        value={alternative.text}
                        onChange={(e) => updateAlternativeText(questionIndex, altIndex, e.target.value)}
                        placeholder={`Alternativa ${String.fromCharCode(65 + altIndex)}`}
                      />
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

// Step 4: Assign Students
const Step4Students = ({ examData, updateExamData }) => {
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

// Step 5: PDF Options & Randomization
const Step5Options = ({ examData, updateExamData }) => {
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

  // Para examen de hoja de respuestas con más de una variación, forzar mezcla de preguntas
  const isAnswerSheetWithVariations = examData.examType === 'answerSheetOnly' && examData.variations > 1;
  
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
              checked={examData.randomization.shuffleQuestions || isAnswerSheetWithVariations}
              onChange={(e) => {
                if (!isAnswerSheetWithVariations) {
                  updateExamData('randomization', {
                    ...examData.randomization,
                    shuffleQuestions: e.target.checked
                  });
                }
              }}
              disabled={isAnswerSheetWithVariations}
              className="mt-1"
            />
            <div>
              <div className="font-medium">Mezclar orden de preguntas</div>
              <div className="text-sm text-muted-foreground">
                Cada PDF tendrá las preguntas en diferente orden
                {isAnswerSheetWithVariations && (
                  <span className="block text-blue-600 font-medium">
                    Obligatorio: activado porque hay más de una variación
                  </span>
                )}
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

// Step 6: Confirmation
const Step6Confirm = ({ examData }) => (
  <div className="space-y-4">
    <div className="p-4 bg-muted rounded-lg">
      <h3 className="font-semibold mb-3">Resumen del Examen</h3>
      <div className="space-y-3">
        {/* Tipo de examen */}
        <div>
          <h4 className="text-sm font-medium mb-2">Tipo de Examen</h4>
          <div className="space-y-1 text-sm pl-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Modalidad:</span>
              <span>
                {examData.examType === 'withDatabase'
                  ? 'Con Base de Datos'
                  : 'Solo Hoja de Respuestas'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Variaciones:</span>
              <span>{examData.variations}</span>
            </div>
          </div>
        </div>

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
          </div>
        </div>

        {/* Contenido */}
        <div>
          <h4 className="text-sm font-medium mb-2">Contenido</h4>
          <div className="space-y-1 text-sm pl-3">
            {examData.examType === 'withDatabase' ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Preguntas (base de datos):</span>
                <span>{examData.questions.length || 'Ninguna (agregar después)'}</span>
              </div>
            ) : (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Preguntas (hoja de respuestas):</span>
                <span>{examData.answerSheetQuestions.length || 'Ninguna'}</span>
              </div>
            )}
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
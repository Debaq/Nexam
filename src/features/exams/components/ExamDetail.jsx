import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/storage/db';
import { examService } from '../services/examService';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import {
  ArrowLeft,
  FileText,
  Users,
  Settings,
  Download,
  Plus,
  Trash2,
  Edit,
  FileDown
} from 'lucide-react';

export const ExamDetail = ({ examId, onBack }) => {
  const exam = useLiveQuery(() => db.exams.get(examId), [examId]);
  const [activeTab, setActiveTab] = useState('overview');

  if (!exam) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Cargando examen...</p>
      </div>
    );
  }

  const handleGeneratePDFs = () => {
    alert('Generación de PDFs próximamente');
  };

  const handleExportGift = async () => {
    try {
      const { filename, content, questionCount } = await examService.exportToGift(examId);

      // Crear blob y descargar
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(`Examen exportado: ${questionCount} preguntas`);
    } catch (error) {
      alert('Error al exportar: ' + error.message);
    }
  };

  const handleAddQuestions = () => {
    alert('Selector de preguntas próximamente');
  };

  const handleAddStudents = () => {
    alert('Selector de estudiantes próximamente');
  };

  const handleEditConfig = () => {
    alert('Editar configuración próximamente');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Exámenes
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{exam.title}</h1>
            <p className="text-muted-foreground mt-1">
              {new Date(exam.date).toLocaleDateString('es-CL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleGeneratePDFs}>
              <Download className="w-4 h-4 mr-2" />
              Generar PDFs
            </Button>
            <Button onClick={handleExportGift} variant="outline">
              <FileDown className="w-4 h-4 mr-2" />
              Exportar GIFT
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-primary text-primary font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Vista General
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'questions'
              ? 'border-primary text-primary font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Preguntas ({exam.questions.length})
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'students'
              ? 'border-primary text-primary font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Estudiantes ({exam.students.length})
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'config'
              ? 'border-primary text-primary font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Configuración
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab exam={exam} onGeneratePDFs={handleGeneratePDFs} />
      )}
      {activeTab === 'questions' && (
        <QuestionsTab
          exam={exam}
          onAddQuestions={handleAddQuestions}
        />
      )}
      {activeTab === 'students' && (
        <StudentsTab
          exam={exam}
          onAddStudents={handleAddStudents}
        />
      )}
      {activeTab === 'config' && (
        <ConfigTab
          exam={exam}
          onEdit={handleEditConfig}
        />
      )}
    </div>
  );
};

// Overview Tab
const OverviewTab = ({ exam, onGeneratePDFs }) => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Información General
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tipo:</span>
          <span className="font-medium">
            {exam.type === 'uniform' ? 'Uniforme' : 'Diferenciado'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Duración:</span>
          <span className="font-medium">{exam.duration} minutos</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Preguntas:</span>
          <span className="font-medium">{exam.questions.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Estudiantes:</span>
          <span className="font-medium">{exam.students.length}</span>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Puntuación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Puntos/pregunta:</span>
          <span className="font-medium">{exam.pointsPerQuestion}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Nota mínima:</span>
          <span className="font-medium">{exam.passingGrade}%</span>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-base">Opciones del PDF</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="text-sm space-y-1 text-muted-foreground">
          {exam.pdfOptions?.subtitle && (
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              Subtítulo personalizado
            </li>
          )}
          {exam.pdfOptions?.logo && (
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              Logo institucional
            </li>
          )}
          {exam.pdfOptions?.showInstructions && (
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              Instrucciones incluidas
            </li>
          )}
          {exam.pdfOptions?.includeAnswerKey && (
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              Pauta de respuestas
            </li>
          )}
          {exam.randomization.shuffleQuestions && (
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              Preguntas aleatorias
            </li>
          )}
          {exam.randomization.shuffleAlternatives && (
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              Alternativas mezcladas
            </li>
          )}
          {!exam.pdfOptions?.subtitle &&
           !exam.pdfOptions?.logo &&
           !exam.pdfOptions?.showInstructions &&
           !exam.randomization.shuffleQuestions &&
           !exam.randomization.shuffleAlternatives && (
            <li className="text-muted-foreground">Configuración básica</li>
          )}
        </ul>
      </CardContent>
    </Card>

    <Card className="md:col-span-2 lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-base">Acciones Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          <Button onClick={onGeneratePDFs}>
            <Download className="w-4 h-4 mr-2" />
            Generar PDFs
          </Button>
          <Button variant="outline" disabled>
            <Users className="w-4 h-4 mr-2" />
            Ver Resultados
            <span className="ml-2 text-xs">(Próximamente)</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Questions Tab
const QuestionsTab = ({ exam, onAddQuestions }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        {exam.questions.length === 0
          ? 'No hay preguntas agregadas al examen'
          : `${exam.questions.length} pregunta(s) en el examen`
        }
      </p>
      <Button onClick={onAddQuestions}>
        <Plus className="w-4 h-4 mr-2" />
        Agregar Preguntas
      </Button>
    </div>

    {exam.questions.length === 0 ? (
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            No hay preguntas
          </h3>
          <p className="text-muted-foreground mb-6">
            Agrega preguntas desde el banco de preguntas o crea nuevas.
          </p>
          <Button onClick={onAddQuestions}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Preguntas
          </Button>
        </CardContent>
      </Card>
    ) : (
      <div className="space-y-3">
        {exam.questions.map((questionId, index) => (
          <QuestionCard key={questionId} questionId={questionId} index={index} />
        ))}
      </div>
    )}
  </div>
);

const QuestionCard = ({ questionId, index }) => {
  const question = useLiveQuery(() => db.questions.get(questionId), [questionId]);

  if (!question) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Cargando pregunta...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Pregunta {index + 1}
              </span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                {question.type === 'multiple' ? 'Selección Múltiple' :
                 question.type === 'boolean' ? 'V/F' : 'Desarrollo'}
              </span>
            </div>
            <p className="text-sm">{question.text}</p>
          </div>
          <Button variant="ghost" size="icon" className="text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
};

// Students Tab
const StudentsTab = ({ exam, onAddStudents }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        {exam.students.length === 0
          ? 'No hay estudiantes asignados'
          : `${exam.students.length} estudiante(s) asignado(s)`
        }
      </p>
      <Button onClick={onAddStudents}>
        <Plus className="w-4 h-4 mr-2" />
        Agregar Estudiantes
      </Button>
    </div>

    {exam.students.length === 0 ? (
      <Card>
        <CardContent className="p-12 text-center">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            No hay estudiantes asignados
          </h3>
          <p className="text-muted-foreground mb-6">
            Agrega estudiantes desde tu nómina o importa un CSV.
          </p>
          <Button onClick={onAddStudents}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Estudiantes
          </Button>
        </CardContent>
      </Card>
    ) : (
      <div className="space-y-3">
        {exam.students.map((studentId) => (
          <StudentCard key={studentId} studentId={studentId} examCodes={exam.codes} />
        ))}
      </div>
    )}
  </div>
);

const StudentCard = ({ studentId, examCodes }) => {
  const student = useLiveQuery(() => db.students.get(studentId), [studentId]);

  if (!student) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Cargando estudiante...</p>
        </CardContent>
      </Card>
    );
  }

  const code = examCodes ? examCodes[studentId] : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">
              {student.name} {student.lastName}
            </h4>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="font-mono">{student.rut}</span>
              {code && (
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-mono">
                  Código: {code}
                </span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
};

// Config Tab
const ConfigTab = ({ exam, onEdit }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold">Configuración del Examen</h3>
      <Button onClick={onEdit} variant="outline">
        <Edit className="w-4 h-4 mr-2" />
        Editar
      </Button>
    </div>

    <Card>
      <CardHeader>
        <CardTitle className="text-base">Información Básica</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-muted-foreground mb-1">Título</p>
            <p className="font-medium">{exam.title}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Fecha</p>
            <p className="font-medium">
              {new Date(exam.date).toLocaleDateString('es-CL')}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Duración</p>
            <p className="font-medium">{exam.duration} minutos</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Tipo</p>
            <p className="font-medium">
              {exam.type === 'uniform' ? 'Uniforme' : 'Diferenciado'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-base">Puntuación</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-muted-foreground mb-1">Puntos por pregunta</p>
            <p className="font-medium">{exam.pointsPerQuestion}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Nota mínima de aprobación</p>
            <p className="font-medium">{exam.passingGrade}%</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Penalizar incorrectas</p>
            <p className="font-medium">{exam.penalizeWrong ? 'Sí' : 'No'}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-base">Aleatorización</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Mezclar preguntas</span>
          <span className="font-medium">
            {exam.randomization.shuffleQuestions ? 'Sí' : 'No'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Mezclar alternativas</span>
          <span className="font-medium">
            {exam.randomization.shuffleAlternatives ? 'Sí' : 'No'}
          </span>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-base">Opciones de Formato del PDF</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {exam.pdfOptions?.subtitle && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtítulo</span>
            <span className="font-medium">{exam.pdfOptions.subtitle}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Tamaño de fuente</span>
          <span className="font-medium">
            {exam.pdfOptions?.fontSize === 'small' ? 'Pequeña' :
             exam.pdfOptions?.fontSize === 'large' ? 'Grande' : 'Media'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Logo institucional</span>
          <span className="font-medium">{exam.pdfOptions?.logo ? 'Sí' : 'No'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Mostrar instrucciones</span>
          <span className="font-medium">{exam.pdfOptions?.showInstructions ? 'Sí' : 'No'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Campos de estudiante</span>
          <span className="font-medium">{exam.pdfOptions?.showStudentInfo ? 'Sí' : 'No'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Pauta de respuestas</span>
          <span className="font-medium">{exam.pdfOptions?.includeAnswerKey ? 'Sí' : 'No'}</span>
        </div>
        {exam.pdfOptions?.footerMessage && (
          <div>
            <p className="text-muted-foreground mb-1">Mensaje final</p>
            <p className="font-medium">{exam.pdfOptions.footerMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
);

export default ExamDetail;

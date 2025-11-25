import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Edit, Calculator, Lock } from 'lucide-react';

export const ConfigTab = ({ exam, onEdit, onViewGradeScale }) => {
  const isFinalized = exam.status === 'finalized';

  return (
    <div className="space-y-6">
      {isFinalized && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-green-900">Examen Finalizado - Inmutable</h4>
            <p className="text-sm text-green-800 mt-1">
              Este examen ha sido finalizado y no se puede modificar. Todas las configuraciones y preguntas están bloqueadas permanentemente para garantizar la integridad académica.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Configuración del Examen</h3>
        <Button onClick={onEdit} variant="outline" disabled={isFinalized}>
          <Edit className="w-4 h-4 mr-2" />
          {isFinalized ? 'Bloqueado' : 'Editar'}
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Escala de Calificación</CardTitle>
        <Button onClick={onViewGradeScale} variant="outline" size="sm">
          <Calculator className="w-4 h-4 mr-2" />
          Ver Escala
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {exam.grading ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground mb-1">Nota Máxima</p>
              <p className="font-medium">{exam.grading.maxGrade.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Nota Mínima</p>
              <p className="font-medium">{exam.grading.minGrade.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Nota de Aprobación</p>
              <p className="font-medium text-green-700">{exam.grading.passingGrade.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">% de Exigencia</p>
              <p className="font-medium">{exam.grading.demandPercentage}%</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground mb-1">Puntaje Máximo</p>
              <p className="font-medium">
                {exam.questions?.length * (exam.pointsPerQuestion || 1)} puntos
                <span className="text-muted-foreground text-xs ml-2">
                  ({exam.questions?.length} preguntas × {exam.pointsPerQuestion} puntos)
                </span>
              </p>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">No configurada</p>
        )}
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
};

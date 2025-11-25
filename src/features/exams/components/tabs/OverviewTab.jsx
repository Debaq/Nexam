import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { FileText, Settings, Download, Users } from 'lucide-react';

export const OverviewTab = ({ exam, onGeneratePDFs }) => (
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

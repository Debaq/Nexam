import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/storage/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Plus, Calendar, Users, FileText } from 'lucide-react';

export const ExamsPage = () => {
  const exams = useLiveQuery(() => db.exams.toArray(), []);

  if (!exams) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Cargando exámenes...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Exámenes</h1>
          <p className="text-muted-foreground mt-1">
            Crea y gestiona tus evaluaciones
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Examen
        </Button>
      </div>

      {/* Lista de exámenes */}
      {exams.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No hay exámenes creados
            </h3>
            <p className="text-muted-foreground mb-6">
              Comienza creando tu primer examen. Podrás configurar preguntas,
              asignar estudiantes y generar PDFs automáticamente.
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Examen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <Card key={exam.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">{exam.title}</CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <Calendar className="w-3 h-3" />
                  {new Date(exam.date).toLocaleDateString('es-CL')}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Preguntas:</span>
                    <span className="font-medium">{exam.questions.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Estudiantes:</span>
                    <span className="font-medium">{exam.students.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {exam.type === 'uniform' ? 'Uniforme' : 'Diferenciado'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamsPage;

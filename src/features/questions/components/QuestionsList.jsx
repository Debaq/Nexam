import React from 'react';
import { useQuestions } from '../hooks/useQuestions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { FileDown, FileUp, Plus, Trash2 } from 'lucide-react';

export const QuestionsList = () => {
  const { questions, isLoading, create, deleteMany } = useQuestions();

  const handleCreateSample = async () => {
    await create({
      text: '¿Cuál es la capital de Chile?',
      type: 'multiple',
      alternatives: [
        { id: '1', text: 'Santiago', isCorrect: true },
        { id: '2', text: 'Valparaíso', isCorrect: false },
        { id: '3', text: 'Concepción', isCorrect: false },
        { id: '4', text: 'La Serena', isCorrect: false }
      ],
      category: 'Geografía',
      tags: ['chile', 'capitales']
    });
  };

  const handleDeleteAll = async () => {
    if (confirm('¿Eliminar todas las preguntas?')) {
      const ids = questions.map(q => q.id);
      await deleteMany(ids);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Cargando preguntas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Banco de Preguntas</h2>
          <p className="text-muted-foreground">
            {questions.length} {questions.length === 1 ? 'pregunta' : 'preguntas'} disponibles
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileUp className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" size="sm" disabled={questions.length === 0}>
            <FileDown className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button size="sm" onClick={handleCreateSample}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Pregunta
          </Button>
        </div>
      </div>

      {/* Lista de preguntas */}
      {questions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              No hay preguntas aún. Crea tu primera pregunta o importa desde un archivo.
            </p>
            <Button onClick={handleCreateSample}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Pregunta de Ejemplo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((question) => (
            <Card key={question.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">
                      {question.text}
                    </CardTitle>
                    <CardDescription>
                      <span className="inline-flex items-center gap-2">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {question.type === 'multiple' ? 'Selección Múltiple' :
                           question.type === 'boolean' ? 'Verdadero/Falso' : 'Desarrollo'}
                        </span>
                        <span className="text-xs">•</span>
                        <span className="text-xs">{question.category}</span>
                        {question.tags.length > 0 && (
                          <>
                            <span className="text-xs">•</span>
                            <span className="text-xs">{question.tags.join(', ')}</span>
                          </>
                        )}
                      </span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              {question.alternatives && question.alternatives.length > 0 && (
                <CardContent>
                  <div className="space-y-1">
                    {question.alternatives.map((alt) => (
                      <div
                        key={alt.id}
                        className={`text-sm p-2 rounded ${
                          alt.isCorrect
                            ? 'bg-green-50 text-green-900 border border-green-200'
                            : 'bg-gray-50 text-gray-700'
                        }`}
                      >
                        {alt.isCorrect && '✓ '}
                        {alt.text}
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}

          {questions.length > 0 && (
            <div className="flex justify-end pt-4">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAll}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar Todas
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionsList;

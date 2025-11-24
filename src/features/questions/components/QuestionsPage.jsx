import React, { useState } from 'react';
import { useQuestions } from '../hooks/useQuestions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Plus, Search, Filter, Trash2 } from 'lucide-react';

export const QuestionsPage = () => {
  const { questions, isLoading, create, delete: deleteQuestion } = useQuestions();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredQuestions = questions.filter(q =>
    q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar esta pregunta?')) {
      await deleteQuestion(id);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Cargando preguntas...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Banco de Preguntas</h1>
          <p className="text-muted-foreground mt-1">
            {questions.length} {questions.length === 1 ? 'pregunta' : 'preguntas'} disponibles
          </p>
        </div>
        <Button onClick={handleCreateSample}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Pregunta
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar preguntas por texto, categoría o tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Lista de preguntas */}
      {filteredQuestions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'No se encontraron preguntas' : 'No hay preguntas en el banco'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm
                ? 'Intenta con otros términos de búsqueda'
                : 'Comienza creando preguntas para tu banco. Podrás reutilizarlas en múltiples exámenes.'
              }
            </p>
            {!searchTerm && (
              <Button onClick={handleCreateSample}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Pregunta
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredQuestions.map((question) => (
            <Card key={question.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-base font-medium">
                      {question.text}
                    </CardTitle>
                    <div className="mt-2 flex items-center gap-2 flex-wrap text-xs">
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">
                        {question.type === 'multiple' ? 'Selección Múltiple' :
                         question.type === 'boolean' ? 'V/F' : 'Desarrollo'}
                      </span>
                      <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                        {question.category}
                      </span>
                      {question.tags.length > 0 && (
                        <span className="text-muted-foreground">
                          {question.tags.join(', ')}
                        </span>
                      )}
                      <span className="text-muted-foreground ml-auto">
                        Usada {question.statistics.timesUsed} {question.statistics.timesUsed === 1 ? 'vez' : 'veces'}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(question.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              {question.alternatives && question.alternatives.length > 0 && (
                <CardContent>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {question.alternatives.map((alt, idx) => (
                      <div
                        key={alt.id}
                        className={`text-sm p-2 rounded text-left ${
                          alt.isCorrect
                            ? 'bg-green-50 text-green-900 border border-green-200'
                            : 'bg-gray-50 text-gray-700 border border-gray-200'
                        }`}
                      >
                        <span className="font-medium mr-2">
                          {String.fromCharCode(65 + idx)})
                        </span>
                        {alt.text}
                        {alt.isCorrect && <span className="ml-2">✓</span>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionsPage;

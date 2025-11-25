import React, { useState, useEffect } from 'react';
import { db } from '@/core/storage/db';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { FileText, Plus, Lock } from 'lucide-react';
import { QuestionCard } from '../QuestionCard';
import QuestionSelector from '../QuestionSelector';

export const QuestionsTab = ({
  exam,
  onAddQuestions,
  isEditingQuestions,
  onSaveQuestions,
  onCancelEdit,
  onNavigateToQuestions
}) => {
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const isFinalized = exam.status === 'finalized';

  useEffect(() => {
    const loadQuestions = async () => {
      const questionObjects = await Promise.all(
        exam.questions.map(qId => db.questions.get(qId))
      );
      setSelectedQuestions(questionObjects.filter(Boolean));
    };

    if (exam && exam.questions) {
      loadQuestions();
    }
  }, [exam]);

  if (isEditingQuestions) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Editando preguntas - {selectedQuestions.length} seleccionadas
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onCancelEdit}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => onSaveQuestions(selectedQuestions.map(q => q.id))}
            >
              Guardar Preguntas
            </Button>
          </div>
        </div>

        <QuestionSelector
          selectedQuestions={selectedQuestions}
          onQuestionsChange={setSelectedQuestions}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isFinalized && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-green-900">Preguntas Bloqueadas</h4>
            <p className="text-sm text-green-800 mt-1">
              Las preguntas de este examen están almacenadas de forma permanente y no se pueden modificar.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {exam.questions.length === 0
            ? 'No hay preguntas agregadas al examen'
            : `${exam.questions.length} pregunta(s) en el examen`
          }
        </p>
        <Button onClick={onAddQuestions} disabled={isFinalized}>
          <Plus className="w-4 h-4 mr-2" />
          {isFinalized ? 'Bloqueado' : 'Agregar Preguntas'}
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
              {isFinalized
                ? 'Este examen no tiene preguntas y está finalizado.'
                : 'Agrega preguntas desde el banco de preguntas o crea nuevas.'}
            </p>
            {!isFinalized && (
              <Button onClick={onAddQuestions}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Preguntas
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {exam.questions.map((questionId, index) => (
            <QuestionCard
              key={questionId}
              questionId={questionId}
              index={index}
              isExamFinalized={isFinalized}
              onNavigateToQuestions={onNavigateToQuestions}
            />
          ))}
        </div>
      )}
    </div>
  );
};

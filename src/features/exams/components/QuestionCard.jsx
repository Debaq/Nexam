import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/storage/db';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { Eye, Trash2, AlertTriangle } from 'lucide-react';

/**
 * Detecta si la respuesta correcta tiene un número de palabras significativamente mayor
 * que el promedio de las alternativas incorrectas
 */
const hasLongCorrectAnswer = (question) => {
  if (question.type !== 'multiple' || !question.alternatives || question.alternatives.length < 2) {
    return false;
  }

  const correctAlternatives = question.alternatives.filter(alt => alt.isCorrect);
  const incorrectAlternatives = question.alternatives.filter(alt => !alt.isCorrect);

  if (correctAlternatives.length === 0 || incorrectAlternatives.length === 0) {
    return false;
  }

  const countWords = (text) => text.trim().split(/\s+/).length;

  const correctWordCounts = correctAlternatives.map(alt => countWords(alt.text));
  const incorrectWordCounts = incorrectAlternatives.map(alt => countWords(alt.text));

  const avgCorrect = correctWordCounts.reduce((a, b) => a + b, 0) / correctWordCounts.length;
  const avgIncorrect = incorrectWordCounts.reduce((a, b) => a + b, 0) / incorrectWordCounts.length;

  return avgCorrect > avgIncorrect * 1.5;
};

export const QuestionCard = ({ questionId, index, isExamFinalized = false, onNavigateToQuestions }) => {
  const question = useLiveQuery(() => db.questions.get(questionId), [questionId]);
  const [showPreview, setShowPreview] = useState(false);

  if (!question) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Cargando pregunta...</p>
        </CardContent>
      </Card>
    );
  }

  const handleWarningClick = (e) => {
    e.stopPropagation();
    if (onNavigateToQuestions) {
      onNavigateToQuestions(questionId);
    }
  };

  return (
    <>
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowPreview(true)}>
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
                {hasLongCorrectAnswer(question) && (
                  <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Respuesta obvia
                  </span>
                )}
              </div>
              <p className="text-sm line-clamp-2">{question.text}</p>
            </div>
            <div className="flex gap-1">
              {hasLongCorrectAnswer(question) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleWarningClick}
                        className="text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold mb-1">⚠️ Respuesta fácil de detectar</p>
                      <p className="text-sm">
                        La respuesta correcta tiene significativamente más palabras que las alternativas incorrectas.
                        Click para ir al banco de preguntas y editarla.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPreview(true);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <Eye className="w-4 h-4" />
              </Button>
              {!isExamFinalized && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Implementar eliminación
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Modal de Preview */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Pregunta {index + 1} - {
                question.type === 'multiple' ? 'Selección Múltiple' :
                question.type === 'boolean' ? 'Verdadero/Falso' : 'Desarrollo'
              }
            </DialogTitle>
            <DialogDescription>
              Vista previa de la pregunta
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Texto de la pregunta */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Pregunta:</h4>
              <p className="text-base">{question.text}</p>
            </div>

            {/* Imagen si existe */}
            {question.image && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Imagen:</h4>
                <img
                  src={URL.createObjectURL(question.image.data)}
                  alt={question.image.alt || "Imagen de la pregunta"}
                  className="max-w-full rounded-md border"
                />
              </div>
            )}

            {/* Alternativas para preguntas de selección múltiple */}
            {question.type === 'multiple' && question.alternatives && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Alternativas:</h4>
                <div className="space-y-2">
                  {question.alternatives.map((alt, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-md border ${
                        alt.isCorrect
                          ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                          : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="font-medium text-sm">
                          {String.fromCharCode(65 + idx)})
                        </span>
                        <div className="flex-1">
                          <p className="text-sm">{alt.text}</p>
                          {alt.isCorrect && (
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium mt-1 inline-block">
                              ✓ Respuesta correcta
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alternativas para preguntas de V/F */}
            {question.type === 'boolean' && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Respuesta correcta:</h4>
                <div className="space-y-2">
                  <div className={`p-3 rounded-md border ${
                    question.alternatives[0]?.isCorrect
                      ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                      : 'bg-muted/50'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Verdadero</span>
                      {question.alternatives[0]?.isCorrect && (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓</span>
                      )}
                    </div>
                  </div>
                  <div className={`p-3 rounded-md border ${
                    question.alternatives[1]?.isCorrect
                      ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                      : 'bg-muted/50'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Falso</span>
                      {question.alternatives[1]?.isCorrect && (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Metadatos adicionales */}
            <div className="pt-4 border-t space-y-2">
              {question.category && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Categoría:</span>
                  <span className="text-sm font-medium">{question.category}</span>
                </div>
              )}

              {question.difficulty && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Dificultad:</span>
                  <span className="text-sm font-medium capitalize">
                    {question.difficulty.manual || 'No especificada'}
                  </span>
                </div>
              )}

              {question.tags && question.tags.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-sm text-muted-foreground">Etiquetas:</span>
                  <div className="flex flex-wrap gap-1">
                    {question.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {question.feedback?.general && (
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Retroalimentación:</span>
                  <p className="text-sm bg-muted/50 p-2 rounded">{question.feedback.general}</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

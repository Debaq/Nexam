import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft, Lock, Copy, FileDown } from 'lucide-react';
import { PDFGenerationButton } from './PDFGenerationButton';

export const ExamDetailHeader = ({
  exam,
  onBack,
  onGenerateDraft,
  onGenerateFinal,
  onCopyExam,
  onExportGift
}) => {
  return (
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
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{exam.title}</h1>
            {exam.status === 'finalized' && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                NO EDITABLE
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            {new Date(exam.date).toLocaleDateString('es-CL', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          {exam.status === 'finalized' && exam.finalizedAt && (
            <p className="text-xs text-green-700 mt-1">
              Finalizado el {new Date(exam.finalizedAt).toLocaleDateString('es-CL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <PDFGenerationButton
            exam={exam}
            onGenerateDraft={onGenerateDraft}
            onGenerateFinal={onGenerateFinal}
          />
          <Button onClick={onCopyExam} variant="outline">
            <Copy className="w-4 h-4 mr-2" />
            Copiar Examen
          </Button>
          <Button onClick={onExportGift} variant="outline">
            <FileDown className="w-4 h-4 mr-2" />
            Exportar GIFT
          </Button>
        </div>
      </div>
    </div>
  );
};

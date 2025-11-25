import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/storage/db';
import examService from '../services/examService';
import { useExamPDFGenerator } from '../hooks/useExamPDFGenerator';
import { ExamDetailHeader } from './ExamDetailHeader';
import { OverviewTab } from './tabs/OverviewTab';
import { QuestionsTab } from './tabs/QuestionsTab';
import { StudentsTab } from './tabs/StudentsTab';
import { ConfigTab } from './tabs/ConfigTab';
import { CorrectionTab } from './tabs/CorrectionTab';
import QuestionSelector from './QuestionSelector';
import GradeScaleModal from './GradeScaleModal';
import { ExamConfigEditModal } from './ExamConfigEditModal';

export const ExamDetail = ({ examId, onBack, onNavigateToQuestions }) => {
  const exam = useLiveQuery(() => db.exams.get(examId), [examId]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditingQuestions, setIsEditingQuestions] = useState(false);
  const [isGradeScaleModalOpen, setIsGradeScaleModalOpen] = useState(false);
  const [isConfigEditModalOpen, setIsConfigEditModalOpen] = useState(false);

  const { generatePDFs } = useExamPDFGenerator();

  if (!exam) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Cargando examen...</p>
      </div>
    );
  }

  // ==================== HANDLERS ====================

  const handleGenerateDraft = async () => {
    if (exam.status === 'finalized') {
      await generatePDFs(exam, false, false);
    } else {
      await generatePDFs(exam, true, true);
    }
  };

  const handleGenerateFinal = async () => {
    try {
      if (exam.status !== 'finalized') {
        await examService.finalize(examId);
        alert('Examen finalizado correctamente. Los PDFs NO incluyen marca de agua BORRADOR.');
      }

      await generatePDFs(exam, false, exam.status !== 'finalized');
    } catch (error) {
      console.error('Error finalizando examen:', error);
      alert('Error al finalizar examen: ' + error.message);
    }
  };

  const handleExportGift = async () => {
    try {
      const { filename, content, questionCount } = await examService.exportToGift(examId);

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
    if (exam.status === 'finalized') {
      alert('⚠️ No se puede modificar un examen finalizado.\n\nEste examen ha sido bloqueado permanentemente para garantizar la integridad académica.');
      return;
    }
    setIsEditingQuestions(true);
  };

  const handleSaveQuestions = async (questionIds) => {
    if (exam.status === 'finalized') {
      alert('⚠️ No se puede modificar un examen finalizado.');
      return;
    }

    try {
      await examService.update(examId, { questions: questionIds });
      setIsEditingQuestions(false);
    } catch (error) {
      alert('Error al guardar preguntas: ' + error.message);
    }
  };

  const handleCancelEditQuestions = () => {
    setIsEditingQuestions(false);
  };

  const handleAddStudents = () => {
    alert('Selector de estudiantes próximamente');
  };

  const handleEditConfig = () => {
    if (exam.status === 'finalized') {
      alert('⚠️ No se puede modificar un examen finalizado.\n\nEste examen ha sido bloqueado permanentemente para garantizar la integridad académica.');
      return;
    }
    setIsConfigEditModalOpen(true);
  };

  const handleSaveConfig = async (updates) => {
    if (exam.status === 'finalized') {
      alert('⚠️ No se puede modificar un examen finalizado.');
      return;
    }

    try {
      await examService.update(examId, updates);
    } catch (error) {
      console.error('Error actualizando configuración:', error);
      throw error;
    }
  };

  const handleCopyExam = async () => {
    try {
      const message = exam.status === 'finalized'
        ? `¿Desea crear una copia editable de este examen finalizado?

• El nuevo examen será un BORRADOR editable
• Las preguntas que aún existan en el banco se actualizarán automáticamente
• Las preguntas eliminadas del banco se recrearán en la categoría "${exam.title} (copia)"

¿Continuar?`
        : `¿Desea crear una copia de este examen?

• Se creará un nuevo examen editable
• Las preguntas mantendrán sus referencias al banco

¿Continuar?`;

      if (!confirm(message)) return;

      const newExam = await examService.copyExam(examId);

      const questionsRecovered = exam.status === 'finalized' && exam.questionSnapshots
        ? exam.questionSnapshots.length
        : exam.questions.length;

      alert(`✅ Examen copiado exitosamente!

Nuevo examen: "${newExam.title}"
Preguntas procesadas: ${questionsRecovered}
Estado: Borrador (editable)

El examen copiado está listo para editar.`);

      window.location.reload();
    } catch (error) {
      console.error('Error copiando examen:', error);
      alert('Error al copiar examen: ' + error.message);
    }
  };

  // ==================== RENDER ====================

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <ExamDetailHeader
        exam={exam}
        onBack={onBack}
        onGenerateDraft={handleGenerateDraft}
        onGenerateFinal={handleGenerateFinal}
        onCopyExam={handleCopyExam}
        onExportGift={handleExportGift}
      />

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

        {/* Mostrar pestaña de corrección solo si el examen está finalizado */}
        {exam.status === 'finalized' && (
          <button
            onClick={() => setActiveTab('correction')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'correction'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Corrección
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab exam={exam} onGeneratePDFs={handleGenerateDraft} />
      )}
      {activeTab === 'questions' && (
        <QuestionsTab
          exam={exam}
          onAddQuestions={handleAddQuestions}
          isEditingQuestions={isEditingQuestions}
          onSaveQuestions={handleSaveQuestions}
          onCancelEdit={handleCancelEditQuestions}
          onNavigateToQuestions={onNavigateToQuestions}
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
          onViewGradeScale={() => setIsGradeScaleModalOpen(true)}
        />
      )}
      {activeTab === 'correction' && (
        <CorrectionTab exam={exam} />
      )}

      {/* Modals */}
      <GradeScaleModal
        exam={exam}
        isOpen={isGradeScaleModalOpen}
        onClose={() => setIsGradeScaleModalOpen(false)}
      />

      <ExamConfigEditModal
        exam={exam}
        open={isConfigEditModalOpen}
        onClose={() => setIsConfigEditModalOpen(false)}
        onSave={handleSaveConfig}
      />
    </div>
  );
};


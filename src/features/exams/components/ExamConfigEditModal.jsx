import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';

export const ExamConfigEditModal = ({ exam, open, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    duration: 90,
    folder: 'Sin carpeta',
    type: 'uniform',
    pointsPerQuestion: 1,
    passingGrade: 60,
    grading: {
      maxGrade: 7.0,
      minGrade: 1.0,
      passingGrade: 4.0,
      demandPercentage: 60
    },
    pdfOptions: {
      subtitle: '',
      instructions: 'Lea cuidadosamente cada pregunta antes de responder. Marque sus respuestas en la hoja de respuestas adjunta.',
      showLogo: false,
      showHeader: true,
      showFooter: true,
      showInstructions: true
    },
    randomization: {
      shuffleQuestions: false,
      shuffleAlternatives: false
    }
  });

  // Cargar datos del examen cuando se abre el modal
  useEffect(() => {
    if (exam && open) {
      setFormData({
        title: exam.title || '',
        date: exam.date ? new Date(exam.date).toISOString().split('T')[0] : '',
        duration: exam.duration || 90,
        folder: exam.folder || 'Sin carpeta',
        type: exam.type || 'uniform',
        pointsPerQuestion: exam.pointsPerQuestion || 1,
        passingGrade: exam.passingGrade || 60,
        grading: {
          maxGrade: exam.grading?.maxGrade || 7.0,
          minGrade: exam.grading?.minGrade || 1.0,
          passingGrade: exam.grading?.passingGrade || 4.0,
          demandPercentage: exam.grading?.demandPercentage || 60
        },
        pdfOptions: {
          subtitle: exam.pdfOptions?.subtitle || '',
          instructions: exam.pdfOptions?.instructions || 'Lea cuidadosamente cada pregunta antes de responder. Marque sus respuestas en la hoja de respuestas adjunta.',
          showLogo: exam.pdfOptions?.showLogo || false,
          showHeader: exam.pdfOptions?.showHeader !== false,
          showFooter: exam.pdfOptions?.showFooter !== false,
          showInstructions: exam.pdfOptions?.showInstructions !== false
        },
        randomization: {
          shuffleQuestions: exam.randomization?.shuffleQuestions || false,
          shuffleAlternatives: exam.randomization?.shuffleAlternatives || false
        }
      });
    }
  }, [exam, open]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGradingChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      grading: {
        ...prev.grading,
        [field]: parseFloat(value) || 0
      }
    }));
  };

  const handlePdfOptionsChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      pdfOptions: {
        ...prev.pdfOptions,
        [field]: value
      }
    }));
  };

  const handleRandomizationChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      randomization: {
        ...prev.randomization,
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      alert('Error al guardar: ' + error.message);
    }
  };

  if (!exam) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Configuración del Examen</DialogTitle>
          <DialogDescription>
            Modifica la configuración del examen: información básica, opciones de PDF, aleatorización y puntuación.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Información Básica</h3>

            <div>
              <Label htmlFor="title">Título del Examen</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="duration">Duración (minutos)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => handleChange('duration', parseInt(e.target.value))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="folder">Carpeta / Categoría</Label>
                <Input
                  id="folder"
                  value={formData.folder}
                  onChange={(e) => handleChange('folder', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Tipo de Examen</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="type"
                    value="uniform"
                    checked={formData.type === 'uniform'}
                    onChange={(e) => handleChange('type', e.target.value)}
                  />
                  <span className="text-sm">Uniforme (todos iguales)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="type"
                    value="differentiated"
                    checked={formData.type === 'differentiated'}
                    onChange={(e) => handleChange('type', e.target.value)}
                  />
                  <span className="text-sm">Diferenciado (versiones únicas)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Opciones de PDF */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Opciones de PDF</h3>

            <div>
              <Label htmlFor="subtitle">Subtítulo (opcional)</Label>
              <Input
                id="subtitle"
                value={formData.pdfOptions.subtitle}
                onChange={(e) => handlePdfOptionsChange('subtitle', e.target.value)}
                placeholder="Ej: Primer Semestre 2024"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Mostrar Instrucciones</Label>
                  <p className="text-xs text-muted-foreground">
                    Incluir instrucciones en el PDF
                  </p>
                </div>
                <Switch
                  checked={formData.pdfOptions.showInstructions}
                  onCheckedChange={(checked) => handlePdfOptionsChange('showInstructions', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Mostrar Logo</Label>
                  <p className="text-xs text-muted-foreground">
                    Incluir logo institucional
                  </p>
                </div>
                <Switch
                  checked={formData.pdfOptions.showLogo}
                  onCheckedChange={(checked) => handlePdfOptionsChange('showLogo', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Mostrar Encabezado</Label>
                  <p className="text-xs text-muted-foreground">
                    Incluir encabezado en páginas
                  </p>
                </div>
                <Switch
                  checked={formData.pdfOptions.showHeader}
                  onCheckedChange={(checked) => handlePdfOptionsChange('showHeader', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Mostrar Pie de Página</Label>
                  <p className="text-xs text-muted-foreground">
                    Incluir pie de página
                  </p>
                </div>
                <Switch
                  checked={formData.pdfOptions.showFooter}
                  onCheckedChange={(checked) => handlePdfOptionsChange('showFooter', checked)}
                />
              </div>
            </div>

            {formData.pdfOptions.showInstructions && (
              <div>
                <Label htmlFor="instructions">Texto de instrucciones</Label>
                <textarea
                  id="instructions"
                  value={formData.pdfOptions.instructions}
                  onChange={(e) => handlePdfOptionsChange('instructions', e.target.value)}
                  className="w-full min-h-[80px] p-2 text-sm border rounded-md mt-1"
                  placeholder="Instrucciones para los estudiantes..."
                />
              </div>
            )}
          </div>

          {/* Aleatorización */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Aleatorización</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Aleatorizar Preguntas</Label>
                  <p className="text-xs text-muted-foreground">
                    Cambiar el orden de las preguntas
                  </p>
                </div>
                <Switch
                  checked={formData.randomization.shuffleQuestions}
                  onCheckedChange={(checked) => handleRandomizationChange('shuffleQuestions', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Aleatorizar Alternativas</Label>
                  <p className="text-xs text-muted-foreground">
                    Cambiar el orden de las alternativas
                  </p>
                </div>
                <Switch
                  checked={formData.randomization.shuffleAlternatives}
                  onCheckedChange={(checked) => handleRandomizationChange('shuffleAlternatives', checked)}
                />
              </div>
            </div>
          </div>

          {/* Puntuación */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Puntuación</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pointsPerQuestion">Puntos por Pregunta</Label>
                <Input
                  id="pointsPerQuestion"
                  type="number"
                  min="1"
                  value={formData.pointsPerQuestion}
                  onChange={(e) => handleChange('pointsPerQuestion', parseInt(e.target.value))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="passingGrade">Nota Mínima de Aprobación (%)</Label>
                <Input
                  id="passingGrade"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.passingGrade}
                  onChange={(e) => handleChange('passingGrade', parseInt(e.target.value))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Escala de Calificación */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Escala de Calificación</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="maxGrade">Nota Máxima</Label>
                <Input
                  id="maxGrade"
                  type="number"
                  step="0.1"
                  min="1"
                  max="10"
                  value={formData.grading.maxGrade}
                  onChange={(e) => handleGradingChange('maxGrade', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="minGrade">Nota Mínima</Label>
                <Input
                  id="minGrade"
                  type="number"
                  step="0.1"
                  min="1"
                  max="10"
                  value={formData.grading.minGrade}
                  onChange={(e) => handleGradingChange('minGrade', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="gradingPassingGrade">Nota de Aprobación</Label>
                <Input
                  id="gradingPassingGrade"
                  type="number"
                  step="0.1"
                  min="1"
                  max="10"
                  value={formData.grading.passingGrade}
                  onChange={(e) => handleGradingChange('passingGrade', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="demandPercentage">% de Exigencia</Label>
                <Input
                  id="demandPercentage"
                  type="number"
                  step="1"
                  min="1"
                  max="100"
                  value={formData.grading.demandPercentage}
                  onChange={(e) => handleGradingChange('demandPercentage', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Guardar Cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { questionsService } from '../services/questionsService';
import { Plus, X } from 'lucide-react';

export const QuestionFormModal = ({ open, onClose, onComplete, folders = [], question = null }) => {
  const [formData, setFormData] = useState({
    text: '',
    type: 'multiple',
    category: '',
    tags: [],
    alternatives: [
      { id: '1', text: '', isCorrect: false, feedback: '' },
      { id: '2', text: '', isCorrect: false, feedback: '' },
      { id: '3', text: '', isCorrect: false, feedback: '' },
      { id: '4', text: '', isCorrect: false, feedback: '' }
    ]
  });
  const [newTag, setNewTag] = useState('');

  // Cargar datos de la pregunta si es modo edición
  React.useEffect(() => {
    if (question && open) {
      setFormData({
        text: question.text || '',
        type: question.type || 'multiple',
        category: question.category || '',
        tags: question.tags || [],
        alternatives: question.alternatives?.length > 0
          ? question.alternatives.map(alt => ({
              id: alt.id,
              text: alt.text || '',
              isCorrect: alt.isCorrect || false,
              feedback: alt.feedback || ''
            }))
          : [
              { id: '1', text: '', isCorrect: false, feedback: '' },
              { id: '2', text: '', isCorrect: false, feedback: '' },
              { id: '3', text: '', isCorrect: false, feedback: '' },
              { id: '4', text: '', isCorrect: false, feedback: '' }
            ]
      });
    } else if (!question && open) {
      // Reset para modo creación
      setFormData({
        text: '',
        type: 'multiple',
        category: '',
        tags: [],
        alternatives: [
          { id: '1', text: '', isCorrect: false, feedback: '' },
          { id: '2', text: '', isCorrect: false, feedback: '' },
          { id: '3', text: '', isCorrect: false, feedback: '' },
          { id: '4', text: '', isCorrect: false, feedback: '' }
        ]
      });
    }
  }, [question, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (question) {
        // Modo edición
        await questionsService.update(question.id, formData);
      } else {
        // Modo creación
        await questionsService.create(formData);
      }
      onComplete?.();
      handleClose();
    } catch (error) {
      alert(`Error al ${question ? 'actualizar' : 'crear'} pregunta: ` + error.message);
    }
  };

  const handleClose = () => {
    setFormData({
      text: '',
      type: 'multiple',
      category: '',
      tags: [],
      alternatives: [
        { id: '1', text: '', isCorrect: false, feedback: '' },
        { id: '2', text: '', isCorrect: false, feedback: '' },
        { id: '3', text: '', isCorrect: false, feedback: '' },
        { id: '4', text: '', isCorrect: false, feedback: '' }
      ]
    });
    setNewTag('');
    onClose?.();
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }));
  };

  const updateAlternative = (index, field, value) => {
    const newAlternatives = [...formData.alternatives];
    newAlternatives[index] = { ...newAlternatives[index], [field]: value };
    setFormData(prev => ({ ...prev, alternatives: newAlternatives }));
  };

  const toggleCorrect = (index) => {
    const newAlternatives = formData.alternatives.map((alt, i) => ({
      ...alt,
      isCorrect: i === index ? !alt.isCorrect : alt.isCorrect
    }));
    setFormData(prev => ({ ...prev, alternatives: newAlternatives }));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{question ? 'Editar Pregunta' : 'Nueva Pregunta'}</DialogTitle>
          <DialogDescription>
            {question
              ? 'Modifica los datos de la pregunta, incluyendo el feedback de cada alternativa.'
              : 'Crea una nueva pregunta para tu banco. Selecciona el tipo, agrega alternativas, categoría y etiquetas.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Texto de la pregunta */}
          <div>
            <Label htmlFor="text">Pregunta *</Label>
            <textarea
              id="text"
              value={formData.text}
              onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
              className="w-full min-h-[100px] p-2 text-sm border rounded-md mt-1"
              placeholder="Escribe la pregunta aquí..."
              required
            />
          </div>

          {/* Tipo de pregunta */}
          <div>
            <Label>Tipo de pregunta</Label>
            <div className="flex gap-3 mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="multiple"
                  checked={formData.type === 'multiple'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                />
                <span className="text-sm">Selección Múltiple</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="boolean"
                  checked={formData.type === 'boolean'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                />
                <span className="text-sm">Verdadero/Falso</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="development"
                  checked={formData.type === 'development'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                />
                <span className="text-sm">Desarrollo</span>
              </label>
            </div>
          </div>

          {/* Alternativas (solo para múltiple y boolean) */}
          {(formData.type === 'multiple' || formData.type === 'boolean') && (
            <div>
              <Label>Alternativas y Feedback</Label>
              <div className="space-y-3 mt-2">
                {formData.alternatives.map((alt, index) => (
                  <div key={alt.id} className="border rounded-md p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={alt.isCorrect}
                        onChange={() => toggleCorrect(index)}
                        className="mt-1"
                      />
                      <Input
                        value={alt.text}
                        onChange={(e) => updateAlternative(index, 'text', e.target.value)}
                        placeholder={`Alternativa ${String.fromCharCode(65 + index)}`}
                        required
                      />
                    </div>
                    <Input
                      value={alt.feedback || ''}
                      onChange={(e) => updateAlternative(index, 'feedback', e.target.value)}
                      placeholder="Feedback opcional (aparece en exportación GIFT)"
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                ✓ Marca las alternativas correctas. El feedback es opcional y solo se usa para exportación GIFT.
              </p>
            </div>
          )}

          {/* Categoría */}
          <div>
            <Label htmlFor="category">Categoría *</Label>
            {folders.length > 0 ? (
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full p-2 border rounded-md mt-1"
                required
              >
                <option value="">Seleccionar categoría</option>
                {folders.map(folder => (
                  <option key={folder} value={folder}>{folder}</option>
                ))}
              </select>
            ) : (
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Ej: Matemáticas"
                required
              />
            )}
          </div>

          {/* Tags */}
          <div>
            <Label>Etiquetas (Tags)</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Agregar etiqueta..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {question ? 'Guardar Cambios' : 'Crear Pregunta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionFormModal;

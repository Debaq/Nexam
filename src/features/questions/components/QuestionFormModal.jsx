import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { questionsService } from '../services/questionsService';
import { Plus, X, Trash2, PlusCircle } from 'lucide-react';

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
    ],
    items: [
      { id: 'item1', text: '' },
      { id: 'item2', text: '' }
    ],
    combinations: [
      { id: 'comb1', text: '', itemIds: [], isCorrect: false },
      { id: 'comb2', text: '', itemIds: [], isCorrect: false }
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
            ],
        items: question.items?.length > 0
          ? question.items.map(item => ({
              id: item.id,
              text: item.text || ''
            }))
          : [
              { id: 'item1', text: '' },
              { id: 'item2', text: '' }
            ],
        combinations: question.combinations?.length > 0
          ? question.combinations.map(comb => ({
              id: comb.id,
              text: comb.text || '',
              itemIds: comb.itemIds || [],
              isCorrect: comb.isCorrect || false
            }))
          : [
              { id: 'comb1', text: '', itemIds: [], isCorrect: false },
              { id: 'comb2', text: '', itemIds: [], isCorrect: false }
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
        ],
        items: [
          { id: 'item1', text: '' },
          { id: 'item2', text: '' }
        ],
        combinations: [
          { id: 'comb1', text: '', itemIds: [], isCorrect: false },
          { id: 'comb2', text: '', itemIds: [], isCorrect: false }
        ]
      });
    }
  }, [question, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Preparar los datos para guardar
      let dataToSave = { ...formData };

      // Filtrar campos innecesarios según el tipo de pregunta
      if (formData.type !== 'matching') {
        delete dataToSave.items;
        delete dataToSave.combinations;
      } else {
        // Para el tipo matching, no se usan alternativas
        delete dataToSave.alternatives;
      }

      if (question) {
        // Modo edición - no se permite cambiar el tipo
        const dataToUpdate = { ...dataToSave };
        delete dataToUpdate.type; // No permitimos cambiar el tipo en preguntas existentes

        await questionsService.update(question.id, dataToUpdate);
      } else {
        // Modo creación
        await questionsService.create(dataToSave);
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
      ],
      items: [
        { id: 'item1', text: '' },
        { id: 'item2', text: '' }
      ],
      combinations: [
        { id: 'comb1', text: '', itemIds: [], isCorrect: false },
        { id: 'comb2', text: '', itemIds: [], isCorrect: false }
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

  // Funciones para manejar items
  const addItem = () => {
    const newItemId = `item${Date.now()}`;
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: newItemId, text: '' }]
    }));
  };

  const removeItem = (itemId) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId),
      // Remover el item de cualquier combinación que lo tenga
      combinations: prev.combinations.map(comb => ({
        ...comb,
        itemIds: comb.itemIds.filter(id => id !== itemId)
      }))
    }));
  };

  const updateItem = (itemId, text) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, text } : item
      )
    }));
  };

  // Funciones para manejar combinaciones
  const addCombination = () => {
    const newCombinationId = `comb${Date.now()}`;
    setFormData(prev => ({
      ...prev,
      combinations: [...prev.combinations, { id: newCombinationId, text: '', itemIds: [], isCorrect: false }]
    }));
  };

  const removeCombination = (combinationId) => {
    setFormData(prev => ({
      ...prev,
      combinations: prev.combinations.filter(comb => comb.id !== combinationId)
    }));
  };

  const updateCombination = (combinationId, field, value) => {
    setFormData(prev => ({
      ...prev,
      combinations: prev.combinations.map(comb =>
        comb.id === combinationId ? { ...comb, [field]: value } : comb
      )
    }));
  };

  const toggleCombinationCorrect = (combinationId) => {
    setFormData(prev => ({
      ...prev,
      combinations: prev.combinations.map(comb =>
        comb.id === combinationId ? { ...comb, isCorrect: !comb.isCorrect } : comb
      )
    }));
  };

  const toggleItemInCombination = (combinationId, itemId) => {
    setFormData(prev => {
      const combination = prev.combinations.find(comb => comb.id === combinationId);
      const newCombination = { ...combination };

      if (newCombination.itemIds.includes(itemId)) {
        newCombination.itemIds = newCombination.itemIds.filter(id => id !== itemId);
      } else {
        newCombination.itemIds = [...newCombination.itemIds, itemId];
      }

      return {
        ...prev,
        combinations: prev.combinations.map(comb =>
          comb.id === combinationId ? newCombination : comb
        )
      };
    });
  };

  const getAlphabeticIndex = (index) => {
    return String.fromCharCode(65 + index); // A, B, C, etc.
  };

  const getRomanNumeral = (index) => {
    const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return numerals[index] || (index + 1).toString();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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
            {question && (
              <div className="p-2 border rounded bg-gray-50 mb-2">
                <span className="text-sm text-gray-600">
                  Tipo actual: <strong>{formData.type === 'multiple' ? 'Selección Múltiple' :
                               formData.type === 'boolean' ? 'Verdadero/Falso' :
                               formData.type === 'development' ? 'Desarrollo' :
                               formData.type === 'matching' ? 'Items y Combinaciones' :
                               formData.type}</strong>
                  <span className="text-xs text-gray-500 ml-2">(No se puede cambiar en preguntas existentes)</span>
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              <label className="flex items-center gap-2 p-2 border rounded">
                <input
                  type="radio"
                  name="type"
                  value="multiple"
                  checked={formData.type === 'multiple'}
                  onChange={(e) => !question && setFormData(prev => ({ ...prev, type: e.target.value }))}
                  disabled={!!question}
                />
                <span className={`text-sm ${!!question ? 'text-gray-400' : ''}`}>Selección Múltiple</span>
              </label>
              <label className="flex items-center gap-2 p-2 border rounded">
                <input
                  type="radio"
                  name="type"
                  value="boolean"
                  checked={formData.type === 'boolean'}
                  onChange={(e) => !question && setFormData(prev => ({ ...prev, type: e.target.value }))}
                  disabled={!!question}
                />
                <span className={`text-sm ${!!question ? 'text-gray-400' : ''}`}>Verdadero/Falso</span>
              </label>
              <label className="flex items-center gap-2 p-2 border rounded">
                <input
                  type="radio"
                  name="type"
                  value="development"
                  checked={formData.type === 'development'}
                  onChange={(e) => !question && setFormData(prev => ({ ...prev, type: e.target.value }))}
                  disabled={!!question}
                />
                <span className={`text-sm ${!!question ? 'text-gray-400' : ''}`}>Desarrollo</span>
              </label>
              <label className="flex items-center gap-2 p-2 border rounded">
                <input
                  type="radio"
                  name="type"
                  value="matching"
                  checked={formData.type === 'matching'}
                  onChange={(e) => !question && setFormData(prev => ({ ...prev, type: e.target.value }))}
                  disabled={!!question}
                />
                <span className={`text-sm ${!!question ? 'text-gray-400' : ''}`}>Items y Combinaciones</span>
              </label>
            </div>

            {question && (
              <p className="text-xs text-gray-500 mt-2">
                <strong>Nota:</strong> El tipo de pregunta no se puede cambiar después de creada.
              </p>
            )}
          </div>

          {/* Alternativas (solo para múltiple y boolean) */}
          {(formData.type === 'multiple' || formData.type === 'boolean') && (
            <div>
              <Label>Alternativas y Feedback</Label>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-2">
                {formData.alternatives.map((alt, index) => (
                  <div key={alt.id} className="border rounded-md p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={alt.isCorrect}
                        onChange={() => toggleCorrect(index)}
                        className="mt-2"
                      />
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground mb-1 block">
                          Alternativa {String.fromCharCode(65 + index)}
                        </Label>
                        <textarea
                          value={alt.text}
                          onChange={(e) => updateAlternative(index, 'text', e.target.value)}
                          placeholder={`Texto de la alternativa ${String.fromCharCode(65 + index)}`}
                          required
                          className="w-full min-h-[60px] p-2 text-sm border rounded-md resize-y"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">
                        Feedback (opcional)
                      </Label>
                      <textarea
                        value={alt.feedback || ''}
                        onChange={(e) => updateAlternative(index, 'feedback', e.target.value)}
                        placeholder="Feedback para exportación GIFT (opcional)"
                        className="w-full min-h-[50px] p-2 text-sm border rounded-md resize-y"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                ✓ Marca las alternativas correctas. El feedback es opcional y solo se usa para exportación GIFT.
              </p>
            </div>
          )}

          {/* Items y combinaciones (solo para matching) */}
          {formData.type === 'matching' && (
            <div className="space-y-6">
              {/* Sección de items */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Items</Label>
                  <Button type="button" onClick={addItem} variant="outline" size="sm">
                    <PlusCircle className="w-4 h-4 mr-1" />
                    Agregar Item
                  </Button>
                </div>
                <div className="space-y-2 mt-2">
                  {formData.items.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <span className="text-sm font-medium w-8">{getRomanNumeral(index)}.</span>
                      <Input
                        value={item.text}
                        onChange={(e) => updateItem(item.id, e.target.value)}
                        placeholder={`Item ${getRomanNumeral(index)}`}
                        className="flex-grow"
                        required
                      />
                      <Button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        variant="outline"
                        size="sm"
                        className="p-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sección de combinaciones */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Combinaciones</Label>
                  <Button type="button" onClick={addCombination} variant="outline" size="sm">
                    <PlusCircle className="w-4 h-4 mr-1" />
                    Agregar Combinación
                  </Button>
                </div>
                <div className="space-y-3 mt-2">
                  {formData.combinations.map((comb, index) => (
                    <div key={comb.id} className="border rounded-md p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={comb.isCorrect}
                            onChange={() => toggleCombinationCorrect(comb.id)}
                            className="mt-1"
                          />
                          <span className="text-sm font-medium">{getAlphabeticIndex(index)}.</span>
                        </div>
                        <Button
                          type="button"
                          onClick={() => removeCombination(comb.id)}
                          variant="outline"
                          size="sm"
                          className="p-2"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <Input
                        value={comb.text}
                        onChange={(e) => updateCombination(comb.id, 'text', e.target.value)}
                        placeholder={`Texto de combinación ${getAlphabeticIndex(index)}`}
                        required
                      />

                      <div className="mt-2">
                        <Label className="text-xs">Incluir items:</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                          {formData.items.map((item, itemIndex) => (
                            <label key={item.id} className="flex items-center gap-1 text-xs">
                              <input
                                type="checkbox"
                                checked={comb.itemIds.includes(item.id)}
                                onChange={() => toggleItemInCombination(comb.id, item.id)}
                                className="mr-1"
                              />
                              {getRomanNumeral(itemIndex)} - {item.text || `Item ${getRomanNumeral(itemIndex)}`}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-2">
                ✓ Crea items (I, II, III) y luego combínalos en las alternativas (A) Solo I, B) I y II, etc.)
              </p>
            </div>
          )}

          {/* Categoría */}
          <div>
            <Label htmlFor="category">Categoría *</Label>
            {folders.length > 0 ? (
              <div className="relative mt-1">
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'new') {
                      const newCategory = prompt('Nombre de la nueva categoría:');
                      if (newCategory && newCategory.trim()) {
                        setFormData(prev => ({ ...prev, category: newCategory.trim() }));
                      }
                    } else {
                      setFormData(prev => ({ ...prev, category: value }));
                    }
                  }}
                  className="w-full p-2 border rounded-md appearance-none"
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {folders.map(folder => (
                    <option key={folder} value={folder}>{folder}</option>
                  ))}
                  <option value="new">+ Crear nueva categoría</option>
                </select>
              </div>
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

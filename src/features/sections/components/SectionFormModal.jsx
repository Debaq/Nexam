import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { sectionsService } from '../services/sectionsService';

export const SectionFormModal = ({ open, onClose, section }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    year: new Date().getFullYear(),
    semester: '1',
    startDate: '',
    endDate: '',
    folder: '',
    objectives: [],
    metadata: {
      level: '',
      subject: '',
      competencies: [],
      prerequisites: []
    }
  });

  const [objectiveInput, setObjectiveInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (section) {
      setFormData({
        name: section.name || '',
        code: section.code || '',
        description: section.description || '',
        year: section.year || new Date().getFullYear(),
        semester: section.semester || '1',
        startDate: section.startDate ? new Date(section.startDate).toISOString().split('T')[0] : '',
        endDate: section.endDate ? new Date(section.endDate).toISOString().split('T')[0] : '',
        folder: section.folder || '',
        objectives: section.objectives || [],
        metadata: {
          level: section.metadata?.level || '',
          subject: section.metadata?.subject || '',
          competencies: section.metadata?.competencies || [],
          prerequisites: section.metadata?.prerequisites || []
        }
      });
    } else {
      // Reset form for new section
      setFormData({
        name: '',
        code: '',
        description: '',
        year: new Date().getFullYear(),
        semester: '1',
        startDate: '',
        endDate: '',
        folder: '',
        objectives: [],
        metadata: {
          level: '',
          subject: '',
          competencies: [],
          prerequisites: []
        }
      });
    }
    setObjectiveInput('');
  }, [section, open]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generar folder si se cambia el nombre o año
    if (field === 'name' || field === 'year') {
      const name = field === 'name' ? value : formData.name;
      const year = field === 'year' ? value : formData.year;
      if (name && year && !section) {
        const autoFolder = sectionsService.generateFolderName(name, year);
        setFormData(prev => ({ ...prev, folder: autoFolder }));
      }
    }
  };

  const handleMetadataChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [field]: value
      }
    }));
  };

  const handleAddObjective = () => {
    if (objectiveInput.trim()) {
      setFormData(prev => ({
        ...prev,
        objectives: [...prev.objectives, objectiveInput.trim()]
      }));
      setObjectiveInput('');
    }
  };

  const handleRemoveObjective = (index) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.year || !formData.startDate || !formData.endDate) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    setIsSubmitting(true);

    try {
      const sectionData = {
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate)
      };

      if (section) {
        await sectionsService.update(section.id, sectionData);
      } else {
        await sectionsService.create(sectionData);
      }

      onClose();
    } catch (error) {
      alert('Error al guardar sección: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {section ? 'Editar Sección' : 'Nueva Sección'}
          </DialogTitle>
          <DialogDescription>
            {section
              ? 'Modifica la información de la sección o asignatura'
              : 'Crea una nueva sección o asignatura para organizar tus evaluaciones'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Información Básica</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre de la Sección *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ej: Matemáticas 8vo Básico"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  placeholder="Ej: MAT-801-A"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Descripción de la asignatura..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="year">Año Académico *</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => handleChange('year', parseInt(e.target.value))}
                  min="2020"
                  max="2050"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="semester">Semestre *</Label>
                <select
                  id="semester"
                  value={formData.semester}
                  onChange={(e) => handleChange('semester', e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                  disabled={isSubmitting}
                >
                  <option value="1">1er Semestre</option>
                  <option value="2">2do Semestre</option>
                  <option value="annual">Anual</option>
                </select>
              </div>

              <div>
                <Label htmlFor="folder">Carpeta</Label>
                <Input
                  id="folder"
                  value={formData.folder}
                  onChange={(e) => handleChange('folder', e.target.value)}
                  placeholder="Auto-generado"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Se genera automáticamente del nombre
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Fecha de Inicio *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="endDate">Fecha de Término *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Metadata Académica */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold border-b pb-2">Información Académica</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="level">Nivel Educativo</Label>
                <Input
                  id="level"
                  value={formData.metadata.level}
                  onChange={(e) => handleMetadataChange('level', e.target.value)}
                  placeholder="Ej: 8vo Básico, 2do Medio"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="subject">Materia</Label>
                <Input
                  id="subject"
                  value={formData.metadata.subject}
                  onChange={(e) => handleMetadataChange('subject', e.target.value)}
                  placeholder="Ej: Matemáticas, Lenguaje"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Objetivos */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold border-b pb-2">Objetivos del Curso</h3>

            <div className="flex gap-2">
              <Input
                value={objectiveInput}
                onChange={(e) => setObjectiveInput(e.target.value)}
                placeholder="Agregar objetivo de aprendizaje..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddObjective();
                  }
                }}
                disabled={isSubmitting}
              />
              <Button type="button" onClick={handleAddObjective} disabled={isSubmitting}>
                Agregar
              </Button>
            </div>

            {formData.objectives.length > 0 && (
              <ul className="space-y-2">
                {formData.objectives.map((objective, index) => (
                  <li key={index} className="flex items-start gap-2 p-2 bg-muted rounded">
                    <span className="flex-1 text-sm">{objective}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveObjective(index)}
                      disabled={isSubmitting}
                    >
                      ×
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : section ? 'Guardar Cambios' : 'Crear Sección'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SectionFormModal;

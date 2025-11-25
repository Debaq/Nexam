import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/storage/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { examService } from '@/features/exams/services/examService';
import { BookOpen, Plus, Search, CheckCircle } from 'lucide-react';

export const SectionEvaluationsTab = ({ sectionId }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Obtener exámenes asociados a la sección
  const sectionExams = useLiveQuery(() => 
    db.exams.where('sectionId').equals(sectionId).toArray(), [sectionId]);
  
  // Obtener todos los exámenes para el modal de selección
  const allExams = useLiveQuery(() => db.exams.toArray(), []);
  
  // Filtrar exámenes ya asociados
  const unassignedExams = allExams?.filter(exam => 
    exam.sectionId !== sectionId
  ) || [];
  
  // Filtrar exámenes disponibles para el modal
  const filteredAvailableExams = unassignedExams?.filter(exam =>
    exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.date.includes(searchTerm)
  ) || [];

  // Función para asociar un examen a la sección
  const assignExamToSection = async (examId) => {
    try {
      // Actualizar el examen con la nueva sección
      await examService.update(examId, { sectionId });
      setShowAddModal(false);
      setSearchTerm('');
    } catch (error) {
      console.error('Error al asignar examen a sección:', error);
      alert('Error al asignar examen a sección: ' + error.message);
    }
  };

  // Función para desasociar un examen de la sección
  const removeExamFromSection = async (examId) => {
    if (confirm('¿Desasociar este examen de la sección?')) {
      try {
        await examService.update(examId, { sectionId: null });
      } catch (error) {
        console.error('Error al desasociar examen de sección:', error);
        alert('Error al desasociar examen: ' + error.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con contador de evaluaciones */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Evaluaciones Asociadas ({sectionExams?.length || 0})
          </CardTitle>
          <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Asociar Exámen
          </Button>
        </CardHeader>
        <CardContent>
          {sectionExams && sectionExams.length > 0 ? (
            <div className="space-y-3">
              {sectionExams.map((exam) => (
                <div key={exam.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{exam.title}</div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>{new Date(exam.date).toLocaleDateString('es-CL')}</span>
                      <span>{exam.questions.length} preguntas</span>
                      <Badge variant="outline">{exam.type === 'uniform' ? 'Uniforme' : 'Diferenciado'}</Badge>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeExamFromSection(exam.id)}
                  >
                    Desasociar
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay evaluaciones asociadas a esta sección</p>
              <p className="text-sm mt-1">Asocia exámenes para comenzar a registrar calificaciones</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para seleccionar exámenes */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Seleccionar Exámenes
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="search">Buscar Exámenes Disponibles</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por título o fecha..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Exámenes Disponibles</h3>
              <div className="max-h-60 overflow-y-auto border rounded-md">
                {filteredAvailableExams.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {searchTerm ? 'No se encontraron exámenes' : 'No hay exámenes disponibles'}
                  </div>
                ) : (
                  filteredAvailableExams.map(exam => (
                    <div
                      key={exam.id}
                      className="flex items-center justify-between p-3 border-b last:border-b-0"
                    >
                      <div>
                        <div className="font-medium">{exam.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(exam.date).toLocaleDateString('es-CL')} - 
                          {exam.questions.length} preguntas - 
                          {exam.type === 'uniform' ? 'Uniforme' : 'Diferenciado'}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => assignExamToSection(exam.id)}
                        className="flex items-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Asociar
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SectionEvaluationsTab;
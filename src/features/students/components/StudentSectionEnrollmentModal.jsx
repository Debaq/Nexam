import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent } from '@/shared/components/ui/card';
import { db } from '@/core/storage/db';
import { studentSectionsService } from '../services/studentSectionsService';
import { sectionsService } from '../services/sectionsService';
import { CheckCircle, Plus, Search, X } from 'lucide-react';

export const StudentSectionEnrollmentModal = ({ studentId, studentName, sectionId, sectionName, open, onOpenChange, onEnroll }) => {
  const [selectedSections, setSelectedSections] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [enrollmentYear, setEnrollmentYear] = useState(new Date().getFullYear().toString());
  const [enrollmentSemester, setEnrollmentSemester] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Si se proporciona sectionId, estamos inscribiendo estudiantes a una sección
  // Si se proporciona studentId, estamos inscribiendo un estudiante a secciones
  const isSectionContext = sectionId && !studentId;
  const isStudentContext = studentId && !sectionId;

  const allSections = useLiveQuery(() => sectionsService.getAll(), []);
  const allStudents = useLiveQuery(() => studentsService.getAll(), []);
  const studentSections = useLiveQuery(() => studentSectionsService.getActiveByStudent(studentId), [studentId]);
  const sectionStudents = useLiveQuery(() => studentSectionsService.getActiveBySection(sectionId), [sectionId]);

  // Filtrar secciones disponibles (cuando se inscribe estudiante a secciones)
  let availableSections = [];
  if (isStudentContext && allSections && studentSections) {
    availableSections = allSections.filter(section =>
      !studentSections.some(enrollment => enrollment.sectionId === section.id)
    );
  } else if (isSectionContext && allSections) {
    // Si estamos en contexto de sección, todas las secciones están disponibles
    availableSections = allSections;
  }

  // Filtrar estudiantes disponibles (cuando se inscribe estudiantes a sección)
  let availableStudents = [];
  if (isSectionContext && allStudents && sectionStudents) {
    availableStudents = allStudents.filter(student =>
      !sectionStudents.some(enrollment => enrollment.studentId === student.id)
    );
  } else if (isStudentContext && allStudents) {
    // Si estamos en contexto de estudiante, todos los estudiantes están disponibles
    availableStudents = allStudents;
  }

  const filteredSections = availableSections?.filter(section =>
    section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.code?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredStudents = availableStudents?.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSectionSelect = (section) => {
    if (selectedSections.some(s => s.id === section.id)) {
      setSelectedSections(selectedSections.filter(s => s.id !== section.id));
    } else {
      setSelectedSections([...selectedSections, section]);
    }
  };

  const handleStudentSelect = (student) => {
    if (selectedStudents.some(s => s.id === student.id)) {
      setSelectedStudents(selectedStudents.filter(s => s.id !== student.id));
    } else {
      setSelectedStudents([...selectedStudents, student]);
    }
  };

  const handleEnroll = async () => {
    if ((isStudentContext && selectedSections.length === 0) ||
        (isSectionContext && selectedStudents.length === 0)) return;

    setIsSubmitting(true);

    try {
      if (isStudentContext) {
        // Inscribir al estudiante en todas las secciones seleccionadas
        for (const section of selectedSections) {
          await studentSectionsService.enroll(studentId, section.id, {
            year: parseInt(enrollmentYear),
            semester: parseInt(enrollmentSemester)
          });
        }
      } else if (isSectionContext) {
        // Inscribir a todos los estudiantes seleccionados en la sección
        for (const student of selectedStudents) {
          await studentSectionsService.enroll(student.id, sectionId, {
            year: parseInt(enrollmentYear),
            semester: parseInt(enrollmentSemester)
          });
        }
      }

      onEnroll && onEnroll();
      setSelectedSections([]);
      setSelectedStudents([]);
      onOpenChange(false);
    } catch (error) {
      alert('Error al inscribir: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            {isStudentContext
              ? `Inscribir a ${studentName}`
              : isSectionContext
                ? `Inscribir estudiantes a ${sectionName || 'la sección'}`
                : 'Inscribir estudiantes y secciones'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year">Año</Label>
              <Input
                id="year"
                type="number"
                min="2000"
                max="2100"
                value={enrollmentYear}
                onChange={(e) => setEnrollmentYear(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="semester">Semestre</Label>
              <select
                id="semester"
                value={enrollmentSemester}
                onChange={(e) => setEnrollmentSemester(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="1">1er Semestre</option>
                <option value="2">2do Semestre</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="search">Buscar</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder={isStudentContext
                  ? "Buscar secciones por nombre o código..."
                  : "Buscar estudiantes por nombre, apellido, RUT o email..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isStudentContext && (
            <>
              <div className="space-y-2">
                <h3 className="font-medium">Secciones Disponibles</h3>
                <div className="max-h-60 overflow-y-auto border rounded-md">
                  {filteredSections.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      {searchTerm ? 'No se encontraron secciones' : 'No hay secciones disponibles'}
                    </div>
                  ) : (
                    filteredSections.map(section => (
                      <div
                        key={section.id}
                        className={`flex items-center justify-between p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 ${
                          selectedSections.some(s => s.id === section.id) ? 'bg-primary/10' : ''
                        }`}
                        onClick={() => handleSectionSelect(section)}
                      >
                        <div>
                          <div className="font-medium">{section.name}</div>
                          <div className="text-sm text-muted-foreground">{section.code} - {section.year}</div>
                        </div>
                        {selectedSections.some(s => s.id === section.id) && (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {selectedSections.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium">Secciones Seleccionadas ({selectedSections.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedSections.map(section => (
                      <Card key={section.id} className="p-2">
                        <CardContent className="p-2 flex items-center justify-between">
                          <span className="text-sm">{section.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSectionSelect(section)}
                            className="h-6 w-6 p-1"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {isSectionContext && (
            <>
              <div className="space-y-2">
                <h3 className="font-medium">Estudiantes Disponibles</h3>
                <div className="max-h-60 overflow-y-auto border rounded-md">
                  {filteredStudents.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      {searchTerm ? 'No se encontraron estudiantes' : 'No hay estudiantes disponibles'}
                    </div>
                  ) : (
                    filteredStudents.map(student => (
                      <div
                        key={student.id}
                        className={`flex items-center justify-between p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 ${
                          selectedStudents.some(s => s.id === student.id) ? 'bg-primary/10' : ''
                        }`}
                        onClick={() => handleStudentSelect(student)}
                      >
                        <div>
                          <div className="font-medium">{student.name} {student.lastName}</div>
                          <div className="text-sm text-muted-foreground">{student.rut}</div>
                        </div>
                        {selectedStudents.some(s => s.id === student.id) && (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {selectedStudents.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium">Estudiantes Seleccionados ({selectedStudents.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedStudents.map(student => (
                      <Card key={student.id} className="p-2">
                        <CardContent className="p-2 flex items-center justify-between">
                          <span className="text-sm">{student.name} {student.lastName}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStudentSelect(student)}
                            className="h-6 w-6 p-1"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setSelectedSections([]);
                setSelectedStudents([]);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEnroll}
              disabled={
                (isStudentContext && selectedSections.length === 0) ||
                (isSectionContext && selectedStudents.length === 0) ||
                isSubmitting
              }
            >
              {isSubmitting ? 'Inscribiendo...' :
                isStudentContext ? `Inscribir en ${selectedSections.length} sección(es)` :
                `Inscribir ${selectedStudents.length} estudiante(s)`
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentSectionEnrollmentModal;
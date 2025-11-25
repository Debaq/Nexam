import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/storage/db';
import { studentsService } from '../services/studentsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Plus, Search, Trash2, Mail, GraduationCap, ChevronRight, Upload } from 'lucide-react';
import StudentSectionEnrollmentModal from './StudentSectionEnrollmentModal';
import StudentCSVImportModal from './StudentCSVImportModal';
import StudentCreateModal from './StudentCreateModal';
import { studentSectionsService } from '../services/studentSectionsService';

export const StudentsPage = ({ onStudentSelect }) => {
  const students = useLiveQuery(() => db.students.toArray(), []);
  const [searchTerm, setSearchTerm] = useState('');
  const [enrollmentModalOpen, setEnrollmentModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const filteredStudents = students?.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar este estudiante?')) {
      await studentsService.delete(id);
    }
  };

  const handleImportSuccess = () => {
    // Actualizar la lista de estudiantes
  };

  const handleCreateSuccess = () => {
    // Actualizar la lista de estudiantes
  };

  const handleEnrollStudent = (student) => {
    setSelectedStudent(student);
    setEnrollmentModalOpen(true);
  };

  const handleStudentClick = (student) => {
    if (onStudentSelect) {
      onStudentSelect(student.id);
    }
  };

  if (!students) {
    return (
      <div className="px-6 py-8">
        <p className="text-muted-foreground">Cargando estudiantes...</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Estudiantes</h1>
          <p className="text-muted-foreground mt-1">
            {students.length} {students.length === 1 ? 'estudiante' : 'estudiantes'} registrados
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Importar CSV
          </Button>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Estudiante
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, apellido, RUT o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Lista de estudiantes */}
      {filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'No se encontraron estudiantes' : 'No hay estudiantes registrados'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm
                ? 'Intenta con otros términos de búsqueda'
                : 'Comienza agregando estudiantes a tu nómina para asignarlos a evaluaciones.'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Primer Estudiante
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredStudents.map((student) => (
            <Card
              key={student.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleStudentClick(student)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {student.name} {student.lastName}
                      </CardTitle>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="font-mono">{student.rut}</span>
                      {student.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {student.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEnrollStudent(student);
                      }}
                      className="flex items-center gap-1"
                    >
                      <GraduationCap className="w-3 h-3" />
                      Inscribir
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(student.id);
                      }}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de inscripción */}
      {selectedStudent && (
        <StudentSectionEnrollmentModal
          studentId={selectedStudent.id}
          studentName={`${selectedStudent.name} ${selectedStudent.lastName}`}
          open={enrollmentModalOpen}
          onOpenChange={setEnrollmentModalOpen}
        />
      )}

      {/* Modal de importación CSV */}
      <StudentCSVImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImportSuccess={handleImportSuccess}
      />

      {/* Modal de creación de estudiante */}
      <StudentCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

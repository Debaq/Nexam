import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/storage/db';
import { sectionsService } from '../services/sectionsService';
import { studentSectionsService } from '../services/studentSectionsService';
import { studentsService } from '../services/studentsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { ArrowLeft, Folder, Calendar, Users, GraduationCap, BookOpen, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import StudentSectionEnrollmentModal from './StudentSectionEnrollmentModal';
import SectionGradesTable from './SectionGradesTable';
import SectionEvaluationsTab from './SectionEvaluationsTab';

export const SectionDetailPage = ({ sectionId, onBack }) => {
  const section = useLiveQuery(() => sectionsService.getById(sectionId), [sectionId]);
  const sectionStudents = useLiveQuery(() => 
    studentSectionsService.getActiveBySection(sectionId), [sectionId]);

  const [enrollmentModalOpen, setEnrollmentModalOpen] = useState(false);

  if (!section) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Cargando sección...</p>
      </div>
    );
  }

  const handleAddStudents = () => {
    setEnrollmentModalOpen(true);
  };

  const handleEdit = () => {
    // TODO: Implementar edición de sección
    const newName = prompt('Nombre de la sección:', section.name);
    if (newName) {
      const newCode = prompt('Código de la sección:', section.code || '');
      const newYear = prompt('Año:', section.year.toString());
      const newFolder = prompt('Carpeta/Categoría:', section.folder || '');
      
      sectionsService.update(section.id, {
        name: newName,
        code: newCode || undefined,
        year: parseInt(newYear),
        folder: newFolder
      });
    }
  };

  const handleDelete = async () => {
    if (confirm('¿Eliminar esta sección? Esta acción también eliminará todas las inscripciones relacionadas.')) {
      await sectionsService.delete(section.id);
      onBack();
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              {section.name}
            </h1>
            <div className="flex items-center gap-4 text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Folder className="w-4 h-4" />
                {section.folder || 'Sin carpeta'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {section.year}
              </span>
              {section.code && (
                <span className="font-mono bg-muted px-2 py-0.5 rounded text-sm">
                  {section.code}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleEdit}
            className="flex items-center gap-2"
          >
            <GraduationCap className="w-4 h-4" />
            Editar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            className="flex items-center gap-2"
          >
            Eliminar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-5">
          <TabsTrigger value="overview">General</TabsTrigger>
          <TabsTrigger value="units">Unidades</TabsTrigger>
          <TabsTrigger value="evaluations">Evaluaciones</TabsTrigger>
          <TabsTrigger value="students">Estudiantes</TabsTrigger>
          <TabsTrigger value="grades">Calificaciones</TabsTrigger>
        </TabsList>

        {/* Vista general */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Información
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-muted-foreground">Nombre</span>
                    <p className="font-medium">{section.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Código</span>
                    <p className="font-medium">{section.code || 'No asignado'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Año</span>
                    <p className="font-medium">{section.year}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Carpeta</span>
                    <p className="font-medium">{section.folder || 'Sin carpeta'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Estadísticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Estudiantes</span>
                    <Badge variant="outline">{sectionStudents?.length || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Unidades</span>
                    <Badge variant="outline">0</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Evaluaciones</span>
                    <Badge variant="outline">0</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Acciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  onClick={handleAddStudents}
                  className="flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Agregar Estudiantes
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Unidades */}
        <TabsContent value="units">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Unidades</CardTitle>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Unidad
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay unidades registradas</p>
                <p className="text-sm mt-1">Crea unidades para organizar el contenido de la asignatura</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evaluaciones */}
        <TabsContent value="evaluations">
          <SectionEvaluationsTab sectionId={sectionId} />
        </TabsContent>

        {/* Estudiantes */}
        <TabsContent value="students">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Estudiantes ({sectionStudents?.length || 0})
              </CardTitle>
              <Button onClick={handleAddStudents} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Agregar
              </Button>
            </CardHeader>
            <CardContent>
              {sectionStudents && sectionStudents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Nombre</th>
                        <th className="text-left py-2 px-4">RUT</th>
                        <th className="text-left py-2 px-4">Email</th>
                        <th className="text-left py-2 px-4">Inscripción</th>
                        <th className="text-left py-2 px-4">Evaluaciones</th>
                        <th className="text-left py-2 px-4">Promedio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sectionStudents.map((enrollment) => {
                        const student = useLiveQuery(() =>
                          studentsService.getById(enrollment.studentId), [enrollment.studentId]);

                        if (!student) return null;

                        return (
                          <tr key={enrollment.id} className="border-b hover:bg-muted/10">
                            <td className="py-2 px-4">
                              <div className="font-medium">
                                {student.name} {student.lastName}
                              </div>
                            </td>
                            <td className="py-2 px-4">
                              {student.rut}
                            </td>
                            <td className="py-2 px-4">
                              {student.email || '-'}
                            </td>
                            <td className="py-2 px-4">
                              <Badge variant="outline">
                                {new Date(enrollment.enrollmentDate).toLocaleDateString('es-CL')}
                              </Badge>
                            </td>
                            <td className="py-2 px-4">
                              <div className="flex items-center gap-1">
                                <div className="w-8 h-5 bg-blue-100 rounded text-center text-xs text-blue-800">0</div>
                                <span className="text-xs text-muted-foreground">/0</span>
                              </div>
                            </td>
                            <td className="py-2 px-4">
                              <div className="text-muted-foreground">-</div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hay estudiantes inscritos</p>
                  <p className="text-sm mt-1">Agrega estudiantes para comenzar a trabajar con esta sección</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calificaciones */}
        <TabsContent value="grades">
          <SectionGradesTable sectionId={sectionId} />
        </TabsContent>
      </Tabs>

      {/* Modal de inscripción de estudiantes */}
      <StudentSectionEnrollmentModal
        studentId={null} // Este modal se usará para inscribir estudiantes a esta sección
        studentName=""
        open={enrollmentModalOpen}
        onOpenChange={setEnrollmentModalOpen}
        sectionId={sectionId}
        sectionName={section.name}
      />
    </div>
  );
};

export default SectionDetailPage;
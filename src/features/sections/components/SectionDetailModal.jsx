import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Calendar,
  BookOpen,
  Target,
  TrendingUp,
  Edit,
  Trash2,
  FolderOpen,
  FileText,
  HelpCircle,
  Users,
  GraduationCap
} from 'lucide-react';
import { sectionsService } from '../services/sectionsService';
import { studentSectionsService } from '@/features/students/services/studentSectionsService';
import { studentsService } from '@/features/students/services/studentsService';
import { examService } from '@/features/exams/services/examService';
import { sectionGradesService } from '../services/sectionGradesService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/storage/db';

export const SectionDetailModal = ({ open, onClose, section, onEdit, onDelete, getSemesterLabel }) => {
  const [stats, setStats] = useState(null);
  const [gradesData, setGradesData] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  
  // Obtener estudiantes de esta sección
  const sectionStudents = useLiveQuery(
    () => {
      if (!section?.id) return Promise.resolve([]);
      return studentSectionsService.getActiveBySection(section.id);
    },
    [section?.id],
    [] // valor por defecto
  );

  // Obtener exámenes de esta sección
  const sectionExams = useLiveQuery(
    () => {
      if (!section?.id) return Promise.resolve([]);
      return db.exams.where('sectionId').equals(section.id).toArray();
    },
    [section?.id],
    [] // valor por defecto
  );

  useEffect(() => {
    if (section && open) {
      const loadStats = async () => {
        const sectionStats = await sectionsService.getStatistics(section.id);
        setStats(sectionStats);
      };
      loadStats();
    }
  }, [section, open]);

  useEffect(() => {
    const loadGrades = async () => {
      if (section && sectionStudents) {
        setLoadingGrades(true);
        try {
          const data = await sectionGradesService.getSectionGrades(section.id);
          setGradesData(data);
        } catch (error) {
          console.error('Error al cargar calificaciones:', error);
          setGradesData([]);
        } finally {
          setLoadingGrades(false);
        }
      }
    };

    if (section && sectionStudents) {
      loadGrades();
    }
  }, [section, sectionStudents]);

  if (!section) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl">{section.name}</DialogTitle>
              <DialogDescription className="mt-1">
                {section.code} • {section.year} • {getSemesterLabel(section.semester)}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={onDelete}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full max-w-6xl grid-cols-5">
            <TabsTrigger value="overview">General</TabsTrigger>
            <TabsTrigger value="units">Unidades</TabsTrigger>
            <TabsTrigger value="evaluations">Evaluaciones</TabsTrigger>
            <TabsTrigger value="students">Estudiantes</TabsTrigger>
            <TabsTrigger value="grades">Calificaciones</TabsTrigger>
          </TabsList>

          {/* Vista general */}
          <TabsContent value="overview" className="space-y-6">
            {/* Descripción */}
            {section.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Descripción</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{section.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Información General */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Período</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(section.startDate)} - {formatDate(section.endDate)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Carpeta</div>
                      <div className="text-sm text-muted-foreground">{section.folder}</div>
                    </div>
                  </div>
                </div>

                {section.metadata?.level && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Nivel Educativo</div>
                      <div className="text-sm text-muted-foreground">{section.metadata.level}</div>
                    </div>
                  </div>
                )}

                {section.metadata?.subject && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Materia</div>
                      <div className="text-sm text-muted-foreground">{section.metadata.subject}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Estadísticas */}
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Estadísticas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-3xl font-bold text-primary">{stats.examsCount}</div>
                      <div className="text-sm text-muted-foreground mt-1">Exámenes</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-3xl font-bold text-primary">{stats.questionsCount}</div>
                      <div className="text-sm text-muted-foreground mt-1">Preguntas</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-3xl font-bold text-primary">{stats.unitsCount}</div>
                      <div className="text-sm text-muted-foreground mt-1">Unidades</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-3xl font-bold text-primary">{sectionStudents?.length || 0}</div>
                      <div className="text-sm text-muted-foreground mt-1">Estudiantes</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-3xl font-bold text-primary">{sectionExams?.length || 0}</div>
                      <div className="text-sm text-muted-foreground mt-1">Evaluaciones</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Objetivos */}
            {section.objectives?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Objetivos del Curso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {section.objectives.map((objective, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-sm">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Unidades */}
          <TabsContent value="units" className="space-y-4">
            {section.units?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay unidades de aprendizaje configuradas</p>
                <p className="text-sm mt-1">Edita la sección para agregar unidades</p>
              </div>
            ) : (
              section.units?.map((unit, index) => (
                <Card key={unit.id}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Unidad {unit.order}: {unit.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {unit.objectives?.length > 0 && (
                      <div>
                        <div className="text-sm font-medium mb-2">Objetivos:</div>
                        <ul className="space-y-1">
                          {unit.objectives.map((objective, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex gap-2">
                              <span>•</span>
                              <span>{objective}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {unit.weighting && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Ponderación:</span> {unit.weighting}%
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Evaluaciones */}
          <TabsContent value="evaluations">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Evaluaciones Asociadas ({sectionExams?.length || 0})
                </CardTitle>
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
                            <span className="font-mono">{exam.type === 'uniform' ? 'Uniforme' : 'Diferenciado'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No hay evaluaciones asociadas a esta sección</p>
                    <p className="text-sm mt-1">Asocia exámenes para comenzar a registrar calificaciones</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Estudiantes */}
          <TabsContent value="students">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Estudiantes ({sectionStudents?.length || 0})
                </CardTitle>
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
                        {sectionStudents?.map((enrollment) => {
                          const student = useLiveQuery(
                            () => {
                              if (!enrollment?.studentId) return Promise.resolve(null);
                              return studentsService.getById(enrollment.studentId);
                            },
                            [enrollment?.studentId],
                            null // valor por defecto
                          );

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
                                <span className="text-sm">
                                  {new Date(enrollment.enrollmentDate).toLocaleDateString('es-CL')}
                                </span>
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
                    <p>No hay estudiantes inscritos en esta sección</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calificaciones */} 
          <TabsContent value="grades">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    Tabla de Calificaciones
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingGrades ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Cargando calificaciones...
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4">Estudiante</th>
                          <th className="text-left py-2 px-4">RUT</th>
                          <th className="text-left py-2 px-4">Promedio</th>
                          <th className="text-left py-2 px-4">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gradesData && gradesData.length > 0 ? (
                          gradesData.map((studentData) => (
                            <tr key={studentData.studentId} className="border-b hover:bg-muted/10">
                              <td className="py-2 px-4">
                                <div className="font-medium">
                                  {studentData.studentName}
                                </div>
                              </td>
                              <td className="py-2 px-4">
                                {studentData.studentRut}
                              </td>
                              <td className="py-2 px-4">
                                {studentData.average !== null ? (
                                  <div className="w-10 h-6 bg-purple-100 rounded text-center text-xs text-purple-800">
                                    {studentData.average.toFixed(1)}
                                  </div>
                                ) : (
                                  <div className="text-muted-foreground">-</div>
                                )}
                              </td>
                              <td className="py-2 px-4">
                                <span className="text-xs">
                                  {studentData.average !== null && studentData.average >= 4 ? "Aprobado" : "En curso"}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center py-8 text-muted-foreground">
                              No hay calificaciones registradas para esta sección
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SectionDetailModal;
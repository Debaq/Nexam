import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { db } from '@/core/storage/db';
import { studentsService } from '../services/studentsService';
import { studentSectionsService } from '../services/studentSectionsService';
import { ArrowLeft, User, Mail, Calendar, GraduationCap, FileText, Edit3, Trash2 } from 'lucide-react';
import StudentSectionsCard from './StudentSectionsCard';
import StudentAcademicHistory from './StudentAcademicHistory';

export const StudentDetailPage = ({ studentId, onBack }) => {
  const student = useLiveQuery(() => studentsService.getById(studentId), [studentId]);
  const sections = useLiveQuery(() => studentSectionsService.getActiveByStudent(studentId), [studentId]);

  if (!student) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Cargando estudiante...</p>
      </div>
    );
  }

  const handleEdit = () => {
    // TODO: Implementar edición de estudiante
    alert('Funcionalidad de edición próximamente');
  };

  const handleDelete = async () => {
    if (confirm('¿Eliminar este estudiante? Esta acción también eliminará todas sus inscripciones.')) {
      await studentsService.delete(student.id);
      onBack();
    }
  };

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="w-6 h-6" />
            {student.name} {student.lastName}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleEdit}
            className="flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            Editar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* Información principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">RUT</div>
              <div className="font-mono">{student.rut}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="flex items-center gap-2">
                {student.email ? (
                  <>
                    <Mail className="w-4 h-4" />
                    {student.email}
                  </>
                ) : (
                  <span className="text-muted-foreground italic">No registrado</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Fecha de Registro</div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(student.createdAt).toLocaleDateString('es-CL')}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Estadísticas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Secciones Activas</span>
              <Badge variant="outline">{sections?.length || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Historial Total</span>
              <Badge variant="outline">TODO</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Exámenes</span>
              <Badge variant="outline">TODO</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Acciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full">
              Exportar Informe
            </Button>
            <Button variant="outline" className="w-full">
              Ver Evaluaciones
            </Button>
            <Button variant="outline" className="w-full">
              Generar Certificado
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Secciones e historial académico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StudentSectionsCard studentId={student.id} />
        <StudentAcademicHistory studentId={student.id} />
      </div>
    </div>
  );
};

export default StudentDetailPage;
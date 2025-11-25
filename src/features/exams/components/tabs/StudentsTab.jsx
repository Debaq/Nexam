import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/storage/db';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Users, Plus, Trash2 } from 'lucide-react';

const StudentCard = ({ studentId, examCodes }) => {
  const student = useLiveQuery(() => db.students.get(studentId), [studentId]);

  if (!student) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Cargando estudiante...</p>
        </CardContent>
      </Card>
    );
  }

  const code = examCodes ? examCodes[studentId] : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">
              {student.name} {student.lastName}
            </h4>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="font-mono">{student.rut}</span>
              {code && (
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-mono">
                  Código: {code}
                </span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
};

export const StudentsTab = ({ exam, onAddStudents }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        {exam.students.length === 0
          ? 'No hay estudiantes asignados'
          : `${exam.students.length} estudiante(s) asignado(s)`
        }
      </p>
      <Button onClick={onAddStudents}>
        <Plus className="w-4 h-4 mr-2" />
        Agregar Estudiantes
      </Button>
    </div>

    {exam.students.length === 0 ? (
      <Card>
        <CardContent className="p-12 text-center">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            No hay estudiantes asignados
          </h3>
          <p className="text-muted-foreground mb-6">
            Agrega estudiantes desde tu nómina o importa un CSV.
          </p>
          <Button onClick={onAddStudents}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Estudiantes
          </Button>
        </CardContent>
      </Card>
    ) : (
      <div className="space-y-3">
        {exam.students.map((studentId) => (
          <StudentCard key={studentId} studentId={studentId} examCodes={exam.codes} />
        ))}
      </div>
    )}
  </div>
);

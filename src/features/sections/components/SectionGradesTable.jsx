import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { db } from '@/core/storage/db';
import { studentsService } from '../services/studentsService';
import { studentSectionsService } from '../services/studentSectionsService';
import sectionGradesService from '../services/sectionGradesService';

export const SectionGradesTable = ({ sectionId }) => {
  const [gradesData, setGradesData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Obtenemos los estudiantes inscritos en la sección
  const enrolledStudents = useLiveQuery(() =>
    studentSectionsService.getActiveBySection(sectionId), [sectionId]);

  useEffect(() => {
    const loadGrades = async () => {
      setLoading(true);
      try {
        const data = await sectionGradesService.getSectionGrades(sectionId);
        setGradesData(data);
      } catch (error) {
        console.error('Error al cargar calificaciones:', error);
        setGradesData([]);
      } finally {
        setLoading(false);
      }
    };

    if (sectionId) {
      loadGrades();
    }
  }, [sectionId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Cargando calificaciones...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Tabla de Calificaciones</span>
          <Badge variant="outline">{gradesData.length} estudiantes</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Estudiante</th>
                <th className="text-left py-2 px-4">RUT</th>
                {gradesData.length > 0 && gradesData[0].results && gradesData[0].results.length > 0 ? (
                  gradesData[0].results.map((result, index) => (
                    <th key={result.examId} className="text-left py-2 px-4">
                      {result.examTitle || `Evaluación ${index + 1}`}
                    </th>
                  ))
                ) : (
                  <th className="text-left py-2 px-4">No hay evaluaciones</th>
                )}
                <th className="text-left py-2 px-4">Promedio</th>
                <th className="text-left py-2 px-4">Estado</th>
              </tr>
            </thead>
            <tbody>
              {gradesData.map((studentData, index) => (
                <tr key={studentData.studentId} className="border-b hover:bg-muted/10">
                  <td className="py-2 px-4">
                    <div className="font-medium">
                      {studentData.studentName}
                    </div>
                  </td>
                  <td className="py-2 px-4">
                    {studentData.studentRut}
                  </td>
                  {studentData.results && studentData.results.length > 0 ? (
                    studentData.results.map((result) => (
                      <td key={result.examId} className="py-2 px-4">
                        <div className="w-10 h-6 bg-green-100 rounded text-center text-xs text-green-800">
                          {result.score.toFixed(1)}
                        </div>
                      </td>
                    ))
                  ) : (
                    <td className="py-2 px-4 text-muted-foreground">
                      Sin evaluaciones
                    </td>
                  )}
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
                    <Badge variant={studentData.average !== null && studentData.average >= 4 ? "default" : "secondary"}>
                      {studentData.average !== null && studentData.average >= 4 ? "Aprobado" : "En curso"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {gradesData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No hay estudiantes inscritos en esta sección o no hay evaluaciones registradas
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SectionGradesTable;
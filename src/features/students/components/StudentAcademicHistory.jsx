import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { db } from '@/core/storage/db';
import { studentsService } from '../services/studentsService';
import { studentSectionsService } from '../services/studentSectionsService';
import { ChartNoAxesCombined, Calendar, GraduationCap, BookOpen, Search } from 'lucide-react';

export const StudentAcademicHistory = ({ studentId }) => {
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  
  const studentHistory = useLiveQuery(() => 
    studentSectionsService.getStudentHistory(studentId), [studentId]);

  if (!studentHistory) return null;

  // Agrupar por año y semestre
  const groupedHistory = studentHistory.reduce((acc, enrollment) => {
    const key = `${enrollment.year}-${enrollment.semester}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(enrollment);
    return acc;
  }, {});

  // Obtener años únicos
  const years = [...new Set(studentHistory.map(e => e.year))].sort((a, b) => b - a);
  const semesters = [...new Set(studentHistory.map(e => e.semester))].sort((a, b) => a - b);

  // Filtrar según selección
  let filteredHistory = studentHistory;
  if (selectedYear !== 'all') {
    filteredHistory = filteredHistory.filter(e => e.year === parseInt(selectedYear));
  }
  if (selectedSemester !== 'all') {
    filteredHistory = filteredHistory.filter(e => e.semester === parseInt(selectedSemester));
  }

  const groupedFiltered = filteredHistory.reduce((acc, enrollment) => {
    const key = `${enrollment.year}-${enrollment.semester}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(enrollment);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ChartNoAxesCombined className="w-5 h-5" />
          Historial Académico
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <Label htmlFor="year">Año</Label>
            <select
              id="year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full p-2 border rounded-md mt-1"
            >
              <option value="all">Todos los años</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div>
            <Label htmlFor="semester">Semestre</Label>
            <select
              id="semester"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full p-2 border rounded-md mt-1"
            >
              <option value="all">Todos</option>
              {semesters.map(sem => (
                <option key={sem} value={sem}>Semestre {sem}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay historial académico registrado</p>
            <p className="text-sm mt-1">El estudiante no ha estado inscrito en ninguna sección</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedFiltered).map(([period, enrollments]) => {
              const [year, semester] = period.split('-');
              return (
                <div key={period} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {year} - Semestre {semester}
                    </h3>
                  </div>
                  
                  <div className="grid gap-3">
                    {enrollments.map((enrollment) => (
                      <div key={enrollment.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" />
                            {enrollment.section?.name || 'Sección desconocida'}
                          </div>
                          {enrollment.section?.code && (
                            <div className="text-sm text-muted-foreground">
                              Código: {enrollment.section.code}
                            </div>
                          )}
                        </div>
                        <Badge variant={enrollment.active ? "default" : "secondary"}>
                          {enrollment.active ? "Activa" : "Finalizada"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentAcademicHistory;
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { studentSectionsService } from '../services/studentSectionsService';
import { db } from '@/core/storage/db';
import { User, GraduationCap, Calendar, X } from 'lucide-react';

export const StudentSectionsCard = ({ studentId }) => {
  const [showHistory, setShowHistory] = useState(false);
  
  const activeSections = useLiveQuery(() => 
    studentSectionsService.getActiveByStudent(studentId), [studentId]);
  
  const allSections = useLiveQuery(() => 
    studentSectionsService.getStudentHistory(studentId), [studentId]);

  const sections = showHistory ? allSections : activeSections;

  if (!sections) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <GraduationCap className="w-5 h-5" />
          Secciones
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant={showHistory ? "default" : "outline"}
            size="sm"
            onClick={() => setShowHistory(true)}
          >
            Historial
          </Button>
          <Button
            variant={!showHistory ? "default" : "outline"}
            size="sm"
            onClick={() => setShowHistory(false)}
          >
            Activas
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {sections.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
            {showHistory 
              ? 'No hay historial académico registrado' 
              : 'No está inscrito en ninguna sección'}
          </div>
        ) : (
          <div className="space-y-3">
            {sections.map((enrollment) => (
              <div key={enrollment.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">
                    {enrollment.section?.name || 'Sección desconocida'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>{enrollment.year} - Semestre {enrollment.semester}</span>
                    {enrollment.section?.code && (
                      <span className="font-mono">({enrollment.section.code})</span>
                    )}
                  </div>
                </div>
                <Badge variant={enrollment.active ? "default" : "secondary"}>
                  {enrollment.active ? "Activa" : "Finalizada"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentSectionsCard;
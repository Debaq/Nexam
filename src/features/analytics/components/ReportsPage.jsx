import React from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { BarChart3, TrendingUp } from 'lucide-react';

export const ReportsPage = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Reportes y Análisis</h1>
        <p className="text-muted-foreground mt-1">
          Visualiza estadísticas y rendimiento de evaluaciones
        </p>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            Análisis Estadístico
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Una vez que tengas exámenes corregidos, podrás ver aquí:
          </p>
          <div className="max-w-md mx-auto text-left space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Estadísticas por evaluación</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Análisis por pregunta (dificultad real)</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Rendimiento de estudiantes</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Gráficos y visualizaciones</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Export de reportes en PDF/Excel</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;

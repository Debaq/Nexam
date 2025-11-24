import React from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { ScanLine, Upload } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

export const CorrectionPage = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Corrección Automática</h1>
        <p className="text-muted-foreground mt-1">
          Sube hojas de respuesta escaneadas para corrección con IA
        </p>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <ScanLine className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            Corrección Automática con Computer Vision
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Esta funcionalidad estará disponible en la Semana 3.
            Podrás subir hojas de respuesta escaneadas y el sistema las corregirá
            automáticamente usando YOLOv11n y OpenCV.
          </p>
          <div className="flex gap-3 justify-center">
            <Button disabled>
              <Upload className="w-4 h-4 mr-2" />
              Subir Hoja de Respuesta
            </Button>
            <Button variant="outline" disabled>
              Entrenar Modelo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CorrectionPage;

import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { studentsService } from '../services/studentsService';
import { Upload, Download, AlertCircle, CheckCircle, X } from 'lucide-react';

export const StudentCSVImportModal = ({ open, onOpenChange, onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [parsingResult, setParsingResult] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file) => {
    setIsParsing(true);
    setParsingResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length === 0) {
        setIsParsing(false);
        return;
      }

      // Parsear encabezados
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Verificar que tenga los encabezados necesarios
      const requiredHeaders = ['nombre', 'apellido', 'rut', 'email'];
      const hasRequiredHeaders = requiredHeaders.every(h => headers.includes(h));
      
      if (!hasRequiredHeaders) {
        setParsingResult({
          error: 'El archivo CSV debe contener las columnas: nombre, apellido, rut, email',
          validStudents: [],
          invalidLines: []
        });
        setIsParsing(false);
        return;
      }

      // Parsear líneas
      const validStudents = [];
      const invalidLines = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === '') continue;

        try {
          const values = parseCSVLine(line);
          if (values.length !== headers.length) {
            invalidLines.push({ line: i + 1, data: line, error: 'Número incorrecto de columnas' });
            continue;
          }

          const student = {};
          headers.forEach((header, index) => {
            student[header] = values[index]?.trim() || '';
          });

          // Validar formato básico
          const validation = studentsService.validate({
            name: student.nombre,
            lastName: student.apellido,
            rut: student.rut,
            email: student.email
          });

          if (validation.valid) {
            validStudents.push({
              name: student.nombre,
              lastName: student.apellido,
              rut: student.rut,
              email: student.email
            });
          } else {
            invalidLines.push({ 
              line: i + 1, 
              data: line, 
              error: validation.errors.join(', ')
            });
          }
        } catch (error) {
          invalidLines.push({ line: i + 1, data: line, error: error.message });
        }
      }

      setParsingResult({
        validStudents,
        invalidLines
      });
      setIsParsing(false);
    };

    reader.readAsText(file);
  };

  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  };

  const handleImport = async () => {
    if (!parsingResult || parsingResult.validStudents.length === 0) return;

    setIsImporting(true);

    try {
      const result = await studentsService.bulkCreate(parsingResult.validStudents);
      
      if (result.errors.length > 0) {
        // Mostrar errores si los hay
        const errorLines = result.errors.map((error, index) => ({
          line: index + 1,
          data: JSON.stringify(error.data),
          error: error.error
        }));
        
        setParsingResult(prev => ({
          ...prev,
          errorLines: errorLines
        }));
      }

      onImportSuccess && onImportSuccess(result);
      onOpenChange(false);
      setFile(null);
      setParsingResult(null);
    } catch (error) {
      console.error('Error importing students:', error);
      alert('Error al importar estudiantes: ' + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setParsingResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) {
        reset();
      }
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Importar Estudiantes desde CSV
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Formato del archivo CSV</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Columnas requeridas: <code className="bg-blue-100 px-1 rounded">nombre, apellido, rut, email</code></li>
              <li>• Separador: coma (,)</li>
              <li>• Codificación: UTF-8</li>
              <li>• Ejemplo: <code className="bg-blue-100 px-1 rounded">Juan,Pérez,12345678-9,juan@ejemplo.com</code></li>
            </ul>
          </div>

          <div>
            <Label htmlFor="csv-file">Seleccionar archivo CSV</Label>
            <div className="mt-2 flex items-center gap-3">
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="flex-1"
              />
              <Button variant="outline" size="sm" asChild>
                <a 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    // Crear archivo CSV de ejemplo
                    const csvContent = "nombre,apellido,rut,email\nJuan,Pérez,12345678-9,juan@ejemplo.com\nMaría,González,98765432-1,maria@ejemplo.com";
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'ejemplo_estudiantes.csv';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar Plantilla
                </a>
              </Button>
            </div>
          </div>

          {isParsing && (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3">Procesando archivo...</span>
            </div>
          )}

          {parsingResult && !isParsing && (
            <div className="space-y-4">
              {parsingResult.error && (
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-4 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-red-800">{parsingResult.error}</p>
                  </CardContent>
                </Card>
              )}

              {parsingResult.validStudents && parsingResult.validStudents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Estudiantes Válidos
                      <Badge variant="secondary">{parsingResult.validStudents.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-40 overflow-y-auto border rounded-md">
                      {parsingResult.validStudents.slice(0, 5).map((student, index) => (
                        <div key={index} className="p-3 border-b last:border-b-0 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span>
                            {student.name} {student.lastName} - {student.rut} 
                            {student.email && ` (${student.email})`}
                          </span>
                        </div>
                      ))}
                      {parsingResult.validStudents.length > 5 && (
                        <div className="p-3 text-sm text-muted-foreground">
                          +{parsingResult.validStudents.length - 5} más...
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {parsingResult.invalidLines && parsingResult.invalidLines.length > 0 && (
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      Líneas con Errores
                      <Badge variant="destructive">{parsingResult.invalidLines.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-40 overflow-y-auto border rounded-md">
                      {parsingResult.invalidLines.map((error, index) => (
                        <div key={index} className="p-3 border-b last:border-b-0 bg-red-50 flex items-start gap-2">
                          <X className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-sm">
                              <span className="font-medium">Línea {error.line}:</span> {error.data}
                            </div>
                            <div className="text-xs text-red-700 mt-1">{error.error}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {parsingResult.validStudents && parsingResult.validStudents.length > 0 && (
                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleImport} 
                    disabled={isImporting}
                    className="flex items-center gap-2"
                  >
                    {isImporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Importando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Importar {parsingResult.validStudents.length} estudiantes
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentCSVImportModal;
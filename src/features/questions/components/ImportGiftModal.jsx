import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { giftParser } from '@/core/export/giftParser';
import { questionsService } from '../services/questionsService';
import { Upload, FileText } from 'lucide-react';

export const ImportGiftModal = ({ open, onClose, onComplete }) => {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('');
  const [importing, setImporting] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file || !category) {
      alert('Por favor selecciona un archivo y especifica una categoría');
      return;
    }

    setImporting(true);
    try {
      const text = await file.text();
      const questions = giftParser.parse(text);

      // Agregar categoría a todas las preguntas
      const questionsWithCategory = questions.map(q => ({
        ...q,
        category
      }));

      // Importar todas las preguntas
      for (const question of questionsWithCategory) {
        await questionsService.create(question);
      }

      alert(`${questions.length} preguntas importadas correctamente`);
      onComplete?.();
      handleClose();
    } catch (error) {
      alert('Error al importar: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setCategory('');
    setImporting(false);
    onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Importar desde GIFT</DialogTitle>
          <DialogDescription>
            Importa preguntas desde archivos en formato GIFT (Moodle). Selecciona un archivo y asigna una categoría.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Formato GIFT:</strong> Archivo de texto con preguntas en formato Moodle GIFT.
            </p>
          </div>

          {/* Archivo */}
          <div>
            <Label htmlFor="gift-file">Archivo GIFT *</Label>
            <Input
              id="gift-file"
              type="file"
              accept=".txt,.gift"
              onChange={handleFileChange}
              className="mt-1"
            />
            {file && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                {file.name}
              </div>
            )}
          </div>

          {/* Categoría */}
          <div>
            <Label htmlFor="category">Categoría para las preguntas *</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ej: Matemáticas Importadas"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Todas las preguntas importadas se asignarán a esta categoría
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={importing}>
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={importing || !file || !category}>
              {importing ? (
                'Importando...'
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Importar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

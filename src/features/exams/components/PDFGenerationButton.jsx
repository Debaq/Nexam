import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog';
import { Download, ChevronDown, FileCheck, FilePlus, Lock, AlertTriangle } from 'lucide-react';

export const PDFGenerationButton = ({ exam, onGenerateDraft, onGenerateFinal }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);
  const isFinalized = exam.status === 'finalized';

  const handleFinalizeClick = () => {
    setShowDropdown(false);
    setShowFinalizeDialog(true);
  };

  const handleConfirmFinalize = async () => {
    setShowFinalizeDialog(false);
    await onGenerateFinal();
  };

  return (
    <>
      <div className="relative">
        {isFinalized ? (
          // Si ya está finalizado, solo mostrar botón de descargar
          <Button onClick={onGenerateDraft} className="bg-green-600 hover:bg-green-700">
            <Download className="w-4 h-4 mr-2" />
            Descargar Examen
          </Button>
        ) : (
          // Si es borrador, mostrar dropdown
          <div className="flex">
            <Button onClick={onGenerateDraft} className="rounded-r-none">
              <Download className="w-4 h-4 mr-2" />
              Generar Borrador
            </Button>
            <Button
              onClick={() => setShowDropdown(!showDropdown)}
              className="rounded-l-none border-l border-l-white/20 px-2"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Dropdown Menu */}
        {showDropdown && !isFinalized && (
          <div className="absolute top-full mt-1 right-0 bg-white border rounded-md shadow-lg z-10 min-w-[250px]">
            <button
              onClick={() => {
                setShowDropdown(false);
                onGenerateDraft();
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-start gap-3 border-b"
            >
              <FilePlus className="w-5 h-5 mt-0.5 text-gray-600" />
              <div>
                <div className="font-medium text-sm">Generar Borrador</div>
                <div className="text-xs text-gray-500">
                  PDF con marca de agua "BORRADOR"
                </div>
              </div>
            </button>
            <button
              onClick={handleFinalizeClick}
              className="w-full px-4 py-3 text-left hover:bg-green-50 flex items-start gap-3"
            >
              <Lock className="w-5 h-5 mt-0.5 text-green-600" />
              <div>
                <div className="font-medium text-sm text-green-700">
                  Finalizar y Generar PDFs Oficiales
                </div>
                <div className="text-xs text-gray-500">
                  Sin marca de agua - IRREVERSIBLE
                </div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Modal de confirmación de finalización */}
      <Dialog open={showFinalizeDialog} onOpenChange={setShowFinalizeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              ⚠️ Advertencia: Acción Irreversible
            </DialogTitle>
            <DialogDescription className="text-base">
              Está a punto de <strong>FINALIZAR</strong> este examen. Esta acción es <strong>IRREVERSIBLE</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 mb-2">
                ¿Qué sucederá al finalizar?
              </h4>
              <ul className="text-sm text-yellow-800 space-y-1.5">
                <li className="flex gap-2">
                  <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>El examen quedará <strong>bloqueado permanentemente</strong></span>
                </li>
                <li className="flex gap-2">
                  <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>No podrá modificar la configuración ni las preguntas</span>
                </li>
                <li className="flex gap-2">
                  <FileCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Se creará una copia inmutable de todas las preguntas</span>
                </li>
                <li className="flex gap-2">
                  <FileCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Los PDFs generados NO tendrán marca de agua "BORRADOR"</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">
                Sistema de Seguridad y Trazabilidad
              </h4>
              <p className="text-sm text-blue-800">
                Este sistema garantiza la <strong>integridad académica</strong> del examen.
                Las preguntas y configuración quedan registradas permanentemente,
                asegurando que no puedan ser modificadas después de su aplicación.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">
                Información del Examen
              </h4>
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>Título:</strong> {exam.title}</p>
                <p><strong>Preguntas:</strong> {exam.questions.length}</p>
                <p><strong>Estudiantes:</strong> {exam.students.length}</p>
                <p><strong>Tipo:</strong> {exam.type === 'uniform' ? 'Uniforme' : 'Diferenciado'}</p>
              </div>
            </div>

            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-900 text-center">
                ⚠️ Una vez finalizado, esta acción NO SE PUEDE DESHACER ⚠️
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowFinalizeDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmFinalize}
              className="bg-red-600 hover:bg-red-700"
            >
              <Lock className="w-4 h-4 mr-2" />
              Entiendo los Riesgos - Finalizar Examen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

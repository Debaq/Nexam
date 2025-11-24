import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/storage/db';
import { examService } from '../services/examService';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Plus,
  Calendar,
  FileText,
  Folder,
  MoreVertical,
  Copy,
  Trash2,
  FolderInput,
  Search,
  FolderPlus
} from 'lucide-react';
import { ExamWizard } from './ExamWizard';
import { ExamDetail } from './ExamDetail';
import { CategoryManagerModal } from '@/shared/components/CategoryManagerModal';

export const ExamsPage = () => {
  const exams = useLiveQuery(() => db.exams.toArray(), []);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [menuOpen, setMenuOpen] = useState(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  // Obtener carpetas únicas
  const folders = exams ? ['Todos', ...new Set(exams.map(e => e.folder || 'Sin carpeta'))] : ['Todos'];

  // Filtrar exámenes
  const filteredExams = exams?.filter(exam => {
    const matchesFolder = selectedFolder === 'Todos' || (exam.folder || 'Sin carpeta') === selectedFolder;
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFolder && matchesSearch;
  }) || [];

  const handleDuplicate = async (examId) => {
    try {
      await examService.duplicate(examId);
      setMenuOpen(null);
    } catch (error) {
      alert('Error al duplicar examen: ' + error.message);
    }
  };

  const handleDelete = async (examId) => {
    if (confirm('¿Eliminar este examen? Esta acción no se puede deshacer.')) {
      try {
        await examService.delete(examId);
        setMenuOpen(null);
      } catch (error) {
        alert('Error al eliminar examen: ' + error.message);
      }
    }
  };

  const handleMoveToFolder = async (examId) => {
    const folder = prompt('Nombre de la carpeta:', 'Sin carpeta');
    if (folder !== null) {
      try {
        await examService.moveToFolder(examId, folder);
        setMenuOpen(null);
      } catch (error) {
        alert('Error al mover examen: ' + error.message);
      }
    }
  };

  if (!exams) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Cargando exámenes...</p>
      </div>
    );
  }

  // Si hay un examen seleccionado, mostrar vista de detalle
  if (selectedExamId) {
    return (
      <ExamDetail
        examId={selectedExamId}
        onBack={() => setSelectedExamId(null)}
      />
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Exámenes</h1>
          <p className="text-muted-foreground mt-1">
            {exams.length} {exams.length === 1 ? 'examen' : 'exámenes'} creados
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCategoryModalOpen(true)}>
            <FolderPlus className="w-4 h-4 mr-2" />
            Carpetas
          </Button>
          <Button onClick={() => setWizardOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Examen
          </Button>
        </div>
      </div>

      {/* Filters and Content */}
      <div className="flex gap-4">
        {/* Folders Sidebar */}
        <div className="flex-none w-48">
          <div className="space-y-1">
            {folders.map(folder => (
              <button
                key={folder}
                onClick={() => setSelectedFolder(folder)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedFolder === folder
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <Folder className="w-4 h-4" />
                <span className="flex-1 text-left">{folder}</span>
                {folder !== 'Todos' && (
                  <span className="text-xs">
                    {exams.filter(e => (e.folder || 'Sin carpeta') === folder).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar exámenes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Lista de exámenes */}
          {filteredExams.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm || selectedFolder !== 'Todos'
                    ? 'No se encontraron exámenes'
                    : 'No hay exámenes creados'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm || selectedFolder !== 'Todos'
                    ? 'Intenta cambiar los filtros de búsqueda'
                    : 'Comienza creando tu primer examen. Podrás configurar preguntas, asignar estudiantes y generar PDFs automáticamente.'}
                </p>
                {!searchTerm && selectedFolder === 'Todos' && (
                  <Button onClick={() => setWizardOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primer Examen
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredExams.map((exam) => (
                <Card key={exam.id} className="hover:shadow-lg transition-shadow relative">
                  {/* Menu button */}
                  <div className="absolute top-3 right-3 z-10">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(menuOpen === exam.id ? null : exam.id);
                      }}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>

                    {menuOpen === exam.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-background border rounded-md shadow-lg z-20">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(exam.id);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted"
                        >
                          <Copy className="w-4 h-4" />
                          Duplicar (sin estudiantes)
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveToFolder(exam.id);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted"
                        >
                          <FolderInput className="w-4 h-4" />
                          Mover a carpeta
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(exam.id);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>

                  <div onClick={() => setSelectedExamId(exam.id)} className="cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg pr-8">{exam.title}</CardTitle>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        <Calendar className="w-3 h-3" />
                        {new Date(exam.date).toLocaleDateString('es-CL')}
                      </div>
                      {exam.folder && exam.folder !== 'Sin carpeta' && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Folder className="w-3 h-3" />
                          {exam.folder}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Preguntas:</span>
                          <span className="font-medium">{exam.questions.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Estudiantes:</span>
                          <span className="font-medium">{exam.students.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Tipo:</span>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            {exam.type === 'uniform' ? 'Uniforme' : 'Diferenciado'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Wizard Modal */}
      <ExamWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onComplete={() => {
          setWizardOpen(false);
          // La lista se actualizará automáticamente por useLiveQuery
        }}
      />

      {/* Category Manager Modal */}
      <CategoryManagerModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        categories={folders.filter(f => f !== 'Todos' && f !== 'Sin carpeta')}
        onUpdate={(newFolders) => {
          // Las carpetas se actualizarán automáticamente cuando se creen/editen exámenes
          console.log('Carpetas actualizadas:', newFolders);
        }}
        title="Gestionar Carpetas de Exámenes"
      />
    </div>
  );
};

export default ExamsPage;

import React, { useState } from 'react';
import { useQuestions } from '../hooks/useQuestions';
import { questionsService } from '../services/questionsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Plus, Search, Filter, Trash2, Upload, FolderPlus, Folder, FileDown, Edit } from 'lucide-react';
import { QuestionFormModal } from './QuestionFormModal';
import { ImportGiftModal } from './ImportGiftModal';
import { CategoryManagerModal } from '@/shared/components/CategoryManagerModal';

export const QuestionsPage = () => {
  const { questions, isLoading, delete: deleteQuestion } = useQuestions();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  // Obtener categorías únicas
  const categories = questions ? ['Todas', ...new Set(questions.map(q => q.category || 'Sin categoría'))] : ['Todas'];

  // Filtrar preguntas
  const filteredQuestions = questions.filter(q => {
    const matchesCategory = selectedCategory === 'Todas' || (q.category || 'Sin categoría') === selectedCategory;
    const matchesSearch =
      q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar esta pregunta?')) {
      await deleteQuestion(id);
    }
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    setQuestionModalOpen(true);
  };

  const handleCloseModal = () => {
    setQuestionModalOpen(false);
    setEditingQuestion(null);
  };

  const handleExportCategory = async (category) => {
    try {
      const { filename, content, questionCount } = await questionsService.exportCategoryToGift(category);

      // Crear blob y descargar
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(`Categoría exportada: ${questionCount} preguntas`);
    } catch (error) {
      alert('Error al exportar: ' + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Cargando preguntas...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Banco de Preguntas</h1>
          <p className="text-muted-foreground mt-1">
            {questions.length} {questions.length === 1 ? 'pregunta' : 'preguntas'} disponibles
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setGiftModalOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Importar GIFT
          </Button>
          <Button variant="outline" onClick={() => setCategoryModalOpen(true)}>
            <FolderPlus className="w-4 h-4 mr-2" />
            Categorías
          </Button>
          <Button onClick={() => setQuestionModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Pregunta
          </Button>
        </div>
      </div>

      {/* Filters and Content */}
      <div className="flex gap-4">
        {/* Categories Sidebar */}
        <div className="flex-none w-64">
          <div className="space-y-1">
            {categories.map(category => (
              <div
                key={category}
                className={`flex items-center gap-1 rounded-md ${
                  selectedCategory === category
                    ? 'bg-primary/10'
                    : ''
                }`}
              >
                <button
                  onClick={() => setSelectedCategory(category)}
                  className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedCategory === category
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Folder className="w-4 h-4" />
                  <span className="flex-1 text-left">{category}</span>
                  {category !== 'Todas' && (
                    <span className="text-xs">
                      {questions.filter(q => (q.category || 'Sin categoría') === category).length}
                    </span>
                  )}
                </button>
                {category !== 'Todas' && category !== 'Sin categoría' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleExportCategory(category)}
                    title="Exportar categoría a GIFT"
                  >
                    <FileDown className="w-3 h-3" />
                  </Button>
                )}
              </div>
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
                placeholder="Buscar por texto, categoría o tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Lista de preguntas */}
          {filteredQuestions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm || selectedCategory !== 'Todas' ? 'No se encontraron preguntas' : 'No hay preguntas en el banco'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm || selectedCategory !== 'Todas'
                    ? 'Intenta cambiar los filtros de búsqueda'
                    : 'Comienza creando preguntas para tu banco. Podrás reutilizarlas en múltiples exámenes.'}
                </p>
                {!searchTerm && selectedCategory === 'Todas' && (
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => setQuestionModalOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Primera Pregunta
                    </Button>
                    <Button variant="outline" onClick={() => setGiftModalOpen(true)}>
                      <Upload className="w-4 h-4 mr-2" />
                      Importar GIFT
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((question) => (
                <Card key={question.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-base font-medium">
                          {question.text}
                        </CardTitle>
                        <div className="mt-2 flex items-center gap-2 flex-wrap text-xs">
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">
                            {question.type === 'multiple' ? 'Selección Múltiple' :
                             question.type === 'boolean' ? 'V/F' : 'Desarrollo'}
                          </span>
                          <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                            {question.category}
                          </span>
                          {question.tags.length > 0 && (
                            <span className="text-muted-foreground">
                              {question.tags.map(tag => `#${tag}`).join(' ')}
                            </span>
                          )}
                          <span className="text-muted-foreground ml-auto">
                            Usada {question.statistics.timesUsed} {question.statistics.timesUsed === 1 ? 'vez' : 'veces'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(question)}
                          title="Editar pregunta"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(question.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Eliminar pregunta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {question.alternatives && question.alternatives.length > 0 && (
                    <CardContent>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {question.alternatives.map((alt, idx) => (
                          <div
                            key={alt.id}
                            className={`text-sm p-2 rounded text-left ${
                              alt.isCorrect
                                ? 'bg-green-50 text-green-900 border border-green-200'
                                : 'bg-gray-50 text-gray-700 border border-gray-200'
                            }`}
                          >
                            <span className="font-medium mr-2">
                              {String.fromCharCode(65 + idx)})
                            </span>
                            {alt.text}
                            {alt.isCorrect && <span className="ml-2">✓</span>}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <QuestionFormModal
        open={questionModalOpen}
        onClose={handleCloseModal}
        onComplete={handleCloseModal}
        folders={categories.filter(c => c !== 'Todas')}
        question={editingQuestion}
      />

      <ImportGiftModal
        open={giftModalOpen}
        onClose={() => setGiftModalOpen(false)}
        onComplete={() => setGiftModalOpen(false)}
      />

      <CategoryManagerModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        categories={categories.filter(c => c !== 'Todas' && c !== 'Sin categoría')}
        onUpdate={(newCategories) => {
          // Las categorías se actualizarán automáticamente cuando se creen/editen preguntas
          console.log('Categorías actualizadas:', newCategories);
        }}
        title="Gestionar Categorías de Preguntas"
      />
    </div>
  );
};

export default QuestionsPage;

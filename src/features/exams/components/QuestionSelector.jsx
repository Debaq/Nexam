import React, { useState, useMemo } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { useQuestions } from '@/features/questions/hooks/useQuestions';
import { Search, Filter, X, Plus, Trash2, ChevronRight, ChevronDown, Folder, FolderOpen, Hash } from 'lucide-react';

export const QuestionSelector = ({ selectedQuestions, onQuestionsChange, disabled = false }) => {
  const { questions } = useQuestions();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [viewMode, setViewMode] = useState('tree'); // 'tree' o 'list'

  // Obtener categorías y tags únicos directamente de las preguntas
  const categories = useMemo(() => {
    const cats = [...new Set(questions.map(q => q.category))];
    return cats.filter(Boolean).sort();
  }, [questions]);

  const tags = useMemo(() => {
    const allTags = questions.flatMap(q => q.tags || []);
    return [...new Set(allTags)].filter(Boolean).sort();
  }, [questions]);

  // Filtrar preguntas según criterios de búsqueda y filtros
  const filteredQuestions = useMemo(() => {
    return questions.filter(question => {
      // Filtrar por búsqueda de texto
      const matchesSearch = !searchTerm ||
        question.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      // Filtrar por categoría
      const matchesCategory = !selectedCategory || question.category === selectedCategory;

      // Filtrar por tipo
      const matchesType = !selectedType || question.type === selectedType;

      // Filtrar por dificultad
      const matchesDifficulty = !selectedDifficulty || question.difficulty?.manual === selectedDifficulty;

      return matchesSearch && matchesCategory && matchesType && matchesDifficulty;
    });
  }, [questions, searchTerm, selectedCategory, selectedType, selectedDifficulty]);

  // Organizar preguntas por categoría para vista en árbol
  const questionsByCategory = useMemo(() => {
    const grouped = {};
    filteredQuestions.forEach(question => {
      const category = question.category || 'Sin categoría';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(question);
    });
    return grouped;
  }, [filteredQuestions]);

  // Toggle expandir/contraer categoría
  const toggleCategory = (category) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Expandir todas las categorías
  const expandAll = () => {
    setExpandedCategories(new Set(Object.keys(questionsByCategory)));
  };

  // Contraer todas las categorías
  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  // Función para manejar la selección/deselección de una pregunta
  const handleQuestionToggle = (question) => {
    if (selectedQuestions.some(q => q.id === question.id)) {
      // Deseleccionar pregunta
      onQuestionsChange(selectedQuestions.filter(q => q.id !== question.id));
    } else {
      // Seleccionar pregunta
      onQuestionsChange([...selectedQuestions, question]);
    }
  };

  // Función para seleccionar todas las preguntas visibles
  const handleSelectAll = () => {
    const newSelectedQuestions = [...selectedQuestions];
    const visibleQuestionIds = filteredQuestions.map(q => q.id);
    
    // Añadir preguntas no seleccionadas
    const questionsToAdd = filteredQuestions.filter(q => 
      !selectedQuestions.some(sq => sq.id === q.id)
    );
    
    onQuestionsChange([...selectedQuestions, ...questionsToAdd]);
  };

  // Función para deseleccionar todas las preguntas visibles
  const handleDeselectAll = () => {
    const visibleQuestionIds = filteredQuestions.map(q => q.id);
    const newSelectedQuestions = selectedQuestions.filter(q => 
      !visibleQuestionIds.includes(q.id)
    );
    
    onQuestionsChange(newSelectedQuestions);
  };

  // Función para remover una pregunta ya seleccionada
  const removeSelectedQuestion = (questionId) => {
    onQuestionsChange(selectedQuestions.filter(q => q.id !== questionId));
  };

  // Función para mover una pregunta hacia arriba o abajo
  const moveQuestion = (index, direction) => {
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === selectedQuestions.length - 1)) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newQuestions = [...selectedQuestions];
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    
    onQuestionsChange(newQuestions);
  };

  // Formatear el tipo de pregunta para mostrar
  const getDisplayType = (type) => {
    switch (type) {
      case 'multiple': return 'Selección Múltiple';
      case 'boolean': return 'Verdadero/Falso';
      case 'development': return 'Desarrollo';
      case 'matching': return 'Items y Combinaciones';
      default: return type;
    }
  };

  return (
    <div className="space-y-4">
      {/* Panel de búsqueda y filtros */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar preguntas por texto o tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
              disabled={disabled}
            />
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            disabled={disabled}
          >
            <Filter className="w-4 h-4 mr-1" />
            Filtrar
          </Button>
        </div>

        {/* Panel de filtros avanzados */}
        {showFilters && (
          <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="category">Categoría</Label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border rounded-md mt-1"
                  disabled={disabled}
                >
                  <option value="">Todas las categorías</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="type">Tipo de Pregunta</Label>
                <select
                  id="type"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full p-2 border rounded-md mt-1"
                  disabled={disabled}
                >
                  <option value="">Todos los tipos</option>
                  <option value="multiple">Selección Múltiple</option>
                  <option value="boolean">Verdadero/Falso</option>
                  <option value="development">Desarrollo</option>
                  <option value="matching">Items y Combinaciones</option>
                </select>
              </div>

              <div>
                <Label htmlFor="difficulty">Dificultad</Label>
                <select
                  id="difficulty"
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full p-2 border rounded-md mt-1"
                  disabled={disabled}
                >
                  <option value="">Todas las dificultades</option>
                  <option value="easy">Fácil</option>
                  <option value="medium">Media</option>
                  <option value="hard">Difícil</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedType('');
                  setSelectedDifficulty('');
                }}
                disabled={disabled}
              >
                <X className="w-4 h-4 mr-1" />
                Limpiar filtros
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Panel de acciones */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            {filteredQuestions.length} pregunta(s) encontradas
          </div>
          <div className="flex gap-1 border rounded-md">
            <Button
              variant={viewMode === 'tree' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('tree')}
              disabled={disabled}
              className="rounded-r-none"
            >
              <Folder className="w-4 h-4 mr-1" />
              Árbol
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              disabled={disabled}
              className="rounded-l-none"
            >
              <Hash className="w-4 h-4 mr-1" />
              Lista
            </Button>
          </div>
          {viewMode === 'tree' && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={expandAll}
                disabled={disabled}
              >
                Expandir todo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={collapseAll}
                disabled={disabled}
              >
                Contraer todo
              </Button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={disabled || filteredQuestions.length === 0}
          >
            <Plus className="w-4 h-4 mr-1" />
            Seleccionar Todas
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeselectAll}
            disabled={disabled || filteredQuestions.length === 0}
          >
            Deseleccionar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de preguntas disponibles */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3 flex items-center">
            <span>Preguntas Disponibles</span>
            <span className="ml-2 text-xs bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full">
              {filteredQuestions.length}
            </span>
          </h3>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {filteredQuestions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No se encontraron preguntas que coincidan con los filtros
              </p>
            ) : viewMode === 'tree' ? (
              // Vista en árbol por categorías
              <div className="space-y-2">
                {Object.entries(questionsByCategory).map(([category, categoryQuestions]) => (
                  <div key={category} className="border rounded-md">
                    {/* Header de categoría */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 transition-colors"
                      disabled={disabled}
                    >
                      {expandedCategories.has(category) ? (
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      )}
                      {expandedCategories.has(category) ? (
                        <FolderOpen className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Folder className="w-4 h-4 text-gray-500" />
                      )}
                      <span className="text-sm font-medium flex-1 text-left">{category}</span>
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                        {categoryQuestions.length}
                      </span>
                    </button>

                    {/* Preguntas de la categoría */}
                    {expandedCategories.has(category) && (
                      <div className="border-t bg-gray-50/50">
                        {categoryQuestions.map((question, idx) => (
                          <div
                            key={question.id}
                            className={`p-3 ${idx > 0 ? 'border-t' : ''} ${
                              selectedQuestions.some(q => q.id === question.id)
                                ? 'bg-primary/5'
                                : 'hover:bg-white'
                            } transition-colors`}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox
                                id={`question-${question.id}`}
                                checked={selectedQuestions.some(q => q.id === question.id)}
                                onCheckedChange={() => handleQuestionToggle(question)}
                                disabled={disabled}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 rounded">
                                    {getDisplayType(question.type)}
                                  </span>
                                  {question.difficulty?.manual && (
                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                      question.difficulty.manual === 'easy' ? 'bg-green-100 text-green-700' :
                                      question.difficulty.manual === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-red-100 text-red-700'
                                    }`}>
                                      {question.difficulty.manual === 'easy' ? 'Fácil' :
                                       question.difficulty.manual === 'medium' ? 'Media' : 'Difícil'}
                                    </span>
                                  )}
                                </div>
                                <label
                                  htmlFor={`question-${question.id}`}
                                  className="text-sm block mt-1 cursor-pointer"
                                  style={{ wordBreak: "break-word" }}
                                >
                                  {question.text.length > 80
                                    ? question.text.substring(0, 80) + '...'
                                    : question.text}
                                </label>
                                {question.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {question.tags.slice(0, 3).map(tag => (
                                      <span
                                        key={tag}
                                        className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                    {question.tags.length > 3 && (
                                      <span className="text-xs text-muted-foreground">
                                        +{question.tags.length - 3}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // Vista en lista plana
              filteredQuestions.map(question => (
                <div
                  key={question.id}
                  className={`p-3 border rounded-md transition-colors ${
                    selectedQuestions.some(q => q.id === question.id)
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Checkbox
                        id={`question-${question.id}`}
                        checked={selectedQuestions.some(q => q.id === question.id)}
                        onCheckedChange={() => handleQuestionToggle(question)}
                        disabled={disabled}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 rounded">
                            {getDisplayType(question.type)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {question.category}
                          </span>
                          {question.difficulty?.manual && (
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              question.difficulty.manual === 'easy' ? 'bg-green-100 text-green-700' :
                              question.difficulty.manual === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {question.difficulty.manual === 'easy' ? 'Fácil' :
                               question.difficulty.manual === 'medium' ? 'Media' : 'Difícil'}
                            </span>
                          )}
                        </div>
                        <label
                          htmlFor={`question-${question.id}`}
                          className="text-sm block mt-1 cursor-pointer"
                          style={{ wordBreak: "break-word" }}
                        >
                          {question.text.length > 100
                            ? question.text.substring(0, 100) + '...'
                            : question.text}
                        </label>
                        {question.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {question.tags.slice(0, 3).map(tag => (
                              <span
                                key={tag}
                                className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                            {question.tags.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{question.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel de preguntas seleccionadas */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3 flex items-center">
            <span>Preguntas Seleccionadas</span>
            <span className="ml-2 text-xs bg-primary text-primary-foreground py-0.5 px-2 rounded-full">
              {selectedQuestions.length}
            </span>
          </h3>
          
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {selectedQuestions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay preguntas seleccionadas
              </p>
            ) : (
              selectedQuestions.map((question, index) => (
                <div 
                  key={question.id} 
                  className="p-3 border rounded-md bg-primary/5 flex items-start gap-3"
                >
                  <div className="text-xs font-medium text-primary mt-1">
                    {index + 1}.
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium px-2 py-0.5 bg-primary text-primary-foreground rounded">
                        {getDisplayType(question.type)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {question.category}
                      </span>
                    </div>
                    <div className="text-sm mb-2" style={{ wordBreak: "break-word" }}>
                      {question.text.length > 80 
                        ? question.text.substring(0, 80) + '...' 
                        : question.text}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {question.tags.slice(0, 3).map(tag => (
                        <span 
                          key={tag} 
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {question.tags.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{question.tags.length - 3}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {index > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveQuestion(index, 'up')}
                          disabled={disabled}
                        >
                          ↑
                        </Button>
                      )}
                      {index < selectedQuestions.length - 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveQuestion(index, 'down')}
                          disabled={disabled}
                        >
                          ↓
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeSelectedQuestion(question.id)}
                        disabled={disabled}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionSelector;
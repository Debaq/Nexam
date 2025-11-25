import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Plus, BookOpen, Calendar, FolderOpen, Settings, TrendingUp } from 'lucide-react';
import { useSections, useUniqueYears } from '../hooks/useSections';
import { sectionsService } from '../services/sectionsService';
import { SectionFormModal } from './SectionFormModal';
import { SectionDetailModal } from './SectionDetailModal';

export const SectionsPage = () => {
  const { sections, loading } = useSections();
  const { years } = useUniqueYears();
  const [selectedYear, setSelectedYear] = useState('all');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [editingSection, setEditingSection] = useState(null);

  // Filtrar secciones por año
  const filteredSections = selectedYear === 'all'
    ? sections
    : sections.filter(s => s.year === parseInt(selectedYear));

  const handleCreateSection = () => {
    setEditingSection(null);
    setIsFormModalOpen(true);
  };

  const handleEditSection = (section) => {
    setEditingSection(section);
    setIsFormModalOpen(true);
    setIsDetailModalOpen(false);
  };

  const handleViewDetails = (section) => {
    setSelectedSection(section);
    setIsDetailModalOpen(true);
  };

  const handleDeleteSection = async (section) => {
    const confirmDelete = window.confirm(
      `¿Estás seguro de que deseas eliminar la sección "${section.name}"?\n\n` +
      'Esta acción no se puede deshacer y solo es posible si no hay exámenes o preguntas asociadas.'
    );

    if (!confirmDelete) return;

    try {
      await sectionsService.delete(section.id);
      setIsDetailModalOpen(false);
    } catch (error) {
      alert(error.message);
    }
  };

  const getSemesterLabel = (semester) => {
    switch (semester) {
      case '1': return '1er Semestre';
      case '2': return '2do Semestre';
      case 'annual': return 'Anual';
      default: return semester;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Cargando secciones...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Secciones y Asignaturas</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tus cursos, unidades de aprendizaje y evaluaciones
          </p>
        </div>
        <Button onClick={handleCreateSection} className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva Sección
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <Button
          variant={selectedYear === 'all' ? 'default' : 'outline'}
          onClick={() => setSelectedYear('all')}
          size="sm"
        >
          Todos los años
        </Button>
        {years.map(year => (
          <Button
            key={year}
            variant={selectedYear === year.toString() ? 'default' : 'outline'}
            onClick={() => setSelectedYear(year.toString())}
            size="sm"
          >
            {year}
          </Button>
        ))}
      </div>

      {/* Empty State */}
      {filteredSections.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {selectedYear === 'all'
                  ? 'No hay secciones creadas'
                  : `No hay secciones para el año ${selectedYear}`
                }
              </h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primera sección para comenzar a organizar tus cursos
              </p>
              <Button onClick={handleCreateSection} className="gap-2">
                <Plus className="w-4 h-4" />
                Crear Primera Sección
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sections Grid */}
      {filteredSections.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSections.map(section => (
            <SectionCard
              key={section.id}
              section={section}
              onView={() => handleViewDetails(section)}
              onEdit={() => handleEditSection(section)}
              getSemesterLabel={getSemesterLabel}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <SectionFormModal
        open={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingSection(null);
        }}
        section={editingSection}
      />

      {selectedSection && (
        <SectionDetailModal
          open={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedSection(null);
          }}
          section={selectedSection}
          onEdit={() => handleEditSection(selectedSection)}
          onDelete={() => handleDeleteSection(selectedSection)}
          getSemesterLabel={getSemesterLabel}
        />
      )}
    </div>
  );
};

// Component for individual section card
const SectionCard = ({ section, onView, onEdit, getSemesterLabel }) => {
  const [stats, setStats] = useState(null);

  React.useEffect(() => {
    const loadStats = async () => {
      const sectionStats = await sectionsService.getStatistics(section.id);
      setStats(sectionStats);
    };
    loadStats();
  }, [section.id]);

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onView}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">{section.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{section.code}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Año y Semestre */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{section.year}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span>{getSemesterLabel(section.semester)}</span>
            </div>
          </div>

          {/* Folder */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <FolderOpen className="w-4 h-4" />
            <span className="truncate">{section.folder}</span>
          </div>

          {/* Estadísticas */}
          {stats && (
            <div className="grid grid-cols-2 gap-2 pt-3 border-t">
              <div className="text-center p-2 bg-muted rounded">
                <div className="text-2xl font-bold text-primary">{stats.examsCount}</div>
                <div className="text-xs text-muted-foreground">Exámenes</div>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <div className="text-2xl font-bold text-primary">{stats.questionsCount}</div>
                <div className="text-xs text-muted-foreground">Preguntas</div>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <div className="text-2xl font-bold text-primary">{stats.unitsCount}</div>
                <div className="text-xs text-muted-foreground">Unidades</div>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <div className="text-2xl font-bold text-primary">{stats.assessmentsCount}</div>
                <div className="text-xs text-muted-foreground">Evaluaciones</div>
              </div>
            </div>
          )}

          {/* Progress bar de ponderación */}
          {stats && stats.totalWeighting > 0 && (
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Ponderación total</span>
                <span className="font-medium">{stats.totalWeighting}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    stats.totalWeighting === 100
                      ? 'bg-green-500'
                      : stats.totalWeighting > 100
                      ? 'bg-red-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(stats.totalWeighting, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SectionsPage;

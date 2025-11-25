import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/storage/db';
import { sectionsService } from '../services/sectionsService';
import { studentSectionsService } from '../services/studentSectionsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Plus, Search, Folder, Calendar, Users, BookOpen, MoreVertical } from 'lucide-react';

export const SectionsPage = () => {
  const sections = useLiveQuery(() => db.sections.toArray(), []);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSections = sections?.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.folder?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleCreateNew = async () => {
    // Abrir modal para crear sección
    const name = prompt('Nombre de la sección:');
    if (!name) return;

    const code = prompt('Código de la sección (opcional):');
    const year = prompt('Año (ej: 2024):') || new Date().getFullYear().toString();
    const folder = prompt('Carpeta/Categoría (opcional):');

    try {
      await sectionsService.create({
        name,
        code: code || undefined,
        year: parseInt(year),
        folder: folder || 'Sin carpeta'
      });
    } catch (error) {
      alert('Error al crear sección: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar esta sección? Esta acción también eliminará todas las inscripciones relacionadas.')) {
      await sectionsService.delete(id);
    }
  };

  if (!sections) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Cargando secciones...</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Secciones y Asignaturas</h1>
          <p className="text-muted-foreground mt-1">
            {sections.length} {sections.length === 1 ? 'sección' : 'secciones'} registradas
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Sección
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, código o carpeta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Lista de secciones */}
      {filteredSections.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'No se encontraron secciones' : 'No hay secciones registradas'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm
                ? 'Intenta con otros términos de búsqueda'
                : 'Comienza creando secciones para organizar tus estudiantes y evaluaciones.'
              }
            </p>
            {!searchTerm && (
              <Button onClick={handleCreateNew}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Sección
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSections.map((section) => (
            <Card key={section.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg pr-8">
                      {section.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                      <Calendar className="w-3 h-3" />
                      {section.year}
                    </div>
                    {section.folder && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Folder className="w-3 h-3" />
                        {section.folder}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Menú contextual para acciones
                        const action = prompt('Acciones disponibles:\n1. Editar\n2. Eliminar\n\nElija una opción (1-2):');
                        if (action === '2') {
                          handleDelete(section.id);
                        } else if (action === '1') {
                          // Editar sección
                          const newName = prompt('Nombre de la sección:', section.name);
                          if (newName) {
                            const newCode = prompt('Código de la sección:', section.code || '');
                            const newYear = prompt('Año:', section.year.toString());
                            const newFolder = prompt('Carpeta/Categoría:', section.folder || '');
                            
                            sectionsService.update(section.id, {
                              name: newName,
                              code: newCode || undefined,
                              year: parseInt(newYear),
                              folder: newFolder
                            });
                          }
                        }
                      }}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Código:</span>
                    <span className="font-medium">{section.code || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Estudiantes:</span>
                    <span className="font-medium">TODO</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Evaluaciones:</span>
                    <span className="font-medium">TODO</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SectionsPage;
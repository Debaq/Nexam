import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Plus, Trash2, FolderPlus } from 'lucide-react';

export const CategoryManagerModal = ({ open, onClose, categories = [], onUpdate, title = "Gestionar Categorías" }) => {
  const [newCategory, setNewCategory] = useState('');
  const [localCategories, setLocalCategories] = useState(categories);

  const handleAdd = () => {
    if (newCategory.trim() && !localCategories.includes(newCategory.trim())) {
      const updated = [...localCategories, newCategory.trim()].sort();
      setLocalCategories(updated);
      setNewCategory('');
    }
  };

  const handleRemove = (category) => {
    if (confirm(`¿Eliminar la categoría "${category}"?`)) {
      const updated = localCategories.filter(c => c !== category);
      setLocalCategories(updated);
    }
  };

  const handleSave = () => {
    onUpdate?.(localCategories);
    handleClose();
  };

  const handleClose = () => {
    setLocalCategories(categories);
    setNewCategory('');
    onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Crea, edita o elimina categorías para organizar tu contenido.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new category */}
          <div>
            <Label htmlFor="new-category">Nueva Categoría</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="new-category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Nombre de la categoría"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
              />
              <Button type="button" onClick={handleAdd} disabled={!newCategory.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* List of categories */}
          <div>
            <Label>Categorías Existentes</Label>
            {localCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay categorías creadas
              </p>
            ) : (
              <div className="mt-2 max-h-[300px] overflow-y-auto space-y-1">
                {localCategories.map(category => (
                  <div
                    key={category}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted"
                  >
                    <span className="text-sm">{category}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(category)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Guardar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

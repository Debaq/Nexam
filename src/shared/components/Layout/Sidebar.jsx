import React from 'react';
import { FileText, ClipboardList, Users, ScanLine, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

const navItems = [
  {
    name: 'Exámenes',
    icon: FileText,
    path: 'exams',
    description: 'Crear y gestionar evaluaciones'
  },
  {
    name: 'Banco de Preguntas',
    icon: ClipboardList,
    path: 'questions',
    description: 'Gestionar preguntas'
  },
  {
    name: 'Estudiantes',
    icon: Users,
    path: 'students',
    description: 'Gestionar nómina'
  },
  {
    name: 'Corrección',
    icon: ScanLine,
    path: 'correction',
    description: 'Corregir evaluaciones'
  },
  {
    name: 'Reportes',
    icon: BarChart3,
    path: 'reports',
    description: 'Análisis y estadísticas'
  }
];

export const Sidebar = ({ currentPath, onNavigate }) => {
  return (
    <aside className="w-64 bg-card border-r min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-primary">Nexam</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Sistema de Evaluación
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;

            return (
              <li key={item.path}>
                <button
                  onClick={() => onNavigate(item.path)}
                  className={cn(
                    'w-full flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors text-left',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent text-foreground'
                  )}
                >
                  <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{item.name}</div>
                    <div
                      className={cn(
                        'text-xs mt-0.5',
                        isActive
                          ? 'text-primary-foreground/80'
                          : 'text-muted-foreground'
                      )}
                    >
                      {item.description}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <button
          onClick={() => onNavigate('settings')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm">Configuración</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

import React, { useState } from 'react';
import { FileText, ClipboardList, Users, ScanLine, BarChart3, Settings, Menu, Calculator, BookOpen } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

const navItems = [
  {
    name: 'Secciones',
    icon: BookOpen,
    path: 'sections',
    description: 'Gestionar asignaturas y cursos'
  },
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
    name: 'Reportes',
    icon: BarChart3,
    path: 'reports',
    description: 'Análisis y estadísticas'
  },
  {
    name: 'Generador de Escalas',
    icon: Calculator,
    path: 'grade-scale',
    description: 'Calcular escalas de notas'
  }
];

export const Sidebar = ({ currentPath, onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {/* Botón de menú para móviles */}
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-primary text-primary-foreground md:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "w-64 bg-card border-r h-screen flex flex-col fixed z-40 transform transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0 md:fixed md:z-40"
        )}
      >
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-primary">Nexam</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Sistema de Evaluación
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;

              return (
                <li key={item.path}>
                  <button
                    onClick={() => {
                      onNavigate(item.path);
                      setSidebarOpen(false); // Cerrar sidebar en móvil al seleccionar
                    }}
                    className={cn(
                      'w-full flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors text-left',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent text-foreground'
                    )}
                  >
                    <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{item.name}</span>
                        {item.badge && (
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-md font-semibold",
                            isActive
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-primary/10 text-primary"
                          )}>
                            {item.badge}
                          </span>
                        )}
                      </div>
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
        <div className="p-4 border-t mt-auto">
          <button
            onClick={() => {
              onNavigate('settings');
              setSidebarOpen(false); // Cerrar sidebar en móvil al seleccionar
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm">Configuración</span>
          </button>
        </div>
      </aside>

      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
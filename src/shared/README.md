# Shared

Componentes y utilidades compartidas entre features.

## Estructura

### components/
Componentes React reutilizables:
- Botones, inputs, modales
- Layouts comunes
- Componentes de shadcn/ui

### hooks/
Custom hooks compartidos:
- useDatabase
- useDebounce
- useLocalStorage
- etc.

### utils/
Funciones de utilidad:
- Formateo de fechas
- Validaciones
- Helpers generales

## Principio

Solo agregar aquí componentes/hooks/utils que sean **realmente compartidos** entre múltiples features. Si solo lo usa un feature, debe ir en ese feature.

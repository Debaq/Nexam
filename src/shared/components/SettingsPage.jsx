import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Switch } from '@/shared/components/ui/switch';
import { AlertTriangle, Download, Monitor, Moon, Sun, Palette, Languages, Smartphone, Brain } from 'lucide-react';
import { BackupManager } from '@/core/backup/BackupManager';
import { useTheme } from '@/core/theme/ThemeProvider';
import yoloService from '@/core/vision/yoloService';

// Hook para detectar si la app está instalada como PWA
const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);

  useEffect(() => {
    // Verificar si ya está instalada como PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        window.navigator.standalone === true;
    setIsPWAInstalled(isStandalone);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsPWAInstalled(true);
    }

    setDeferredPrompt(null);
  };

  return { isPWAInstalled, installPWA, canInstall: !!deferredPrompt };
};

export const SettingsPage = () => {
  const [language, setLanguage] = useState('es');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const { isPWAInstalled, installPWA, canInstall } = usePWAInstall();
  const { theme, setTheme, darkMode, setDarkMode } = useTheme();

  // Temas disponibles
  const themes = [
    { value: 'violet', label: 'Violeta (Predeterminado)' },
    { value: 'blue', label: 'Azul' },
    { value: 'zinc', label: 'Zinc' },
    { value: 'neutral', label: 'Neutral' },
    { value: 'stone', label: 'Stone' },
    { value: 'red', label: 'Rojo' },
    { value: 'green', label: 'Verde' },
    { value: 'orange', label: 'Naranja' }
  ];

  // Opciones de modo oscuro
  const darkModeOptions = [
    { value: 'system', label: 'Seguir sistema' },
    { value: 'light', label: 'Claro' },
    { value: 'dark', label: 'Oscuro' }
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground mt-1">
          Personaliza la aplicación según tus preferencias
        </p>
      </div>

      {/* Instalación PWA */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Instalar Aplicación</CardTitle>
              <CardDescription>
                Instala Nexam en tu dispositivo para acceso rápido y sin conexión
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {isPWAInstalled ? 'Aplicación instalada' : canInstall ? 'Disponible para instalación' : 'Instalable en la mayoría de navegadores modernos'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isPWAInstalled 
                  ? 'Nexam está instalado en tu dispositivo' 
                  : 'Accede a la aplicación con acceso directo desde tu pantalla de inicio'}
              </p>
            </div>
            <Button 
              onClick={installPWA} 
              disabled={isPWAInstalled || !canInstall}
              variant={isPWAInstalled ? "secondary" : "default"}
            >
              {isPWAInstalled ? 'Instalado ✓' : canInstall ? 'Instalar' : 'No disponible'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tema */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Tema Visual</CardTitle>
              <CardDescription>
                Elige el color principal de la interfaz
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="theme">Tema de color</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger id="theme" className="w-full max-w-xs">
                  <SelectValue placeholder="Selecciona un tema" />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {themes.slice(0, 4).map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    theme === t.value ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-4 h-4 rounded-full bg-${t.value}-500 border border-border`}
                      style={{ backgroundColor: `var(--${t.value}-500, #8b5cf6)` }}
                    ></div>
                    <span className="text-xs">{t.label.split(' ')[0]}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modo oscuro */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Monitor className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Modo Visual</CardTitle>
              <CardDescription>
                Elige entre tema claro u oscuro
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="dark-mode">Preferencia de modo</Label>
              <Select value={darkMode} onValueChange={setDarkMode}>
                <SelectTrigger id="dark-mode" className="w-full max-w-xs">
                  <SelectValue placeholder="Selecciona un modo" />
                </SelectTrigger>
                <SelectContent>
                  {darkModeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4" />
                <span className="text-sm">Claro</span>
              </div>
              <div className="flex-1 h-2 bg-gradient-to-r from-yellow-200 via-gray-200 to-blue-900 rounded-full"></div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Oscuro</span>
                <Moon className="w-4 h-4" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Idioma */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Languages className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Idioma</CardTitle>
              <CardDescription>
                Configura el idioma de la interfaz
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Idioma de la aplicación</Label>
            <Select value={language} onValueChange={setLanguage} disabled>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Selecciona un idioma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              Por ahora solo está disponible el idioma español. Más idiomas vendrán en futuras actualizaciones.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Autoguardado */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Autoguardado</CardTitle>
              <CardDescription>
                Configura las opciones de guardado automático
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-save" className="text-sm font-medium">
                Activar autoguardado
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Guarda automáticamente tus cambios en preguntas y exámenes
              </p>
            </div>
            <Switch 
              id="auto-save" 
              checked={autoSave} 
              onCheckedChange={setAutoSave}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notificaciones */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Notificaciones</CardTitle>
              <CardDescription>
                Gestiona las notificaciones de la aplicación
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notifications" className="text-sm font-medium">
                Notificaciones push
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Recibe notificaciones sobre backups, actualizaciones y recordatorios
              </p>
            </div>
            <Switch 
              id="notifications" 
              checked={notificationsEnabled} 
              onCheckedChange={setNotificationsEnabled}
              disabled 
            />
          </div>
        </CardContent>
      </Card>

      {/* Backup automático */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Backup Automático</CardTitle>
              <CardDescription>
                Configura las opciones de backup automático
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-backup" className="text-sm font-medium">
                  Activar backup automático
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Realiza backup cada vez que se guardan datos importantes
                </p>
              </div>
              <Switch 
                id="auto-backup" 
                checked={autoBackup} 
                onCheckedChange={setAutoBackup}
              />
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-800">Recordatorio Importante</p>
                  <p className="text-sm text-blue-700">
                    Aunque puedes habilitar backups automáticos, actualmente se recomienda hacer backups 
                    manuales regularmente, especialmente antes de realizar cambios importantes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información de backup */}
      <BackupManager />

      {/* Funcionalidades futuras */}
      <Card>
        <CardHeader>
          <CardTitle>Funcionalidades Futuras</CardTitle>
          <CardDescription>
            Características que se implementarán en próximas versiones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
              <span>Múltiples idiomas (Inglés, Portugués)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
              <span>Notificaciones push personalizadas</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
              <span>Sincronización en línea</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
              <span>Accesibilidad avanzada</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
              <span>Configuración de privacidad</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
              <span>Modo de alto contraste</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
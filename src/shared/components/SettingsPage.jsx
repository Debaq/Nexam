import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Switch } from '@/shared/components/ui/switch';
import { AlertTriangle, Download, Monitor, Moon, Sun, Palette, Languages, Smartphone, Brain, Settings } from 'lucide-react';
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
  const [yoloModelURL, setYoloModelURL] = useState(() => {
    // Cargar la URL guardada o usar la predeterminada
    return localStorage.getItem('nexam_yolo_model_url') || '/models/nexam_v1.onnx';
  });
  const [yoloModelURLInput, setYoloModelURLInput] = useState(() => {
    // Cargar la URL guardada o usar la predeterminada
    return localStorage.getItem('nexam_yolo_model_url') || '/models/nexam_v1.onnx';
  });
  const [yoloModelStatus, setYoloModelStatus] = useState('unknown');
  const [yoloModelMessage, setYoloModelMessage] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [cacheInfo, setCacheInfo] = useState({ cached: false });

  const { isPWAInstalled, installPWA, canInstall } = usePWAInstall();
  const { theme, setTheme, darkMode, setDarkMode } = useTheme();

  // Cargar información de caché al montar
  useEffect(() => {
    const loadCacheInfo = async () => {
      const info = await yoloService.getCacheInfo();
      setCacheInfo(info);
    };
    loadCacheInfo();
  }, []);

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

  // Función para guardar la URL del modelo YOLO
  const handleSaveYoloModelURL = () => {
    // Validar que la URL sea válida
    try {
      new URL(yoloModelURLInput);
      localStorage.setItem('nexam_yolo_model_url', yoloModelURLInput);
      setYoloModelURL(yoloModelURLInput);
      setYoloModelMessage('URL del modelo actualizada correctamente');
      setYoloModelStatus('success');
    } catch (error) {
      setYoloModelMessage('URL inválida. Por favor ingrese una URL válida (debe incluir protocolo, como http:// o https://)');
      setYoloModelStatus('error');
    }
  };

  // Función para verificar si el modelo está disponible
  const handleCheckModel = async () => {
    setIsChecking(true);
    setYoloModelMessage('Verificando disponibilidad del modelo...');

    try {
      // Usar el servicio YOLO directamente para verificar la disponibilidad
      // Temporalmente cambiar la URL para la verificación
      const originalURL = yoloService.modelConfig && yoloService.modelConfig.modelURL ? yoloService.modelConfig.modelURL : null;

      // Verificar disponibilidad usando el método del servicio YOLO
      try {
        // Verificar si podemos cambiar la URL temporalmente
        if (yoloService.setModelURL && typeof yoloService.setModelURL === 'function') {
          // Guardar la URL original antes de cambiarla
          const currentURL = yoloService.modelConfig && yoloService.modelConfig.modelURL ? yoloService.modelConfig.modelURL : null;

          // Intentar cambiar la URL temporalmente
          const canSetURL = yoloService.setModelURL(yoloModelURLInput);

          if (canSetURL) {
            // Si se pudo cambiar la URL, verificar disponibilidad
            const isAvailable = await yoloService.checkModelAvailability();

            if (isAvailable) {
              setYoloModelStatus('success');
              setYoloModelMessage('Modelo disponible y accesible');
            } else {
              setYoloModelStatus('error');
              setYoloModelMessage('Modelo no disponible');
            }

            // Restaurar la URL original
            if (currentURL) {
              yoloService.setModelURL(currentURL);
            }
          } else {
            // Si no se puede cambiar la URL directamente, intentar verificar con fetch
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

            try {
              const response = await fetch(yoloModelURLInput, {
                method: 'HEAD',
                mode: 'cors',
                signal: controller.signal
              });

              if (response.ok) {
                setYoloModelStatus('success');
                setYoloModelMessage('Modelo disponible (verificación básica exitosa)');
              } else {
                setYoloModelStatus('error');
                setYoloModelMessage(`Modelo no accesible (HTTP ${response.status})`);
              }
            } catch (fetchError) {
              if (fetchError.name === 'AbortError') {
                setYoloModelStatus('error');
                setYoloModelMessage('Tiempo de espera agotado verificando modelo');
              } else {
                // Si es un error de CORS, informar que puede ser normal
                setYoloModelStatus('info');
                setYoloModelMessage('La disponibilidad no se puede verificar completamente por restricciones CORS, pero la URL parece válida. El modelo se verificará al inicializar el servicio.');
              }
            } finally {
              clearTimeout(timeoutId);
            }
          }
        } else {
          // Si no existe la función setModelURL, usar fetch directamente
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

          try {
            const response = await fetch(yoloModelURLInput, {
              method: 'HEAD',
              mode: 'cors',
              signal: controller.signal
            });

            if (response.ok) {
              setYoloModelStatus('success');
              setYoloModelMessage('Modelo disponible (verificación básica exitosa)');
            } else {
              setYoloModelStatus('error');
              setYoloModelMessage(`Modelo no accesible (HTTP ${response.status})`);
            }
          } catch (fetchError) {
            if (fetchError.name === 'AbortError') {
              setYoloModelStatus('error');
              setYoloModelMessage('Tiempo de espera agotado verificando modelo');
            } else {
              // Si es un error de CORS, informar que puede ser normal
              setYoloModelStatus('info');
              setYoloModelMessage('La disponibilidad no se puede verificar completamente por restricciones CORS, pero la URL parece válida. El modelo se verificará al inicializar el servicio.');
            }
          } finally {
            clearTimeout(timeoutId);
          }
        }
      } catch (serviceError) {
        // Si hay un error con el servicio YOLO, intentar con fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

        try {
          const response = await fetch(yoloModelURLInput, {
            method: 'HEAD',
            mode: 'cors',
            signal: controller.signal
          });

          if (response.ok) {
            setYoloModelStatus('success');
            setYoloModelMessage('Modelo disponible (verificación básica exitosa)');
          } else {
            setYoloModelStatus('error');
            setYoloModelMessage(`Modelo no accesible (HTTP ${response.status})`);
          }
        } catch (fetchError) {
          if (fetchError.name === 'AbortError') {
            setYoloModelStatus('error');
            setYoloModelMessage('Tiempo de espera agotado verificando modelo');
          } else {
            // Si es un error de CORS, informar que puede ser normal
            setYoloModelStatus('info');
            setYoloModelMessage('La disponibilidad no se puede verificar completamente por restricciones CORS, pero la URL parece válida. El modelo se verificará al inicializar el servicio.');
          }
        } finally {
          clearTimeout(timeoutId);
        }
      }
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setYoloModelStatus('info');
        setYoloModelMessage('La disponibilidad no se puede verificar completamente por restricciones CORS, pero la URL parece válida. El modelo se verificará al inicializar el servicio.');
      } else {
        setYoloModelStatus('error');
        setYoloModelMessage(`Error verificando modelo: ${error.message}`);
      }
    } finally {
      setIsChecking(false);
    }
  };

  // Función para restaurar la URL predeterminada
  const handleResetToDefault = () => {
    const defaultURL = '/models/nexam_v1.onnx';
    setYoloModelURLInput(defaultURL);
    localStorage.setItem('nexam_yolo_model_url', defaultURL);
    setYoloModelURL(defaultURL);
    setYoloModelMessage('URL restablecida al valor predeterminado');
    setYoloModelStatus('info');
  };

  // Función para descargar y almacenar el modelo
  const handleDownloadAndCache = async () => {
    setIsDownloading(true);
    setDownloadProgress(0);
    setYoloModelMessage('Descargando modelo...');
    setYoloModelStatus('info');

    try {
      // Actualizar URL si cambió
      if (yoloModelURLInput !== yoloModelURL) {
        localStorage.setItem('nexam_yolo_model_url', yoloModelURLInput);
        setYoloModelURL(yoloModelURLInput);
        // Actualizar la URL en el servicio
        yoloService.modelConfig.modelURL = yoloModelURLInput;
      }

      // Descargar y cachear con progreso
      const result = await yoloService.downloadAndCache((progress) => {
        setDownloadProgress(progress);
        setYoloModelMessage(`Descargando modelo... ${Math.round(progress)}%`);
      });

      if (result.success) {
        setYoloModelStatus('success');
        setYoloModelMessage(`Modelo descargado y almacenado exitosamente (${result.sizeFormatted})`);

        // Actualizar información de caché
        const info = await yoloService.getCacheInfo();
        setCacheInfo(info);
      } else {
        setYoloModelStatus('error');
        setYoloModelMessage(`Error al descargar modelo: ${result.error}`);
      }
    } catch (error) {
      setYoloModelStatus('error');
      setYoloModelMessage(`Error al descargar modelo: ${error.message}`);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  // Función para eliminar el modelo de la caché
  const handleClearCache = async () => {
    try {
      setYoloModelMessage('Eliminando modelo de la caché...');
      setYoloModelStatus('info');

      const success = await yoloService.clearModelCache();

      if (success) {
        setYoloModelStatus('success');
        setYoloModelMessage('Modelo eliminado de la caché exitosamente');

        // Actualizar información de caché
        setCacheInfo({ cached: false });
      } else {
        setYoloModelStatus('error');
        setYoloModelMessage('Error al eliminar modelo de la caché');
      }
    } catch (error) {
      setYoloModelStatus('error');
      setYoloModelMessage(`Error al eliminar modelo: ${error.message}`);
    }
  };

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

      {/* Configuración del modelo YOLO */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Modelo de IA</CardTitle>
              <CardDescription>
                Configura la URL del modelo YOLO para detección de marcas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="yolo-model-url">URL del modelo YOLO</Label>
              <div className="flex gap-2">
                <input
                  id="yolo-model-url"
                  type="url"
                  value={yoloModelURLInput}
                  onChange={(e) => setYoloModelURLInput(e.target.value)}
                  placeholder="/models/nexam_v1.onnx"
                  className="flex-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <Button
                  onClick={handleSaveYoloModelURL}
                  disabled={yoloModelURLInput === yoloModelURL}
                >
                  Guardar
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleCheckModel}
                variant="outline"
                disabled={isChecking || isDownloading}
              >
                {isChecking ? 'Verificando...' : 'Verificar modelo'}
              </Button>
              <Button
                onClick={handleResetToDefault}
                variant="secondary"
                disabled={isDownloading}
              >
                Valor predeterminado
              </Button>
              <Button
                onClick={handleDownloadAndCache}
                variant="default"
                disabled={isDownloading || isChecking}
                className="col-span-2"
              >
                {isDownloading ? `Descargando... ${Math.round(downloadProgress)}%` : 'Descargar y almacenar'}
              </Button>
              {cacheInfo.cached && (
                <Button
                  onClick={handleClearCache}
                  variant="destructive"
                  disabled={isDownloading || isChecking}
                  className="col-span-2"
                >
                  Eliminar de caché
                </Button>
              )}
            </div>

            {yoloModelMessage && (
              <div className={`p-3 rounded-md ${
                yoloModelStatus === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
                yoloModelStatus === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
                yoloModelStatus === 'info' ? 'bg-blue-50 border border-blue-200 text-blue-800' :
                'bg-gray-50 border border-gray-200 text-gray-800'
              }`}>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5">
                    {yoloModelStatus === 'success' && '✅'}
                    {yoloModelStatus === 'error' && '❌'}
                    {yoloModelStatus === 'info' && 'ℹ️'}
                  </span>
                  <span>{yoloModelMessage}</span>
                </div>
              </div>
            )}

            <div className="text-sm text-muted-foreground space-y-2">
              <div>
                <p><strong>URL actual:</strong> {yoloModelURL}</p>
              </div>
              <div>
                <p><strong>Estado de caché:</strong> {cacheInfo.cached ? '✅ Modelo en caché' : '❌ Modelo no almacenado'}</p>
                {cacheInfo.cached && (
                  <div className="mt-1 pl-4 space-y-1">
                    <p>• Tamaño: {cacheInfo.sizeFormatted}</p>
                    <p>• Descargado: {new Date(cacheInfo.downloadedAt).toLocaleString('es-CL')}</p>
                  </div>
                )}
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-blue-800">
                  <strong>💡 Consejo:</strong> Si el modelo está en caché, no se descargará nuevamente en cada actualización de la página.
                  Usa "Descargar y almacenar" para actualizar el modelo o descargarlo por primera vez.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
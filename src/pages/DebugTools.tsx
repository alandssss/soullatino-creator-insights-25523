import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Bug,
  Trash2,
  RefreshCw,
  Power,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

const DebugTools = () => {
  const { toast } = useToast();
  const [swStatus, setSwStatus] = useState<string>('checking');
  const [swScriptURL, setSwScriptURL] = useState<string>('');
  const [cacheKeys, setCacheKeys] = useState<string[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [swDisabled, setSwDisabled] = useState(false);

  useEffect(() => {
    checkServiceWorker();
    checkCaches();
    loadErrors();
    setSwDisabled(localStorage.getItem('DISABLE_SW') === '1');
  }, []);

  const checkServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        setSwStatus('active');
        setSwScriptURL(registration.active?.scriptURL || registration.installing?.scriptURL || '');
      } else {
        setSwStatus('none');
      }
    } else {
      setSwStatus('not-supported');
    }
  };

  const checkCaches = async () => {
    if ('caches' in window) {
      const keys = await caches.keys();
      setCacheKeys(keys);
    }
  };

  const loadErrors = () => {
    try {
      const stored = localStorage.getItem('clientErrors');
      if (stored) {
        setErrors(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load errors:', e);
    }
  };

  const handleClearCaches = async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
      setCacheKeys([]);
      toast({
        title: 'Cachés limpiadas',
        description: `Se eliminaron ${keys.length} cachés`,
      });
    } catch (e) {
      toast({
        title: 'Error',
        description: 'No se pudieron limpiar las cachés',
        variant: 'destructive',
      });
    }
  };

  const handleUnregisterSW = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
        setSwStatus('none');
        toast({
          title: 'Service Worker desregistrado',
          description: 'Recarga la página para aplicar cambios',
        });
      }
    } catch (e) {
      toast({
        title: 'Error',
        description: 'No se pudo desregistrar el Service Worker',
        variant: 'destructive',
      });
    }
  };

  const handleFullReset = async () => {
    try {
      await handleClearCaches();
      await handleUnregisterSW();
      localStorage.removeItem('DISABLE_SW');
      localStorage.removeItem('clientErrors');
      toast({
        title: 'Reset completo',
        description: 'Recargando en 2 segundos...',
      });
      setTimeout(() => window.location.reload(), 2000);
    } catch (e) {
      toast({
        title: 'Error',
        description: 'No se pudo realizar el reset completo',
        variant: 'destructive',
      });
    }
  };

  const handleToggleSW = () => {
    const newValue = !swDisabled;
    if (newValue) {
      localStorage.setItem('DISABLE_SW', '1');
    } else {
      localStorage.removeItem('DISABLE_SW');
    }
    setSwDisabled(newValue);
    toast({
      title: newValue ? 'SW desactivado' : 'SW activado',
      description: 'Recarga la página para aplicar cambios',
    });
  };

  const handleClearErrors = () => {
    localStorage.removeItem('clientErrors');
    setErrors([]);
    toast({
      title: 'Errores limpiados',
      description: 'Historial de errores eliminado',
    });
  };

  const getSwIcon = () => {
    switch (swStatus) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'none':
        return <XCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Bug className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Herramientas de Depuración</h1>
          <p className="text-muted-foreground">
            Diagnóstico y gestión de cachés y Service Worker
          </p>
        </div>
      </div>

      {/* Service Worker Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getSwIcon()}
            Service Worker
          </CardTitle>
          <CardDescription>
            Estado actual del Service Worker en tu navegador
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Estado:</span>
            <Badge variant={swStatus === 'active' ? 'default' : 'secondary'}>
              {swStatus === 'active' ? 'Activo' : swStatus === 'none' ? 'No registrado' : 'No soportado'}
            </Badge>
          </div>
          {swScriptURL && (
            <div className="text-xs text-muted-foreground break-all">
              <strong>Script:</strong> {swScriptURL}
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Modo seguro:</span>
            <Badge variant={swDisabled ? 'destructive' : 'secondary'}>
              {swDisabled ? 'Desactivado' : 'Normal'}
            </Badge>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleUnregisterSW} variant="outline" size="sm">
              <XCircle className="h-4 w-4 mr-2" />
              Desregistrar
            </Button>
            <Button onClick={handleToggleSW} variant="outline" size="sm">
              <Power className="h-4 w-4 mr-2" />
              {swDisabled ? 'Activar' : 'Desactivar'} SW
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Caches */}
      <Card>
        <CardHeader>
          <CardTitle>Cachés del navegador</CardTitle>
          <CardDescription>
            {cacheKeys.length} caché(s) almacenada(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {cacheKeys.length > 0 ? (
            <div className="space-y-2">
              {cacheKeys.map((key) => (
                <div
                  key={key}
                  className="p-2 bg-muted rounded text-sm font-mono"
                >
                  {key}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay cachés almacenadas</p>
          )}
          <Button onClick={handleClearCaches} variant="outline" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Limpiar cachés
          </Button>
        </CardContent>
      </Card>

      {/* Errors Log */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de errores</CardTitle>
          <CardDescription>
            {errors.length} error(es) registrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errors.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {errors.map((err, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-destructive/10 border border-destructive/20 rounded text-xs space-y-2"
                >
                  <div className="text-muted-foreground">
                    {new Date(err.timestamp).toLocaleString()}
                  </div>
                  <div className="font-semibold text-destructive">{err.error}</div>
                  {err.stack && (
                    <pre className="text-xs text-muted-foreground overflow-x-auto">
                      {err.stack.substring(0, 200)}...
                    </pre>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay errores registrados</p>
          )}
          {errors.length > 0 && (
            <Button onClick={handleClearErrors} variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Limpiar errores
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Full Reset */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Reset completo</CardTitle>
          <CardDescription>
            Limpia todas las cachés, desregistra el SW y recarga la app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleFullReset} variant="destructive" size="lg" className="w-full">
            <RefreshCw className="h-5 w-5 mr-2" />
            Resetear todo y recargar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DebugTools;

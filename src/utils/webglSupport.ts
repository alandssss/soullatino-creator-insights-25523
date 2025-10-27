export function isWebGLAvailable(): boolean {
  try {
    // Detectar Android WebView (problemático con WebGL)
    const ua = (navigator.userAgent || '').toLowerCase();
    const isAndroid = /android/.test(ua);
    const isWebView = /wv/.test(ua) || /version\/\d+\.\d+/.test(ua);
    
    // Forzar fallback 2D en Android WebView para evitar crashes
    if (isAndroid && isWebView) {
      console.log('[WebGL] Android WebView detectado - usando fallback 2D');
      return false;
    }
    
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
}

export function getWebGLErrorMessage(): string {
  return 'Tu navegador no soporta WebGL o está deshabilitado. Las visualizaciones 3D no están disponibles, pero puedes continuar usando el dashboard.';
}

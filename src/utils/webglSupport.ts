export function isWebGLAvailable(): boolean {
  try {
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

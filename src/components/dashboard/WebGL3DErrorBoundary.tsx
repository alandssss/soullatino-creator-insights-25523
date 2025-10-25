import React from 'react';
import { WebGLFallback } from './WebGLFallback';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class WebGL3DErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    if (error.message.includes('WebGL') || error.message.includes('context')) {
      return { hasError: true, error };
    }
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('WebGL 3D Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <WebGLFallback message="Error al cargar gráficos 3D. Mostrando vista alternativa." />;
    }
    return this.props.children;
  }
}

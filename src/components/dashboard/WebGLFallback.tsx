import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface WebGLFallbackProps {
  message: string;
}

export function WebGLFallback({ message }: WebGLFallbackProps) {
  return (
    <Card className="col-span-full">
      <CardContent className="p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500" />
          <h3 className="text-xl font-semibold">Gráficos 3D No Disponibles</h3>
          <p className="text-muted-foreground max-w-md">{message}</p>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>El dashboard continúa funcionando con visualizaciones alternativas.</p>
            <a 
              href="https://get.webgl.org/" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80"
            >
              Verificar soporte WebGL en tu navegador
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

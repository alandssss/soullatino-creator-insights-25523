import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploaderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  uploadResult?: {
    success: boolean;
    recordsProcessed?: number;
    error?: string;
  };
}

export function UploaderModal({ 
  open, 
  onOpenChange, 
  onFileSelect, 
  isUploading,
  uploadResult 
}: UploaderModalProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        onFileSelect(file);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl rounded-2xl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl">Subir archivo Excel</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Importa los datos de TikTok para generar recomendaciones automáticas.
            El archivo debe contener las columnas: Creator ID, Username, Días, Horas y Diamantes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {!uploadResult ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={cn(
                "relative rounded-2xl border-2 border-dashed p-12 transition-all",
                dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                isUploading && "pointer-events-none opacity-50"
              )}
            >
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileInput}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                disabled={isUploading}
              />
              
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="rounded-full bg-muted p-4">
                  <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                </div>
                
                <div className="space-y-2">
                  <p className="font-medium">
                    {isUploading ? 'Procesando archivo...' : 'Arrastra tu archivo aquí'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    o haz clic para seleccionar
                  </p>
                </div>

                <Button 
                  variant="outline" 
                  className="rounded-xl gap-2"
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4" />
                  Seleccionar archivo
                </Button>

                <p className="text-xs text-muted-foreground">
                  Formatos soportados: .xlsx, .xls (máx. 10MB)
                </p>
              </div>
            </div>
          ) : (
            <div className={cn(
              "rounded-2xl p-8 text-center space-y-4",
              uploadResult.success ? "bg-green-50" : "bg-red-50"
            )}>
              {uploadResult.success ? (
                <>
                  <div className="flex justify-center">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-green-900">
                      ¡Archivo procesado exitosamente!
                    </h3>
                    <p className="text-sm text-green-700">
                      {uploadResult.recordsProcessed} registros importados
                    </p>
                  </div>
                  <Button 
                    onClick={() => onOpenChange(false)}
                    className="rounded-xl"
                  >
                    Ir a la lista
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex justify-center">
                    <AlertCircle className="h-12 w-12 text-red-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-red-900">
                      Error al procesar archivo
                    </h3>
                    <p className="text-sm text-red-700">
                      {uploadResult.error || 'Intenta de nuevo'}
                    </p>
                  </div>
                  <Button 
                    onClick={() => onOpenChange(false)}
                    variant="outline"
                    className="rounded-xl"
                  >
                    Cerrar
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

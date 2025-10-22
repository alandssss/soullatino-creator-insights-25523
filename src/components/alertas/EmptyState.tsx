import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Filter, FileSpreadsheet } from "lucide-react";

interface EmptyStateProps {
  variant: 'no-data' | 'no-results' | 'error';
  onClearFilters?: () => void;
}

export function EmptyState({ variant, onClearFilters }: EmptyStateProps) {
  const configs = {
    'no-data': {
      icon: FileSpreadsheet,
      title: 'No hay datos disponibles',
      description: 'Sube un archivo Excel desde el panel de administración para ver recomendaciones.',
      actionLabel: null,
      showAction: false,
    },
    'no-results': {
      icon: Filter,
      title: 'No se encontraron resultados',
      description: 'Intenta ajustar los filtros o la búsqueda para ver más creadores.',
      actionLabel: 'Quitar filtros',
      showAction: true,
    },
    'error': {
      icon: Upload,
      title: 'Error al cargar datos',
      description: 'Hubo un problema al cargar las recomendaciones. Por favor, intenta de nuevo.',
      actionLabel: null,
      showAction: false,
    },
  };

  const config = configs[variant];
  const Icon = config.icon;

  return (
    <Card className="rounded-2xl p-12">
      <div className="flex flex-col items-center justify-center text-center space-y-6">
        <div className="rounded-full bg-muted p-6">
          <Icon className="h-12 w-12 text-muted-foreground" />
        </div>
        
        <div className="space-y-2 max-w-md">
          <h3 className="text-xl font-semibold">{config.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {config.description}
          </p>
        </div>

        {config.showAction && config.actionLabel && onClearFilters && (
          <div className="flex gap-3">
            <Button 
              onClick={onClearFilters}
              size="lg"
              className="rounded-xl gap-2 min-h-[44px]"
            >
              <Icon className="h-4 w-4" />
              {config.actionLabel}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

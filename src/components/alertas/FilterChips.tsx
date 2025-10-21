import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, Clock, TrendingDown, X } from "lucide-react";

export type FilterType = 'all' | 'alto' | 'medio' | 'bajo' | 'deficit_dias' | 'deficit_horas';

interface FilterChipsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  counts?: {
    alto: number;
    medio: number;
    bajo: number;
    deficit_dias: number;
    deficit_horas: number;
  };
}

const filters = [
  { 
    id: 'all' as FilterType, 
    label: 'Todos', 
    icon: null,
    variant: 'outline' as const
  },
  { 
    id: 'alto' as FilterType, 
    label: 'Riesgo Alto', 
    icon: AlertTriangle,
    variant: 'destructive' as const
  },
  { 
    id: 'deficit_dias' as FilterType, 
    label: 'Faltan Días', 
    icon: Clock,
    variant: 'default' as const
  },
  { 
    id: 'deficit_horas' as FilterType, 
    label: 'Faltan Horas', 
    icon: TrendingDown,
    variant: 'default' as const
  },
];

export function FilterChips({ activeFilter, onFilterChange, counts }: FilterChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {filters.map((filter) => {
        const isActive = activeFilter === filter.id;
        const count = counts?.[filter.id as keyof typeof counts];
        const Icon = filter.icon;
        
        return (
          <Button
            key={filter.id}
            variant={isActive ? filter.variant : 'outline'}
            size="sm"
            onClick={() => onFilterChange(filter.id)}
            className={cn(
              "gap-2 rounded-full px-4 py-2 font-medium transition-all",
              "hover:scale-105 active:scale-95",
              isActive && "ring-2 ring-offset-2",
              filter.id === 'alto' && isActive && "ring-destructive",
              filter.id !== 'alto' && filter.id !== 'all' && isActive && "ring-primary"
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            <span>{filter.label}</span>
            {count !== undefined && count > 0 && (
              <Badge 
                variant={isActive ? "secondary" : "outline"} 
                className="ml-1 rounded-full px-2 py-0.5 text-xs"
              >
                {count}
              </Badge>
            )}
            {isActive && filter.id !== 'all' && (
              <X className="h-3 w-3 ml-1" />
            )}
          </Button>
        );
      })}
    </div>
  );
}

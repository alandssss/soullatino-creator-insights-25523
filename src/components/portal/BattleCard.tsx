import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Swords, Trophy, Hand, Target, FileText } from "lucide-react";

interface BattleCardProps {
  batalla: {
    fecha: string;
    hora: string;
    oponente: string;
    tipo?: string;
    guantes?: string;
    reto?: string;
    notas?: string;
    estado: string;
  };
}

const formatFecha = (fecha: string): string => {
  const date = new Date(fecha + 'T00:00:00');
  return date.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const formatHora = (hora: string): string => {
  const [hours, minutes] = hora.split(':');
  return `${hours}:${minutes}`;
};

export default function BattleCard({ batalla }: BattleCardProps) {
  const getBadgeVariant = () => {
    switch (batalla.estado) {
      case 'programada':
        return 'default';
      case 'completada':
        return 'secondary';
      case 'cancelada':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getCardClass = () => {
    switch (batalla.estado) {
      case 'programada':
        return 'border-primary/50 bg-primary/5';
      case 'completada':
        return 'opacity-75';
      case 'cancelada':
        return 'opacity-60 border-destructive/30';
      default:
        return '';
    }
  };

  return (
    <Card className={`neo-card ${getCardClass()}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" />
            VS {batalla.oponente}
          </CardTitle>
          <Badge variant={getBadgeVariant()}>
            {batalla.estado}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="capitalize">{formatFecha(batalla.fecha)}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{formatHora(batalla.hora)}</span>
        </div>

        {batalla.tipo && (
          <div className="flex items-center gap-2 text-sm">
            <Trophy className="h-4 w-4 text-muted-foreground" />
            <span>Modalidad: {batalla.tipo}</span>
          </div>
        )}

        {batalla.guantes && (
          <div className="flex items-center gap-2 text-sm">
            <Hand className="h-4 w-4 text-muted-foreground" />
            <span>Guantes: {batalla.guantes}</span>
          </div>
        )}

        {batalla.reto && (
          <div className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span>Reto: {batalla.reto}</span>
          </div>
        )}

        {batalla.notas && (
          <div className="flex items-start gap-2 text-sm mt-3 pt-3 border-t border-border/50">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
            <span className="text-muted-foreground italic">{batalla.notas}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { ActionCell } from "./ActionCell";

interface Recommendation {
  creator_id: string;
  creator_username: string;
  phone_e164: string | null;
  dias_actuales: number;
  horas_actuales: number;
  diamantes_actuales: number;
  proximo_objetivo: string;
  dias_restantes: number;
  faltan_dias: number;
  faltan_horas: number;
  horas_min_dia_sugeridas: number;
  prioridad_riesgo: number;
}

interface RiskTableProps {
  recommendations: Recommendation[];
  onWhatsApp: (rec: Recommendation) => void;
  onCall: (rec: Recommendation) => void;
  isLoading?: boolean;
}

function getRiskBadge(prioridad: number, faltan_dias: number) {
  if (prioridad >= 40) {
    return (
      <Badge variant="destructive" className="gap-1.5 rounded-full px-3 py-1">
        <AlertTriangle className="h-3 w-3" />
        <span className="font-semibold">Riesgo Alto</span>
      </Badge>
    );
  } else if (prioridad >= 20) {
    return (
      <Badge className="gap-1.5 rounded-full bg-yellow-500 px-3 py-1 hover:bg-yellow-600">
        <AlertTriangle className="h-3 w-3" />
        <span className="font-semibold">Riesgo Medio</span>
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
      <TrendingUp className="h-3 w-3" />
      <span className="font-semibold">Riesgo Bajo</span>
    </Badge>
  );
}

export function RiskTable({ recommendations, onWhatsApp, onCall, isLoading }: RiskTableProps) {
  return (
    <div className="space-y-4">
      {recommendations.map((rec) => (
        <Card 
          key={rec.creator_id} 
          className={cn(
            "rounded-2xl border-2 p-6 transition-all hover:shadow-lg",
            rec.prioridad_riesgo >= 40 && "border-destructive/50 bg-destructive/5",
            rec.prioridad_riesgo >= 20 && rec.prioridad_riesgo < 40 && "border-yellow-500/50 bg-yellow-500/5"
          )}
        >
          {/* Header con nombre y badges */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-semibold leading-none">
                  {rec.creator_username}
                </h3>
                {getRiskBadge(rec.prioridad_riesgo, rec.faltan_dias)}
                {rec.faltan_dias <= 1 && rec.faltan_dias > 0 && (
                  <Badge variant="destructive" className="gap-1.5 rounded-full px-3 py-1">
                    <Clock className="h-3 w-3" />
                    <span className="font-semibold">Último margen</span>
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Quedan <span className="font-semibold text-foreground">{rec.dias_restantes} días</span> del mes
              </p>
            </div>

            <div className="sm:ml-auto">
              <ActionCell
                hasPhone={!!rec.phone_e164}
                onWhatsApp={() => onWhatsApp(rec)}
                onCall={() => onCall(rec)}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Métricas actuales */}
          <div className="mb-6 grid grid-cols-2 gap-4 rounded-xl bg-muted/30 p-4 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Días live
              </p>
              <p className="text-xl font-semibold">{rec.dias_actuales}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Horas live
              </p>
              <p className="text-xl font-semibold">{rec.horas_actuales.toFixed(1)}h</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Diamantes
              </p>
              <p className="text-xl font-semibold">{rec.diamantes_actuales.toFixed(0)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Objetivo
              </p>
              <p className="text-xl font-semibold">{rec.proximo_objetivo}</p>
            </div>
          </div>

          {/* Métricas de déficit y recomendación */}
          <div className="grid grid-cols-1 gap-4 rounded-xl border-2 border-dashed border-muted-foreground/25 p-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Faltan días</p>
                <p className="text-lg font-semibold text-orange-600">{rec.faltan_dias}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Faltan horas</p>
                <p className="text-lg font-semibold text-orange-600">
                  {rec.faltan_horas.toFixed(1)}h
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Horas/día sugeridas</p>
                <p className="text-lg font-semibold text-blue-600">
                  {rec.horas_min_dia_sugeridas.toFixed(1)}h
                </p>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

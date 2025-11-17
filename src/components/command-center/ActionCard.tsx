import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Eye } from "lucide-react";

interface ActionCardProps {
  alerta: {
    creator_id: string;
    tiktok_username: string;
    nombre: string;
    texto_manager: string;
    faltan_300k: number;
    req_diam_por_dia_300k: number;
    dias_restantes: number;
    dias_live_mes: number;
    horas_live_mes: number;
    diam_live_mes: number;
    es_nuevo_menos_90_dias: boolean;
    es_prioridad_300k: boolean;
  };
  onViewProfile: () => void;
  onSendWhatsApp: () => void;
}

export const ActionCard = ({ alerta, onViewProfile, onSendWhatsApp }: ActionCardProps) => {
  const priorityIcon = alerta.es_prioridad_300k ? "🔴" : "🟡";
  const priorityLabel = alerta.es_prioridad_300k ? "ALTA" : "MEDIA";

  return (
    <Card className="bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] hover:border-[hsl(211,100%,50%)] transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-2xl">{priorityIcon}</span>
              <h3 className="text-lg font-semibold text-white">
                @{alerta.tiktok_username}
              </h3>
              <Badge
                variant="outline"
                className={`${
                  alerta.es_prioridad_300k
                    ? "bg-red-500/10 text-red-400 border-red-500"
                    : "bg-yellow-500/10 text-yellow-400 border-yellow-500"
                }`}
              >
                PRIORIDAD {priorityLabel}
              </Badge>
              {alerta.es_nuevo_menos_90_dias && (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500">
                  NUEVO &lt;90 DÍAS
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{alerta.nombre}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Mensaje de Acción */}
        <div className="bg-[hsl(220,15%,11%)] rounded-lg p-4 border border-[hsl(220,15%,22%)]">
          <p className="text-sm font-medium text-[hsl(45,100%,51%)] mb-2">
            Acción Requerida:
          </p>
          <p className="text-sm text-gray-300 leading-relaxed">{alerta.texto_manager}</p>
        </div>

        {/* Métricas del Mes */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[hsl(220,15%,11%)] rounded-lg p-3 text-center border border-[hsl(220,15%,22%)]">
            <div className="text-xs text-muted-foreground mb-1">Días</div>
            <div className="text-lg font-bold text-white">{alerta.dias_live_mes}</div>
          </div>
          <div className="bg-[hsl(220,15%,11%)] rounded-lg p-3 text-center border border-[hsl(220,15%,22%)]">
            <div className="text-xs text-muted-foreground mb-1">Horas</div>
            <div className="text-lg font-bold text-white">
              {alerta.horas_live_mes.toFixed(1)}
            </div>
          </div>
          <div className="bg-[hsl(220,15%,11%)] rounded-lg p-3 text-center border border-[hsl(220,15%,22%)]">
            <div className="text-xs text-muted-foreground mb-1">Diamantes</div>
            <div className="text-lg font-bold text-[hsl(45,100%,51%)]">
              {(alerta.diam_live_mes / 1000).toFixed(0)}k
            </div>
          </div>
        </div>

        {/* Faltantes y Requeridos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Faltan para 300K:</span>
            <span className="font-semibold text-red-400">
              {(alerta.faltan_300k / 1000).toFixed(0)}k diamantes
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Requerido por día:</span>
            <span className="font-semibold text-white">
              ~{(alerta.req_diam_por_dia_300k / 1000).toFixed(1)}k/día ({alerta.dias_restantes}{" "}
              días)
            </span>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={onViewProfile}
            className="flex-1 bg-[hsl(211,100%,50%)] hover:bg-[hsl(211,100%,43%)] text-white"
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Perfil
          </Button>
          <Button
            onClick={onSendWhatsApp}
            variant="outline"
            className="border-[hsl(122,39%,49%)] text-[hsl(122,39%,49%)] hover:bg-[hsl(122,39%,49%)]/10"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            WhatsApp
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

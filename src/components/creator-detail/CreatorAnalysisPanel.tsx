import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, AlertCircle, Lightbulb, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RootCause {
  tipo: 'sin_dias' | 'caida_horas' | 'cambio_diamantes' | 'nuevo_creador' | 'estancado';
  severidad: 'critica' | 'alta' | 'media' | 'baja';
  titulo: string;
  descripcion: string;
  evidencia: string[];
}

interface ActionPlan {
  prioridad: number;
  accion: string;
  responsable: string;
  plazo: string;
}

interface CreatorAnalysisPanelProps {
  creatorId: string;
  creatorName: string;
}

export const CreatorAnalysisPanel = ({ creatorId, creatorName }: CreatorAnalysisPanelProps) => {
  const { toast } = useToast();
  const [causes, setCauses] = useState<RootCause[]>([]);
  const [actionPlan, setActionPlan] = useState<ActionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyzeCreator();
  }, [creatorId]);

  const analyzeCreator = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const mesReferencia = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

      // Obtener bonificación y métricas actuales
      const { data: bonif, error: bonifError } = await supabase
        .from('creator_bonificaciones')
        .select('*')
        .eq('creator_id', creatorId)
        .eq('mes_referencia', mesReferencia)
        .maybeSingle();

      if (bonifError) throw bonifError;

      // Obtener creador para contexto
      const { data: creator, error: creatorError } = await supabase
        .from('creators')
        .select('*')
        .eq('id', creatorId)
        .single();

      if (creatorError) throw creatorError;

      const detectedCauses: RootCause[] = [];
      const suggestedActions: ActionPlan[] = [];

      if (!bonif) {
        detectedCauses.push({
          tipo: 'sin_dias',
          severidad: 'critica',
          titulo: 'Sin Actividad Registrada',
          descripcion: 'No hay datos de bonificaciones para el mes actual',
          evidencia: [
            'No se encontraron registros en creator_bonificaciones',
            'Posible falta de carga de datos o inactividad total',
          ],
        });

        suggestedActions.push({
          prioridad: 1,
          accion: 'Verificar estado del creador y confirmar si sigue activo',
          responsable: 'Manager asignado',
          plazo: 'Inmediato (hoy)',
        });
      } else {
        // Análisis: Días insuficientes
        if ((bonif.dias_live_mes || 0) < 12) {
          detectedCauses.push({
            tipo: 'sin_dias',
            severidad: 'alta',
            titulo: 'Déficit Crítico de Días Live',
            descripcion: `Solo ${bonif.dias_live_mes || 0} días live, necesita mínimo 12`,
            evidencia: [
              `Días actuales: ${bonif.dias_live_mes || 0}`,
              `Faltan ${12 - (bonif.dias_live_mes || 0)} días para mínimo`,
              `Días restantes del mes: ${bonif.dias_restantes || 0}`,
            ],
          });

          suggestedActions.push({
            prioridad: 1,
            accion: 'Agendar llamada urgente para coordinar transmisiones diarias',
            responsable: 'Manager',
            plazo: 'Hoy',
          });
        }

        // Análisis: Horas bajas
        if ((bonif.horas_live_mes || 0) < 40 && (bonif.dias_live_mes || 0) >= 12) {
          detectedCauses.push({
            tipo: 'caida_horas',
            severidad: 'media',
            titulo: 'Transmisiones Cortas',
            descripcion: `Promedio de ${((bonif.horas_live_mes || 0) / (bonif.dias_live_mes || 1)).toFixed(1)}h/día, necesita aumentar duración`,
            evidencia: [
              `Horas totales: ${(bonif.horas_live_mes || 0).toFixed(1)}h`,
              `Necesita llegar a 40h mínimo`,
              `Promedio actual: ${((bonif.horas_live_mes || 0) / (bonif.dias_live_mes || 1)).toFixed(1)}h/día`,
            ],
          });

          suggestedActions.push({
            prioridad: 2,
            accion: `Recomendar transmitir ${(bonif.req_horas_por_dia || 0).toFixed(1)}h/día mínimo`,
            responsable: 'Supervisor',
            plazo: 'Esta semana',
          });
        }

        // Análisis: Diamantes muy por debajo de meta
        if ((bonif.diam_live_mes || 0) < 25000 && (bonif.dias_live_mes || 0) >= 12) {
          detectedCauses.push({
            tipo: 'cambio_diamantes',
            severidad: 'alta',
            titulo: 'Diamantes Muy Por Debajo de Meta',
            descripcion: `Solo ${(bonif.diam_live_mes || 0).toLocaleString()} diamantes, lejos de 50K`,
            evidencia: [
              `Diamantes actuales: ${(bonif.diam_live_mes || 0).toLocaleString()}`,
              `Meta 50K: falta ${(bonif.faltan_50k || 0).toLocaleString()}`,
              `Ritmo diario requerido: ${(bonif.req_diam_por_dia_50k || 0).toLocaleString()}/día`,
            ],
          });

          suggestedActions.push({
            prioridad: 1,
            accion: 'Revisar estrategia de engagement y batallas (PKs)',
            responsable: 'Manager + Supervisor',
            plazo: '2-3 días',
          });
        }

        // Análisis: Creador nuevo con bajo desempeño
        if (creator.dias_en_agencia && creator.dias_en_agencia < 90 && (bonif.diam_live_mes || 0) < 30000) {
          detectedCauses.push({
            tipo: 'nuevo_creador',
            severidad: 'media',
            titulo: 'Creador Nuevo con Desempeño Bajo',
            descripcion: `Lleva ${creator.dias_en_agencia} días en agencia, aún no alcanza ritmo esperado`,
            evidencia: [
              `Días en agencia: ${creator.dias_en_agencia}`,
              `Diamantes mes: ${(bonif.diam_live_mes || 0).toLocaleString()}`,
              `Esperado para nuevos: ~30-50K al primer mes`,
            ],
          });

          suggestedActions.push({
            prioridad: 2,
            accion: 'Asignar sesión de coaching/onboarding con mejor prácticas',
            responsable: 'Supervisor o Manager Senior',
            plazo: 'Esta semana',
          });
        }

        // Análisis: Estancado cerca de meta pero sin avanzar
        if ((bonif.diam_live_mes || 0) >= 45000 && (bonif.diam_live_mes || 0) < 50000 && (bonif.dias_restantes || 30) < 7) {
          detectedCauses.push({
            tipo: 'estancado',
            severidad: 'media',
            titulo: 'Cerca de Meta pero Estancado',
            descripcion: `Está en ${(bonif.diam_live_mes || 0).toLocaleString()}, falta poco para 50K pero quedan pocos días`,
            evidencia: [
              `Diamantes: ${(bonif.diam_live_mes || 0).toLocaleString()}`,
              `Faltan ${(bonif.faltan_50k || 0).toLocaleString()} para 50K`,
              `Días restantes: ${bonif.dias_restantes || 0}`,
            ],
          });

          suggestedActions.push({
            prioridad: 1,
            accion: 'Impulsar con batallas extras o eventos especiales de fin de mes',
            responsable: 'Manager',
            plazo: 'Inmediato',
          });
        }
      }

      // Si no hay causas detectadas, agregar un mensaje positivo
      if (detectedCauses.length === 0 && bonif) {
        detectedCauses.push({
          tipo: 'estancado', // reutilizamos el tipo
          severidad: 'baja',
          titulo: '✅ Desempeño Dentro de lo Esperado',
          descripcion: 'El creador está cumpliendo con las métricas esperadas',
          evidencia: [
            `Días: ${bonif.dias_live_mes || 0} (mínimo 12 ✅)`,
            `Horas: ${(bonif.horas_live_mes || 0).toFixed(1)} (mínimo 40h ${(bonif.horas_live_mes || 0) >= 40 ? '✅' : '⚠️'})`,
            `Diamantes: ${(bonif.diam_live_mes || 0).toLocaleString()}`,
          ],
        });

        suggestedActions.push({
          prioridad: 3,
          accion: 'Mantener acompañamiento regular y felicitar por el buen desempeño',
          responsable: 'Manager',
          plazo: 'Seguimiento semanal',
        });
      }

      setCauses(detectedCauses);
      setActionPlan(suggestedActions.sort((a, b) => a.prioridad - b.prioridad));
    } catch (error) {
      console.error('Error analyzing creator:', error);
      toast({
        title: "Error",
        description: "No se pudo completar el análisis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severidad: RootCause['severidad']) => {
    switch (severidad) {
      case 'critica': return 'bg-red-500/20 text-red-500 border-red-500/30';
      case 'alta': return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
      case 'media': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'baja': return 'bg-green-500/20 text-green-500 border-green-500/30';
      default: return 'bg-muted';
    }
  };

  const getCauseIcon = (tipo: RootCause['tipo']) => {
    switch (tipo) {
      case 'sin_dias': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'caida_horas': return <TrendingDown className="h-5 w-5 text-orange-500" />;
      case 'cambio_diamantes': return <TrendingDown className="h-5 w-5 text-yellow-500" />;
      case 'nuevo_creador': return <Lightbulb className="h-5 w-5 text-blue-500" />;
      case 'estancado': return <Target className="h-5 w-5 text-purple-500" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Card className="neo-card-sm">
        <CardHeader>
          <CardTitle>Analizando...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="neo-card-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Lightbulb className="h-5 w-5 text-purple-500" />
          </div>
          Análisis de Causa Raíz - {creatorName}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Diagnóstico de desempeño y plan de acción
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Causas detectadas */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Causas Probables ({causes.length})
          </h3>
          {causes.map((cause, index) => (
            <div
              key={index}
              className="p-4 rounded-lg bg-muted/10 border border-border/30 space-y-3 text-wrap-safe"
            >
              <div className="flex items-start gap-3">
                {getCauseIcon(cause.tipo)}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-sm break-words">{cause.titulo}</h4>
                    <Badge className={`${getSeverityColor(cause.severidad)} text-xs`}>
                      {cause.severidad}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground break-words">{cause.descripcion}</p>
                  <div className="space-y-1">
                    <p className="text-xs font-medium">Evidencia:</p>
                    <ul className="text-xs text-muted-foreground space-y-1 pl-4">
                      {cause.evidencia.map((ev, i) => (
                        <li key={i} className="list-disc break-words">{ev}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Plan de acción sugerido */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Plan de Acción Sugerido ({actionPlan.length})
          </h3>
          {actionPlan.map((action, index) => (
            <div
              key={index}
              className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2 text-wrap-safe"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      #{action.prioridad}
                    </Badge>
                    <span className="text-sm font-medium break-words">{action.accion}</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5 break-words">
                    <p>👤 Responsable: {action.responsable}</p>
                    <p>⏰ Plazo: {action.plazo}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Nota final */}
        <div className="p-3 rounded-lg bg-muted/5 border border-border/10">
          <p className="text-xs text-muted-foreground italic">
            💡 Este análisis es automático y se basa en los datos disponibles. Complementa con tu conocimiento del creador y contexto específico.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

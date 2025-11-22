import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, Clock, Target, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreatorAlert {
  tipo: 'riesgo_alto' | 'deficit_dias' | 'deficit_horas' | 'deficit_diamantes' | 'meta_cercana';
  prioridad: number;
  mensaje: string;
  detalles: string;
  accion_sugerida: string;
}

interface CreatorAlertsPanelProps {
  creatorId: string;
  creatorName: string;
}

export const CreatorAlertsPanel = ({ creatorId, creatorName }: CreatorAlertsPanelProps) => {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<CreatorAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [bonificacion, setBonificacion] = useState<any>(null);

  useEffect(() => {
    loadAlerts();
  }, [creatorId]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      // Obtener bonificación actual
      const now = new Date();
      const mesReferencia = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

      const { data, error } = await supabase
        .from('creator_bonificaciones')
        .select('*')
        .eq('creator_id', creatorId)
        .eq('mes_referencia', mesReferencia)
        .maybeSingle();

      if (error) throw error;

      setBonificacion(data);

      // Generar alertas basadas en bonificación
      const generatedAlerts: CreatorAlert[] = [];

      if (data) {
        // Alerta de riesgo alto (prioridad 300K)
        if (data.es_prioridad_300k && data.faltan_300k && data.faltan_300k > 0) {
          const diasRestantes = data.dias_restantes || 1;
          const diamantesPorDia = Math.ceil(data.faltan_300k / diasRestantes);
          
          generatedAlerts.push({
            tipo: 'riesgo_alto',
            prioridad: 90,
            mensaje: `🚨 Prioridad 300K en Riesgo`,
            detalles: `Faltan ${data.faltan_300k.toLocaleString()} diamantes para 300K`,
            accion_sugerida: `Necesita ~${diamantesPorDia.toLocaleString()} diamantes/día los próximos ${diasRestantes} días`,
          });
        }

        // Alerta de déficit de días
        if (data.faltan_50k && data.faltan_50k > 0 && data.dias_live_mes < 12) {
          generatedAlerts.push({
            tipo: 'deficit_dias',
            prioridad: 70,
            mensaje: `⏰ Déficit de Días Live`,
            detalles: `Tiene ${data.dias_live_mes || 0} días, necesita al menos 12 para bonificación`,
            accion_sugerida: `Contactar hoy para confirmar transmisiones pendientes`,
          });
        }

        // Alerta de déficit de horas
        if (data.faltan_50k && data.faltan_50k > 0 && data.horas_live_mes < 40) {
          const horasFaltantes = 40 - (data.horas_live_mes || 0);
          generatedAlerts.push({
            tipo: 'deficit_horas',
            prioridad: 65,
            mensaje: `⏱️ Déficit de Horas Live`,
            detalles: `Tiene ${(data.horas_live_mes || 0).toFixed(1)}h, faltan ${horasFaltantes.toFixed(1)}h para 40h mínimas`,
            accion_sugerida: `Sugerencia: ${(data.req_horas_por_dia || 0).toFixed(1)} horas/día promedio`,
          });
        }

        // Alerta de diamantes lejanos
        if (data.faltan_50k && data.faltan_50k > 0) {
          generatedAlerts.push({
            tipo: 'deficit_diamantes',
            prioridad: 60,
            mensaje: `💎 Faltan Diamantes para 50K`,
            detalles: `Actual: ${(data.diam_live_mes || 0).toLocaleString()}, Meta: 50,000`,
            accion_sugerida: `Ritmo diario requerido: ${(data.req_diam_por_dia_50k || 0).toLocaleString()} diamantes/día`,
          });
        }

        // Alerta de meta cercana (casi alcanzada)
        if (data.grad_50k || data.grad_100k) {
          const metaAlcanzada = data.grad_100k ? '100K' : '50K';
          generatedAlerts.push({
            tipo: 'meta_cercana',
            prioridad: 50,
            mensaje: `🎯 Meta ${metaAlcanzada} Alcanzada`,
            detalles: `El creador ya graduó a ${metaAlcanzada}`,
            accion_sugerida: `Felicitar y fijar nueva meta (300K o 500K)`,
          });
        }

        // Semáforo rojo en alguna meta
        if (data.semaforo_50k === 'rojo' || data.semaforo_100k === 'rojo' || data.semaforo_300k === 'rojo') {
          generatedAlerts.push({
            tipo: 'riesgo_alto',
            prioridad: 85,
            mensaje: `🔴 Semáforo Rojo Detectado`,
            detalles: `Ritmo actual insuficiente para alcanzar meta`,
            accion_sugerida: `Contactar URGENTE para ajustar plan de trabajo`,
          });
        }
      } else {
        // Sin datos de bonificación
        generatedAlerts.push({
          tipo: 'riesgo_alto',
          prioridad: 95,
          mensaje: `⚠️ Sin Datos del Mes`,
          detalles: `No hay registro de bonificaciones para este mes`,
          accion_sugerida: `Verificar si el creador está activo y tiene métricas cargadas`,
        });
      }

      // Ordenar por prioridad descendente
      generatedAlerts.sort((a, b) => b.prioridad - a.prioridad);

      setAlerts(generatedAlerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las alertas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (tipo: CreatorAlert['tipo']) => {
    switch (tipo) {
      case 'riesgo_alto': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'deficit_dias': return <Clock className="h-5 w-5 text-orange-500" />;
      case 'deficit_horas': return <TrendingDown className="h-5 w-5 text-yellow-500" />;
      case 'deficit_diamantes': return <TrendingDown className="h-5 w-5 text-blue-500" />;
      case 'meta_cercana': return <Target className="h-5 w-5 text-green-500" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (prioridad: number) => {
    if (prioridad >= 80) return 'bg-red-500/20 text-red-500 border-red-500/30';
    if (prioridad >= 60) return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
    if (prioridad >= 40) return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
    return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
  };

  if (loading) {
    return (
      <Card className="neo-card-sm">
        <CardHeader>
          <CardTitle>Cargando alertas...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="neo-card-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </div>
          Alertas Activas - {creatorName}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {alerts.length} alerta{alerts.length !== 1 ? 's' : ''} detectada{alerts.length !== 1 ? 's' : ''}
        </p>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <div className="flex justify-center mb-3">
              <div className="p-3 rounded-full bg-green-500/10">
                <Target className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              ✅ Todo en orden. Sin alertas críticas.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-muted/10 border border-border/30 space-y-3"
              >
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.tipo)}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm">{alert.mensaje}</h3>
                      <Badge className={`${getPriorityColor(alert.prioridad)} text-xs`}>
                        Prioridad: {alert.prioridad}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.detalles}</p>
                    <div className="p-2 rounded bg-primary/5 border border-primary/20">
                      <p className="text-xs font-medium text-primary">
                        💡 Acción: {alert.accion_sugerida}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Resumen de bonificación */}
        {bonificacion && (
          <div className="mt-6 p-4 rounded-lg bg-muted/5 border border-border/20 space-y-2">
            <h4 className="font-semibold text-sm">Resumen del Mes</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Días Live</p>
                <p className="font-medium">{bonificacion.dias_live_mes || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Horas Live</p>
                <p className="font-medium">{(bonificacion.horas_live_mes || 0).toFixed(1)}h</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Diamantes</p>
                <p className="font-medium">{(bonificacion.diam_live_mes || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Días Restantes</p>
                <p className="font-medium">{bonificacion.dias_restantes || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Meta Recomendada</p>
                <p className="font-medium">{bonificacion.meta_recomendada || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Prioridad 300K</p>
                <p className="font-medium">{bonificacion.es_prioridad_300k ? '✅ Sí' : '❌ No'}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

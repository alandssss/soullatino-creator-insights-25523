import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingDown, Calendar, Clock } from 'lucide-react';

interface RootCausePanelProps {
  bonificacion: any;
}

export function RootCausePanel({ bonificacion }: RootCausePanelProps) {
  if (!bonificacion) return null;

  // Análisis de causa raíz
  const causas: Array<{ tipo: 'critica' | 'alta' | 'media'; icon: any; titulo: string; detalle: string }> = [];

  // 1. Análisis de Días
  const progressDias = (bonificacion.dias_live_mes / 22) * 100;
  if (bonificacion.dias_live_mes < 12) {
    causas.push({
      tipo: 'critica',
      icon: Calendar,
      titulo: 'Días en vivo críticos',
      detalle: `Solo ${bonificacion.dias_live_mes} de 22 días (${progressDias.toFixed(0)}%). Necesitas transmitir ${22 - bonificacion.dias_live_mes} días más este mes.`,
    });
  } else if (bonificacion.dias_live_mes < 20) {
    causas.push({
      tipo: 'alta',
      icon: Calendar,
      titulo: 'Días en vivo por debajo del objetivo',
      detalle: `Llevas ${bonificacion.dias_live_mes} de 22 días (${progressDias.toFixed(0)}%). Te faltan ${22 - bonificacion.dias_live_mes} días para el hito 22d/80h.`,
    });
  }

  // 2. Análisis de Horas
  const progressHoras = (bonificacion.horas_live_mes / 80) * 100;
  if (bonificacion.horas_live_mes < 40) {
    causas.push({
      tipo: 'critica',
      icon: Clock,
      titulo: 'Horas en vivo muy bajas',
      detalle: `Solo ${bonificacion.horas_live_mes.toFixed(1)}h de 80h (${progressHoras.toFixed(0)}%). Promedio actual: ${(bonificacion.horas_live_mes / Math.max(1, bonificacion.dias_live_mes)).toFixed(1)}h/día. Necesitas ≥3h/día.`,
    });
  } else if (bonificacion.horas_live_mes < 60) {
    causas.push({
      tipo: 'alta',
      icon: Clock,
      titulo: 'Horas por debajo del objetivo intermedio',
      detalle: `Llevas ${bonificacion.horas_live_mes.toFixed(1)}h de 80h (${progressHoras.toFixed(0)}%). Faltan ${(80 - bonificacion.horas_live_mes).toFixed(1)}h.`,
    });
  }

  // 3. Análisis de Diamantes
  const gradTarget = bonificacion.grad_300k ? 300000 : (bonificacion.grad_500k ? 500000 : 1000000);
  const progressDiam = (bonificacion.diam_live_mes / gradTarget) * 100;
  if (progressDiam < 50) {
    causas.push({
      tipo: 'critica',
      icon: TrendingDown,
      titulo: 'Ritmo de diamantes insuficiente',
      detalle: `Llevas ${bonificacion.diam_live_mes.toLocaleString()} de ${gradTarget.toLocaleString()} (${progressDiam.toFixed(0)}%). Necesitas ${bonificacion.req_diam_por_dia?.toFixed(0) || 0}/día en los ${bonificacion.dias_restantes} días restantes.`,
    });
  } else if (progressDiam < 75) {
    causas.push({
      tipo: 'alta',
      icon: TrendingDown,
      titulo: 'Ritmo de diamantes ajustado',
      detalle: `Llevas ${progressDiam.toFixed(0)}% del objetivo de ${gradTarget.toLocaleString()}. Mantén ${bonificacion.req_diam_por_dia?.toFixed(0) || 0}/día para alcanzar la meta.`,
    });
  }

  // 4. Prioridad 300K (nuevos)
  if (bonificacion.es_prioridad_300k && bonificacion.diam_live_mes < 300000) {
    causas.push({
      tipo: 'media',
      icon: AlertTriangle,
      titulo: 'Prioridad: Nuevo en agencia (<90 días)',
      detalle: 'Como eres nuevo, tu meta prioritaria es alcanzar 300K diamantes este mes para consolidar tu posición.',
    });
  }

  const severityColor = {
    critica: 'bg-red-500/20 border-red-500/50 text-red-600 dark:text-red-400',
    alta: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-600 dark:text-yellow-400',
    media: 'bg-blue-500/20 border-blue-500/50 text-blue-600 dark:text-blue-400',
  };

  return (
    <Card className="neo-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Análisis de Causa Raíz
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Desglose detallado de factores que afectan el rendimiento
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {causas.length === 0 ? (
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
              ✅ Todo en orden. Mantén el ritmo actual para alcanzar tus metas.
            </p>
          </div>
        ) : (
          causas.map((causa, idx) => {
            const Icon = causa.icon;
            return (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${severityColor[causa.tipo]}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-sm">{causa.titulo}</h4>
                      <Badge variant={causa.tipo === 'critica' ? 'destructive' : 'default'}>
                        {causa.tipo.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs">{causa.detalle}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Barra de progreso general */}
        <div className="mt-6 pt-4 border-t border-border">
          <h4 className="text-sm font-semibold mb-3">Progreso Global del Mes</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Días ({bonificacion.dias_live_mes}/22)</span>
                <span>{progressDias.toFixed(0)}%</span>
              </div>
              <Progress value={progressDias} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Horas ({bonificacion.horas_live_mes.toFixed(1)}h/80h)</span>
                <span>{progressHoras.toFixed(0)}%</span>
              </div>
              <Progress value={progressHoras} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Diamantes ({bonificacion.diam_live_mes.toLocaleString()}/{gradTarget.toLocaleString()})</span>
                <span>{progressDiam.toFixed(0)}%</span>
              </div>
              <Progress value={progressDiam} className="h-2" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

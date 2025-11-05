import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Info, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CreatorRiskPanelProps {
  creatorId: string;
}

interface Alert {
  type: 'critical' | 'warning' | 'info';
  message: string;
  icon: typeof AlertCircle;
}

interface SupervisionLog {
  id: string;
  fecha_evento: string;
  en_vivo: boolean;
  en_batalla: boolean;
  buena_iluminacion: boolean;
  audio_claro: boolean;
  set_profesional: boolean;
  cumple_normas: boolean;
  score: number;
  riesgo: string;
  reporte?: string;
}

export function CreatorRiskPanel({ creatorId }: CreatorRiskPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [supervisionLogs, setSupervisionLogs] = useState<SupervisionLog[]>([]);
  const [bonificacion, setBonificacion] = useState<any>(null);
  
  useEffect(() => {
    loadAlerts();
    loadSupervisionLogs();
  }, [creatorId]);
  
  const loadAlerts = async () => {
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
    const { data } = await supabase
      .from('creator_bonificaciones')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('mes_referencia', currentMonth)
      .single();
    
    if (!data) return;
    setBonificacion(data);
    
    const newAlerts: Alert[] = [];
    
    // Alertas de Bonificaciones
    if (data.dias_live_mes === 0) {
      newAlerts.push({
        type: 'critical',
        message: 'Sin actividad este mes',
        icon: AlertCircle,
      });
    }
    
    if (data.dias_restantes > 0 && data.dias_restantes <= 5) {
      newAlerts.push({
        type: 'warning',
        message: `Solo quedan ${data.dias_restantes} días del mes`,
        icon: AlertTriangle,
      });
    }
    
    if (data.cerca_de_objetivo) {
      newAlerts.push({
        type: 'warning',
        message: `Cerca de graduación ${data.proximo_objetivo_valor} - Necesita apoyo`,
        icon: AlertTriangle,
      });
    }
    
    if (data.diam_live_mes < 50000 && data.dias_live_mes > 10) {
      newAlerts.push({
        type: 'warning',
        message: 'Bajo rendimiento pese a actividad',
        icon: AlertTriangle,
      });
    }
    
    if (data.es_prioridad_300k) {
      newAlerts.push({
        type: 'info',
        message: 'Prioridad 300K - Seguimiento especial',
        icon: Info,
      });
    }
    
    if (data.req_diam_por_dia > 0) {
      newAlerts.push({
        type: 'info',
        message: `Requiere ${data.req_diam_por_dia.toLocaleString()} 💎/día para alcanzar meta`,
        icon: Info,
      });
    }
    
    if (data.req_horas_por_dia > 0) {
      newAlerts.push({
        type: 'info',
        message: `Requiere ${data.req_horas_por_dia.toFixed(1)} horas/día en promedio`,
        icon: Info,
      });
    }
    
    setAlerts(newAlerts);
  };
  
  const loadSupervisionLogs = async () => {
    const { data } = await supabase
      .from('supervision_live_logs')
      .select('*')
      .eq('creator_id', creatorId)
      .order('fecha_evento', { ascending: false })
      .limit(5);
    
    setSupervisionLogs(data || []);
  };
  
  return (
    <div className="space-y-4">
      {/* Alertas de Bonificaciones y Comportamiento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Alertas y Recomendaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              ✅ No hay alertas activas
            </div>
          ) : (
            alerts.map((alert, idx) => (
              <div key={idx} className="p-3 rounded-lg border bg-card/50 flex items-start gap-3">
                <alert.icon className={`h-5 w-5 mt-0.5 shrink-0 ${
                  alert.type === 'critical' ? 'text-destructive' :
                  alert.type === 'warning' ? 'text-yellow-500' :
                  'text-blue-500'
                }`} />
                <div className="flex-1">
                  <Badge variant={
                    alert.type === 'critical' ? 'destructive' : 
                    'secondary'
                  } className="text-[10px]">
                    {alert.type.toUpperCase()}
                  </Badge>
                  <p className="text-sm mt-2">{alert.message}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Últimos Logs de Supervisión Live */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-purple-500" />
              Últimas Supervisiones
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(`/supervision-live?creatorId=${creatorId}`, '_blank')}
            >
              Ver todo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {supervisionLogs.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              Sin registros de supervisión
            </div>
          ) : (
            <div className="space-y-3">
              {supervisionLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-lg border bg-card/30">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.fecha_evento).toLocaleString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <Badge variant={
                      log.riesgo === 'verde' ? 'default' :
                      log.riesgo === 'amarillo' ? 'secondary' :
                      'destructive'
                    }>
                      {log.riesgo === 'verde' ? '🟢' : log.riesgo === 'amarillo' ? '🟡' : '🔴'}
                      Score: {log.score}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap text-xs">
                    {log.en_vivo && <Badge variant="outline" className="text-[10px]">🔴 LIVE</Badge>}
                    {log.en_batalla && <Badge variant="outline" className="text-[10px]">⚔️ PK</Badge>}
                    {log.buena_iluminacion && <Badge variant="outline" className="text-[10px]">💡 Luz</Badge>}
                    {log.audio_claro && <Badge variant="outline" className="text-[10px]">🔊 Audio</Badge>}
                    {log.set_profesional && <Badge variant="outline" className="text-[10px]">🎬 Set</Badge>}
                    {!log.cumple_normas && <Badge variant="destructive" className="text-[10px]">⚠️ Normas</Badge>}
                  </div>
                  
                  {log.reporte && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {log.reporte}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

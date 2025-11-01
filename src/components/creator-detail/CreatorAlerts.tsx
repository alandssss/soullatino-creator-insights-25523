import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

interface CreatorAlertsProps {
  creatorId: string;
}

interface Alert {
  type: 'critical' | 'warning' | 'info';
  message: string;
  icon: typeof AlertCircle;
}

export function CreatorAlerts({ creatorId }: CreatorAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  useEffect(() => {
    loadAlerts();
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
    
    const newAlerts: Alert[] = [];
    
    // Alerta: Sin actividad
    if (data.dias_live_mes === 0) {
      newAlerts.push({
        type: 'critical',
        message: 'Sin actividad este mes',
        icon: AlertCircle,
      });
    }
    
    // Alerta: Cerca de graduación
    if (data.cerca_de_objetivo) {
      newAlerts.push({
        type: 'warning',
        message: 'Cerca de graduación - Necesita apoyo',
        icon: AlertTriangle,
      });
    }
    
    // Alerta: Bajo rendimiento
    if (data.diam_live_mes < 50000 && data.dias_live_mes > 10) {
      newAlerts.push({
        type: 'warning',
        message: 'Bajo rendimiento pese a actividad',
        icon: AlertTriangle,
      });
    }
    
    // Info: Prioridad 300K
    if (data.es_prioridad_300k) {
      newAlerts.push({
        type: 'info',
        message: 'Prioridad 300K - Seguimiento especial',
        icon: Info,
      });
    }
    
    setAlerts(newAlerts);
  };
  
  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        ✅ No hay alertas para este creador
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {alerts.map((alert, idx) => (
        <div key={idx} className="p-3 rounded-lg border bg-card/50 flex items-start gap-3">
          <alert.icon className={`h-5 w-5 mt-0.5 ${
            alert.type === 'critical' ? 'text-destructive' :
            alert.type === 'warning' ? 'text-yellow-500' :
            'text-blue-500'
          }`} />
          <div className="flex-1">
            <Badge variant={
              alert.type === 'critical' ? 'destructive' : 
              'secondary'
            }>
              {alert.type.toUpperCase()}
            </Badge>
            <p className="text-sm mt-2">{alert.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Alert {
  id: string;
  type: "critical" | "warning" | "info";
  message: string;
  creator?: string;
  timestamp: Date;
}

interface CriticalAlertsPanelProps {
  alerts?: Alert[];
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    type: "critical",
    message: "3 creadores sin actividad en 7 días",
    timestamp: new Date(),
  },
  {
    id: "2",
    type: "warning",
    message: "5 creadores cerca de graduación necesitan apoyo",
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: "3",
    type: "info",
    message: "2 nuevos prospectos registrados hoy",
    timestamp: new Date(Date.now() - 7200000),
  },
];

export default function CriticalAlertsPanel({ alerts: propAlerts }: CriticalAlertsPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>(propAlerts || mockAlerts);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propAlerts) {
      fetchRealAlerts();
    } else {
      setAlerts(propAlerts);
      setLoading(false);
    }
  }, [propAlerts]);

  const fetchRealAlerts = async () => {
    const primerDiaMes = new Date();
    primerDiaMes.setDate(1);
    const mesReferencia = primerDiaMes.toISOString().split('T')[0];

    try {
      const { data, error } = await supabase
        .from('creator_bonificaciones')
        .select(`
          creator_id,
          diam_live_mes,
          dias_live_mes,
          horas_live_mes,
          cerca_de_objetivo,
          creators!inner(nombre)
        `)
        .eq('mes_referencia', mesReferencia);

      if (error) throw error;

      const newAlerts: Alert[] = [];

      // Alerta: Creadores sin actividad
      const sinActividad = data.filter(c => c.dias_live_mes === 0);
      if (sinActividad.length > 0) {
        newAlerts.push({
          id: 'no-activity',
          type: 'critical',
          message: `${sinActividad.length} creadores sin actividad este mes`,
          timestamp: new Date(),
        });
      }

      // Alerta: Cerca de graduación
      const cercaGraduacion = data.filter(c => c.cerca_de_objetivo);
      if (cercaGraduacion.length > 0) {
        newAlerts.push({
          id: 'near-graduation',
          type: 'warning',
          message: `${cercaGraduacion.length} creadores cerca de graduación necesitan apoyo`,
          timestamp: new Date(),
        });
      }

      // Alerta: Bajo rendimiento
      const bajoRendimiento = data.filter(c => 
        c.diam_live_mes < 50000 && c.dias_live_mes > 10
      );
      if (bajoRendimiento.length > 0) {
        newAlerts.push({
          id: 'low-performance',
          type: 'warning',
          message: `${bajoRendimiento.length} creadores con bajo rendimiento pese a actividad`,
          timestamp: new Date(),
        });
      }

      // Alerta informativa: Creadores activos
      const activos = data.filter(c => c.dias_live_mes > 0);
      newAlerts.push({
        id: 'active-creators',
        type: 'info',
        message: `${activos.length} creadores activos este mes`,
        timestamp: new Date(),
      });

      setAlerts(newAlerts.length > 0 ? newAlerts : mockAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setAlerts(mockAlerts);
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "critical":
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getAlertBadgeVariant = (type: Alert["type"]) => {
    switch (type) {
      case "critical":
        return "destructive";
      case "warning":
        return "warning";
      case "info":
        return "secondary";
    }
  };

  const criticalCount = alerts.filter(a => a.type === "critical").length;
  const warningCount = alerts.filter(a => a.type === "warning").length;

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            Alertas Críticas en Tiempo Real
          </CardTitle>
          <div className="flex gap-2">
            {criticalCount > 0 && (
              <Badge variant="destructive">
                {criticalCount} 🔴
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge className="bg-yellow-500 hover:bg-yellow-600">
                {warningCount} 🟡
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors"
              >
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant={getAlertBadgeVariant(alert.type) as any}>
                      {alert.type.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {alert.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{alert.message}</p>
                  {alert.creator && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Creator: {alert.creator}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

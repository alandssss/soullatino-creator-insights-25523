import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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

export default function CriticalAlertsPanel({ alerts = mockAlerts }: CriticalAlertsPanelProps) {
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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

// Componente temporalmente deshabilitado - requiere tablas user_work_goals y user_daily_activity
export const MonthlyFeedbackCalendar = () => {
  return (
    <Card className="neo-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Calendario de Feedback
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-8 text-center text-muted-foreground">
          <p>Calendario de feedback en desarrollo</p>
          <p className="text-sm mt-2">Requiere configuración de actividad diaria</p>
        </div>
      </CardContent>
    </Card>
  );
};

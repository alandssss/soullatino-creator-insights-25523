import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

// Componente temporalmente deshabilitado - requiere tabla creator_feedback_impact
export const FeedbackImpactChart = () => {
  return (
    <Card className="neo-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Impacto del Feedback
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-8 text-center text-muted-foreground">
          <p>Gráfico de impacto en desarrollo</p>
          <p className="text-sm mt-2">Requiere configuración de tabla adicional</p>
        </div>
      </CardContent>
    </Card>
  );
};

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

// Componente temporalmente deshabilitado - requiere tabla creator_bonificaciones completa
export const PanelPredictivoCreadores = () => {
  return (
    <Card className="neo-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Panel Predictivo de Bonificaciones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-8 text-center text-muted-foreground">
          <p>Panel predictivo en desarrollo</p>
          <p className="text-sm mt-2">Se habilitará cuando se complete la estructura de bonificaciones</p>
        </div>
      </CardContent>
    </Card>
  );
};

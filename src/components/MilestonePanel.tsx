import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";

// Componente temporalmente deshabilitado - requiere tabla creator_bonificaciones
export function MilestonePanel() {
  return (
    <Card className="neo-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Panel de Hitos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-8 text-center text-muted-foreground">
          <p>Panel de hitos en desarrollo</p>
          <p className="text-sm mt-2">Requiere configuración de bonificaciones</p>
        </div>
      </CardContent>
    </Card>
  );
};

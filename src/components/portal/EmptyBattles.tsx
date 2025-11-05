import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyBattlesProps {
  creatorName: string;
}

export default function EmptyBattles({ creatorName }: EmptyBattlesProps) {
  return (
    <Card className="neo-card mt-8">
      <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
        <Calendar className="h-16 w-16 text-muted-foreground opacity-50" />
        <h3 className="text-xl font-semibold">No hay batallas programadas</h3>
        <p className="text-muted-foreground text-center max-w-md">
          {creatorName}, aún no tienes batallas asignadas. Tu manager te notificará cuando haya nuevas batallas disponibles.
        </p>
      </CardContent>
    </Card>
  );
}

import BattleCard from "./BattleCard";
import { History } from "lucide-react";

interface Batalla {
  id: string;
  fecha: string;
  hora: string;
  oponente: string;
  tipo?: string;
  guantes?: string;
  reto?: string;
  notas?: string;
  estado: string;
}

interface BattleHistoryProps {
  batallas: Batalla[];
}

export default function BattleHistory({ batallas }: BattleHistoryProps) {
  if (batallas.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <History className="h-6 w-6 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Historial</h2>
      </div>
      <div className="space-y-4">
        {batallas.slice(0, 5).map((batalla) => (
          <BattleCard key={batalla.id} batalla={batalla} />
        ))}
      </div>
    </section>
  );
}

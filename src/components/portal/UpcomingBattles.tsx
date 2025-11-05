import BattleCard from "./BattleCard";
import { Trophy } from "lucide-react";

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

interface UpcomingBattlesProps {
  batallas: Batalla[];
}

export default function UpcomingBattles({ batallas }: UpcomingBattlesProps) {
  if (batallas.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Próximas Batallas</h2>
      </div>
      <div className="space-y-4">
        {batallas.map((batalla) => (
          <BattleCard key={batalla.id} batalla={batalla} />
        ))}
      </div>
    </section>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Creator {
  id: string;
  nombre: string;
  diamantes: number;
  views: number;
  hito_diamantes: number;
}

interface TopPerformersCardsProps {
  creators: Creator[];
}

const medals = ["🥇", "🥈", "🥉"];

export default function TopPerformersCards({ creators }: TopPerformersCardsProps) {
  if (!creators || creators.length === 0) {
    return (
      <div className="col-span-full">
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p className="text-lg font-semibold">No hay datos disponibles</p>
            <p className="text-sm mt-2">Espera a que se carguen los datos de los top performers</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const topCreators = creators
    .sort((a, b) => (b.diamantes || 0) - (a.diamantes || 0))
    .slice(0, 3);

  const getInitials = (nombre: string) => {
    return nombre.substring(0, 2).toUpperCase();
  };

  const getMilestoneColor = (hito: number) => {
    if (hito >= 300000) return "text-green-500";
    if (hito >= 100000) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {topCreators.map((creator, index) => (
        <Card 
          key={creator.id} 
          className="relative overflow-hidden hover:scale-105 transition-transform duration-300 animate-fade-in"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="absolute top-0 right-0 text-6xl opacity-20">
            {medals[index]}
          </div>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="w-16 h-16 border-2 border-primary">
                <AvatarFallback className="text-lg font-bold">
                  {getInitials(creator.nombre)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{medals[index]}</span>
                  <h3 className="font-bold text-lg truncate">{creator.nombre}</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Diamantes</span>
                    <span className="font-bold text-primary">
                      {(creator.diamantes || 0).toLocaleString()} 💎
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Vistas</span>
                    <span className="font-semibold">
                      {(creator.views || 0).toLocaleString()} 👁️
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Milestone</span>
                    <Badge variant="outline" className={getMilestoneColor(creator.hito_diamantes)}>
                      {creator.hito_diamantes >= 300000 && "🎯 300k+"}
                      {creator.hito_diamantes >= 100000 && creator.hito_diamantes < 300000 && "📈 100k+"}
                      {creator.hito_diamantes < 100000 && "🚀 Creciendo"}
                    </Badge>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span>Top {index + 1} del mes</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

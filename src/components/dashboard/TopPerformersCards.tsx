import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getCreatorDisplayName } from "@/utils/creator-display";
import { cn } from "@/lib/utils";

interface Creator {
  id: string;
  nombre: string;
  tiktok_username?: string;
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
        <Card className="glass-card">
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
    if (hito >= 300000) return "border-green-500/50 text-green-500";
    if (hito >= 100000) return "border-yellow-500/50 text-yellow-500";
    return "border-blue-500/50 text-blue-500";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
      {topCreators.map((creator, index) => {
        const progressPercent = Math.min((creator.diamantes / 1000000) * 100, 100);
        
        return (
          <Card 
            key={creator.id} 
            className={cn(
              "glass-card-elevated relative overflow-hidden",
              "group cursor-pointer",
              "hover:scale-[1.02] hover:shadow-2xl",
              "transition-all duration-500 ease-out"
            )}
          >
            {/* Badge de posición con gradiente */}
            <div className={cn(
              "absolute top-4 right-4 w-14 h-14 rounded-full z-10",
              "flex items-center justify-center font-bold text-xl",
              "shadow-lg animate-pulse-subtle",
              index === 0 && "gradient-gold shadow-yellow-500/50",
              index === 1 && "gradient-silver shadow-slate-400/50",
              index === 2 && "gradient-bronze shadow-orange-500/50"
            )}>
              <span className="text-white drop-shadow-md">{index + 1}</span>
            </div>
            
            <CardContent className="p-6 relative z-0">
              <div className="flex flex-col items-center gap-6">
                {/* Avatar con ring gradient animado */}
                <div className="relative">
                  <div className={cn(
                    "absolute -inset-3 rounded-full blur-lg opacity-30",
                    "group-hover:opacity-60 transition-opacity duration-700",
                    index === 0 && "bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600",
                    index === 1 && "bg-gradient-to-r from-slate-300 via-slate-400 to-slate-500",
                    index === 2 && "bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600"
                  )} />
                  <Avatar className={cn(
                    "relative h-24 w-24 border-4 border-white/20",
                    "ring-2 ring-offset-4 ring-offset-transparent",
                    "group-hover:ring-4 transition-all duration-500",
                    index === 0 && "ring-yellow-500/50 group-hover:ring-yellow-500",
                    index === 1 && "ring-slate-400/50 group-hover:ring-slate-400",
                    index === 2 && "ring-orange-500/50 group-hover:ring-orange-500"
                  )}>
                    <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-primary to-accent text-white">
                      {getInitials(creator.nombre)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                {/* Nombre con gradiente */}
                <div className="text-center w-full">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-3xl">{medals[index]}</span>
                  </div>
                  <h3 className="font-bold text-xl truncate text-gradient-primary">
                    {getCreatorDisplayName(creator)}
                  </h3>
                </div>
                
                {/* Stats con barra de progreso animada */}
                <div className="w-full space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Diamantes</span>
                      <span className="font-bold text-primary">
                        {(creator.diamantes / 1000).toFixed(0)}K 💎
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-1000 ease-out",
                          "group-hover:shadow-lg",
                          index === 0 && "gradient-gold group-hover:shadow-yellow-500/50",
                          index === 1 && "gradient-silver group-hover:shadow-slate-400/50",
                          index === 2 && "gradient-bronze group-hover:shadow-orange-500/50"
                        )}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Vistas</span>
                    <span className="font-semibold">
                      {(creator.views / 1000).toFixed(0)}K 👁️
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Milestone</span>
                    <Badge 
                      variant="outline" 
                      className={getMilestoneColor(creator.hito_diamantes)}
                    >
                      {creator.hito_diamantes >= 300000 && "🎯 300k+"}
                      {creator.hito_diamantes >= 100000 && creator.hito_diamantes < 300000 && "📈 100k+"}
                      {creator.hito_diamantes < 100000 && "🚀 Creciendo"}
                    </Badge>
                  </div>
                </div>
                
                {/* Footer con tendencia */}
                <div className="mt-2 pt-4 border-t border-white/10 w-full flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span>Top {index + 1} del mes</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

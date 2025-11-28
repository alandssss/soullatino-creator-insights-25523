import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, TrendingUp } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Creator = Tables<"creators">;

interface CompactCreatorCardProps {
    creator: Creator & { diamantes?: number; dias_live?: number; horas_live?: number };
    rank: number;
}

const getMedalEmoji = (rank: number) => {
    switch (rank) {
        case 1: return "🥇";
        case 2: return "🥈";
        case 3: return "🥉";
        default: return `#${rank}`;
    }
};

export const CompactCreatorCard = ({ creator, rank }: CompactCreatorCardProps) => {
    const diamantes = creator.diamantes || 0;
    const dias = creator.dias_live || 0;
    const horas = creator.horas_live || 0;

    return (
        <Card className="neo-card-sm hover:shadow-lg transition-all cursor-pointer group">
            <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{getMedalEmoji(rank)}</span>
                        <div>
                            <h3 className="font-bold text-sm group-hover:text-primary transition-colors">
                                {creator.nombre}
                            </h3>
                            <p className="text-xs text-muted-foreground">{creator.categoria || "Sin categoría"}</p>
                        </div>
                    </div>
                    {creator.telefono && (
                        <a
                            href={`https://wa.me/${creator.telefono.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-green-500 hover:text-green-600 transition-colors"
                        >
                            <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                    )}
                </div>

                <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">💎 Diamantes</span>
                        <span className="font-bold text-sm text-accent">{diamantes.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">📅 {dias} días</span>
                        <span className="text-muted-foreground">⏰ {horas.toFixed(1)}h</span>
                    </div>
                </div>

                {creator.hito_diamantes && (
                    <Badge variant="outline" className="mt-2 w-full justify-center text-xs py-0.5">
                        🎯 Hito: {(creator.hito_diamantes / 1000).toFixed(0)}K
                    </Badge>
                )}
            </CardContent>
        </Card>
    );
};

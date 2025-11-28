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
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">{getMedalEmoji(rank)}</span>
                        <div>
                            <h3 className="font-bold text-base group-hover:text-primary transition-colors">
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
                            <MessageCircle className="h-4 w-4" />
                        </a>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">💎 Diamantes</span>
                        <span className="font-bold text-accent">{diamantes.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">📅 {dias} días</span>
                        <span className="text-muted-foreground">⏰ {horas.toFixed(1)}h</span>
                    </div>
                </div>

                {creator.hito_diamantes && (
                    <Badge variant="outline" className="mt-3 w-full justify-center text-xs">
                        🎯 Hito: {(creator.hito_diamantes / 1000).toFixed(0)}K
                    </Badge>
                )}
            </CardContent>
        </Card>
    );
};

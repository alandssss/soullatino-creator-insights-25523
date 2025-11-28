import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Target, Award } from "lucide-react";

interface BonificacionesSummaryCardProps {
    monto: number;
    metaRecomendada?: string;
    probabilidad?: number;
    nivel?: string;
}

export const BonificacionesSummaryCard = ({
    monto,
    metaRecomendada,
    probabilidad,
    nivel
}: BonificacionesSummaryCardProps) => {
    const getProbabilityColor = (prob: number) => {
        if (prob >= 80) return "text-green-500";
        if (prob >= 50) return "text-yellow-500";
        return "text-red-500";
    };

    return (
        <Card className="neo-card-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Award className="h-4 w-4 text-accent" />
                    Bonificación Estimada
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Monto
                    </span>
                    <span className="font-bold text-2xl text-green-500">
                        ${monto.toLocaleString()}
                    </span>
                </div>

                {metaRecomendada && (
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            Meta Recomendada
                        </span>
                        <Badge variant="outline" className="font-semibold">
                            {metaRecomendada}
                        </Badge>
                    </div>
                )}

                {probabilidad !== undefined && (
                    <div className="pt-2 border-t border-border/50">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Probabilidad</span>
                            <span className={`text-sm font-bold ${getProbabilityColor(probabilidad)}`}>
                                {probabilidad.toFixed(0)}%
                            </span>
                        </div>
                        <div className="h-2 neo-input rounded-full overflow-hidden mt-2">
                            <div
                                className={`h-full transition-all duration-500 ${probabilidad >= 80 ? 'bg-green-500' :
                                        probabilidad >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                style={{ width: `${probabilidad}%` }}
                            />
                        </div>
                    </div>
                )}

                {nivel && (
                    <Badge className="w-full justify-center mt-2" variant="secondary">
                        Nivel: {nivel}
                    </Badge>
                )}
            </CardContent>
        </Card>
    );
};

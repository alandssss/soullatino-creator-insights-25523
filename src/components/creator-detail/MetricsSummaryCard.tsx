import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar, Clock } from "lucide-react";

interface MetricsSummaryCardProps {
    diamantes: number;
    dias: number;
    horas: number;
    meta?: number;
}

export const MetricsSummaryCard = ({ diamantes, dias, horas, meta }: MetricsSummaryCardProps) => {
    const progress = meta ? (diamantes / meta) * 100 : 0;

    return (
        <Card className="neo-card-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Métricas del Mes
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">💎 Diamantes</span>
                    <span className="font-bold text-lg text-accent">{diamantes.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Días Live
                    </span>
                    <span className="font-semibold">{dias}</span>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Horas Live
                    </span>
                    <span className="font-semibold">{horas.toFixed(1)}h</span>
                </div>

                {meta && meta > 0 && (
                    <div className="pt-2 border-t border-border/50">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-muted-foreground">Progreso a Meta</span>
                            <span className="text-xs font-semibold">{progress.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 neo-input rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

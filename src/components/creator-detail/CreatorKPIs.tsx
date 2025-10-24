import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface CreatorKPIsProps {
  dailyStats: any[];
  monthlyGrowth: {
    diamantes: number;
    seguidores: number;
    engagement: number;
  };
}

export function CreatorKPIs({ dailyStats, monthlyGrowth }: CreatorKPIsProps) {
  const totals = useMemo(() => {
    return dailyStats.reduce(
      (acc, stat) => ({
        diamantes: acc.diamantes + (stat.diamantes || 0),
        horas: acc.horas + (stat.duracion_live_horas || 0),
        dias: acc.dias + (stat.dias_validos_live || 0),
        seguidores: acc.seguidores + (stat.nuevos_seguidores || 0),
      }),
      { diamantes: 0, horas: 0, dias: 0, seguidores: 0 }
    );
  }, [dailyStats]);

  const getTrendIcon = (value: number) => {
    if (value > 5) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (value < -5) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Diamantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totals.diamantes.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            {getTrendIcon(monthlyGrowth.diamantes)}
            <span>{monthlyGrowth.diamantes > 0 ? "+" : ""}{monthlyGrowth.diamantes.toFixed(1)}%</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Horas Live
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totals.horas.toFixed(1)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Este mes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Días Live
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totals.dias}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Este mes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Nuevos Seguidores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totals.seguidores.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            {getTrendIcon(monthlyGrowth.seguidores)}
            <span>{monthlyGrowth.seguidores > 0 ? "+" : ""}{monthlyGrowth.seguidores.toFixed(1)}%</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

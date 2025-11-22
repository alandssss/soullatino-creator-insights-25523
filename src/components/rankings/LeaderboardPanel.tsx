import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Medal, Crown, Award, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { getCreatorDisplayName } from "@/utils/creator-display";

interface RankingData {
  creator_id: string;
  nombre: string;
  tiktok_username: string;
  manager: string;
  ranking_position: number;
  diamantes_periodo: number;
  horas_periodo: number;
  dias_periodo: number;
  puntos_gamificacion: number;
  categoria: string;
}

const POSITION_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32', '#3b82f6', '#8b5cf6'];

const getPositionIcon = (position: number) => {
  switch (position) {
    case 1: return <Crown className="h-5 w-5 text-yellow-500" />;
    case 2: return <Medal className="h-5 w-5 text-gray-400" />;
    case 3: return <Award className="h-5 w-5 text-amber-600" />;
    default: return <Trophy className="h-4 w-4 text-muted-foreground" />;
  }
};

const getPositionColor = (position: number) => {
  if (position <= 3) return POSITION_COLORS[position - 1];
  if (position <= 10) return POSITION_COLORS[3];
  return POSITION_COLORS[4];
};

export function LeaderboardPanel() {
  const [periodo, setPeriodo] = useState<'semanal' | 'mensual'>('semanal');
  const [isCalculating, setIsCalculating] = useState(false);

  const { data: rankings, isLoading, refetch } = useQuery({
    queryKey: ['rankings', periodo],
    queryFn: async () => {
      // Obtener el ranking más reciente del periodo seleccionado
      const { data, error } = await supabase
        .from('creator_rankings')
        .select('*')
        .eq('periodo_tipo', periodo)
        .order('periodo_inicio', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Agrupar por periodo más reciente
      const rankingsByPeriodo = new Map<string, RankingData[]>();
      
      for (const r of data || []) {
        const key = r.periodo_inicio;
        if (!rankingsByPeriodo.has(key)) {
          rankingsByPeriodo.set(key, []);
        }
        rankingsByPeriodo.get(key)!.push(r as any);
      }

      // Obtener el periodo más reciente
      const periodos = Array.from(rankingsByPeriodo.keys()).sort().reverse();
      const periodoReciente = periodos[0];
      
      const rankingsRecientes = rankingsByPeriodo.get(periodoReciente) || [];
      
      return rankingsRecientes.sort((a, b) => a.ranking_position - b.ranking_position);
    }
  });

  const handleCalculateRankings = async () => {
    setIsCalculating(true);
    try {
      const { error } = await supabase.functions.invoke('calculate-rankings', {
        body: { periodo }
      });

      if (error) throw error;

      await refetch();
    } catch (error) {
      console.error('Error calculando rankings:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const top10 = rankings?.slice(0, 10) || [];
  const chartData = top10.map(r => ({
    nombre: getCreatorDisplayName({ tiktok_username: r.tiktok_username, nombre: r.nombre, creator_id: r.creator_id }),
    diamantes: r.diamantes_periodo,
    position: r.ranking_position
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <CardTitle>🏆 Leaderboard de Creadores</CardTitle>
            </div>
            <button
              onClick={handleCalculateRankings}
              disabled={isCalculating}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isCalculating ? 'Calculando...' : '🔄 Actualizar Rankings'}
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={periodo} onValueChange={(v) => setPeriodo(v as any)}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="semanal">
                <Zap className="h-4 w-4 mr-2" />
                Ranking Semanal
              </TabsTrigger>
              <TabsTrigger value="mensual">
                <TrendingUp className="h-4 w-4 mr-2" />
                Ranking Mensual
              </TabsTrigger>
            </TabsList>

            <TabsContent value={periodo}>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Cargando rankings...
                </div>
              ) : rankings?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No hay rankings calculados</p>
                  <button
                    onClick={handleCalculateRankings}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                  >
                    Calcular Rankings
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Gráfica Top 10 */}
                  <div className="bg-card/50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Crown className="h-5 w-5 text-yellow-500" />
                      Top 10 Mejores Creadores
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="nombre" 
                          angle={-45} 
                          textAnchor="end" 
                          height={80}
                          className="text-xs"
                        />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          formatter={(value: number) => value.toLocaleString() + ' 💎'}
                        />
                        <Bar dataKey="diamantes" radius={[8, 8, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getPositionColor(entry.position)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Lista de Rankings */}
                  <div className="space-y-2">
                    {rankings?.map((ranking) => (
                      <Card key={ranking.creator_id} className={`
                        transition-all hover:shadow-lg
                        ${ranking.categoria === 'top10' ? 'border-2 border-yellow-500/50 bg-yellow-500/5' : ''}
                      `}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Posición */}
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-card border-2" style={{ borderColor: getPositionColor(ranking.ranking_position) }}>
                              <span className="text-xl font-bold" style={{ color: getPositionColor(ranking.ranking_position) }}>
                                {ranking.ranking_position}
                              </span>
                            </div>

                            {/* Icono de posición */}
                            <div>
                              {getPositionIcon(ranking.ranking_position)}
                            </div>

                            {/* Info del creador */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-lg">{getCreatorDisplayName({ tiktok_username: ranking.tiktok_username, nombre: ranking.nombre, creator_id: ranking.creator_id })}</h4>
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                <span>👥 {ranking.manager}</span>
                                <span>💎 {ranking.diamantes_periodo.toLocaleString()}</span>
                                <span>⏰ {ranking.horas_periodo.toFixed(1)}h</span>
                                <span>📅 {ranking.dias_periodo} días</span>
                              </div>
                            </div>

                            {/* Puntos de gamificación */}
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">Puntos</div>
                              <div className="text-xl font-bold text-primary">
                                {ranking.puntos_gamificacion.toLocaleString()}
                              </div>
                            </div>

                            {/* Badge de categoría */}
                            {ranking.categoria === 'top10' && (
                              <Badge variant="default" className="bg-yellow-500 text-white">
                                <Crown className="h-3 w-3 mr-1" />
                                Top 10
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

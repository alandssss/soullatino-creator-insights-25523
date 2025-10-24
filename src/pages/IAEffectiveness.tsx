import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, TrendingUp, Target } from 'lucide-react';

export default function IAEffectiveness() {
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const { data, error } = await supabase
      .from('v_ia_effectiveness')
      .select('*')
      .order('mes', { ascending: false });

    if (data) setStats(data);
  };

  const latestMonth = stats[0] || {};
  const liftDifference = (latestMonth.lift_promedio_seguidas || 0) - (latestMonth.lift_promedio_no_seguidas || 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Efectividad de Recomendaciones IA</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5" />
              Recomendaciones Seguidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{latestMonth.recomendaciones_seguidas || 0}</p>
            <p className="text-sm text-muted-foreground">
              vs {latestMonth.recomendaciones_ignoradas || 0} ignoradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Lift Promedio (Seguidas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-500">
              +{(latestMonth.lift_promedio_seguidas || 0).toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground">Mejora en diamantes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-primary" />
              Diferencia de Impacto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              +{liftDifference.toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground">
              Seguidas vs No seguidas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla histórica */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico Mensual</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Mes</th>
                <th className="text-right p-2">Seguidas</th>
                <th className="text-right p-2">Lift (Seguidas)</th>
                <th className="text-right p-2">Lift (No seguidas)</th>
                <th className="text-right p-2">Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((row) => (
                <tr key={row.mes} className="border-b hover:bg-muted/50">
                  <td className="p-2">{new Date(row.mes).toLocaleDateString('es-MX', { year: 'numeric', month: 'long' })}</td>
                  <td className="text-right p-2">{row.recomendaciones_seguidas}</td>
                  <td className="text-right p-2 text-green-500">+{row.lift_promedio_seguidas?.toFixed(1)}%</td>
                  <td className="text-right p-2">{row.lift_promedio_no_seguidas?.toFixed(1)}%</td>
                  <td className="text-right p-2 font-bold text-primary">
                    +{((row.lift_promedio_seguidas || 0) - (row.lift_promedio_no_seguidas || 0)).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Target, 
  AlertCircle 
} from 'lucide-react';

interface GraduationKPI {
  total_nuevos: number;
  graduados_100k_mas: number;
  graduados_300k_mas: number;
  graduados_500k_mas: number;
  pct_graduacion_100k: number;
  pct_graduacion_300k: number;
  pct_graduacion_500k: number;
  estado_objetivo_100k: 'CUMPLIDO' | 'PENDIENTE';
  brecha_porcentual_100k: number;
}

export function KPIGraduacionNuevos() {
  const [kpi, setKpi] = useState<GraduationKPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadKPI();
  }, []);

  const loadKPI = async () => {
    try {
      // @snapshot: Get latest snapshot date
      const { data: latestSnap } = await supabase
        .from('creator_daily_stats')
        .select('fecha')
        .order('fecha', { ascending: false })
        .limit(1)
        .single();

      if (!latestSnap) {
        setError('No hay snapshot diario');
        setLoading(false);
        return;
      }

      const snapshotDate = latestSnap.fecha;
      
      const { data: snapshotStats } = await supabase
        .from('creator_daily_stats')
        .select('creator_id')
        .eq('fecha', snapshotDate);

      const snapshotIds = (snapshotStats || []).map(s => s.creator_id);

      // Get creators from snapshot (active only)
      const { data: creators } = await supabase
        .from('creators')
        .select('id, dias_en_agencia, status')
        .in('id', snapshotIds)
        .eq('status', 'activo');

      if (!creators) {
        setError('No hay creadores en snapshot');
        setLoading(false);
        return;
      }

      // Filter nuevos (≤90 days)
      const nuevos = creators.filter(c => (c.dias_en_agencia || 0) <= 90);
      const nuevosIds = nuevos.map(c => c.id);

      // Get bonificaciones for current month (nuevos only)
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
      const { data: bonifs } = await supabase
        .from('creator_bonificaciones')
        .select('creator_id, diam_live_mes')
        .eq('mes_referencia', currentMonth)
        .in('creator_id', nuevosIds);

      // Calculate graduations
      const graduados100k = bonifs?.filter(b => (b.diam_live_mes || 0) >= 100000).length || 0;
      const graduados300k = bonifs?.filter(b => (b.diam_live_mes || 0) >= 300000).length || 0;
      const graduados500k = bonifs?.filter(b => (b.diam_live_mes || 0) >= 500000).length || 0;

      const pct100k = nuevos.length > 0 ? (graduados100k * 100) / nuevos.length : 0;
      const pct300k = nuevos.length > 0 ? (graduados300k * 100) / nuevos.length : 0;
      const pct500k = nuevos.length > 0 ? (graduados500k * 100) / nuevos.length : 0;

      const objetivo = 4.0;
      const brecha = pct100k - objetivo;

      setKpi({
        total_nuevos: nuevos.length,
        graduados_100k_mas: graduados100k,
        graduados_300k_mas: graduados300k,
        graduados_500k_mas: graduados500k,
        pct_graduacion_100k: Math.round(pct100k * 100) / 100,
        pct_graduacion_300k: Math.round(pct300k * 100) / 100,
        pct_graduacion_500k: Math.round(pct500k * 100) / 100,
        estado_objetivo_100k: pct100k >= objetivo ? 'CUMPLIDO' : 'PENDIENTE',
        brecha_porcentual_100k: Math.round(brecha * 100) / 100
      });

      console.log(`[KPIGraduacionNuevos] Snapshot: ${snapshotDate}, Nuevos: ${nuevos.length}, Graduados 100K+: ${graduados100k}`);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading graduation KPI:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="neo-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !kpi) {
    return (
      <Card className="neo-card border-destructive/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">Error cargando KPI: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const objetivo = 4.0;
  const cumplido = kpi.estado_objetivo_100k === 'CUMPLIDO';
  const statusColor = cumplido ? 'text-green-500' : 'text-destructive';
  const statusIcon = cumplido ? TrendingUp : TrendingDown;
  const StatusIcon = statusIcon;

  // Calcular progreso hacia objetivo (máximo 100%)
  const progressToGoal = Math.min((kpi.pct_graduacion_100k / objetivo) * 100, 100);

  return (
    <Card className="rounded-2xl border-2 border-border/50 border-l-4 border-l-orange-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Award className="h-5 w-5 text-orange-500" />
            Graduación Creadores Nuevos
          </CardTitle>
          <Badge 
            variant={cumplido ? "default" : "destructive"}
            className="text-xs"
          >
            {cumplido ? '✅ CUMPLIDO' : '⚠️ PENDIENTE'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Creadores con ≤90 días que alcanzaron ≥100K diamantes
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Métrica Principal */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-4xl font-extrabold text-foreground">
              {kpi.pct_graduacion_100k}%
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Target className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Objetivo: <span className="font-semibold">{objetivo}%</span>
              </p>
            </div>
          </div>

          {/* Indicador de Brecha */}
          <div className={`flex items-center gap-1 ${statusColor}`}>
            <StatusIcon className="h-6 w-6" />
            <span className="text-2xl font-bold">
              {kpi.brecha_porcentual_100k > 0 ? '+' : ''}
              {kpi.brecha_porcentual_100k}%
            </span>
          </div>
        </div>

        {/* Barra de Progreso */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progreso hacia objetivo</span>
            <span>{progressToGoal.toFixed(0)}%</span>
          </div>
          <Progress 
            value={progressToGoal} 
            className="h-2"
          />
        </div>

        {/* Estadísticas Detalladas */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Nuevos</p>
            <p className="text-2xl font-bold">{kpi.total_nuevos}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Graduados 100K+</p>
            <p className="text-2xl font-bold text-green-500">
              {kpi.graduados_100k_mas}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Graduados 300K+</p>
            <p className="text-lg font-semibold text-blue-500">
              {kpi.graduados_300k_mas}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Graduados 500K+</p>
            <p className="text-lg font-semibold text-purple-500">
              {kpi.graduados_500k_mas}
            </p>
          </div>
        </div>

        {/* Mensaje de Acción */}
        <div className={`p-3 rounded-lg ${cumplido ? 'bg-green-500/10 border border-green-500/30' : 'bg-destructive/10 border border-destructive/30'}`}>
          <p className={`text-xs font-medium ${cumplido ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
            {cumplido 
              ? `¡Excelente! Estás ${Math.abs(kpi.brecha_porcentual_100k).toFixed(1)} puntos por encima del objetivo.`
              : `Necesitas ${Math.ceil((objetivo - kpi.pct_graduacion_100k) * kpi.total_nuevos / 100)} creadores más para alcanzar el objetivo del ${objetivo}%.`
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

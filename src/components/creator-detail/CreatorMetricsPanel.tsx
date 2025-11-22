import { useState, useEffect } from 'react';
import { NeoCard } from '@/components/neo/NeoCard';
import { NeoKPICard } from '@/components/neo/NeoKPICard';
import { creatorMetricsService } from '@/services/creatorMetricsService';
import { CreatorMetrics } from '@/types/creatorMetrics';
import { CreatorTrendsChart } from './CreatorTrendsChart';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, Gem, TrendingUp, Target, Eye, Loader2 } from 'lucide-react';

interface CreatorMetricsPanelProps {
  creatorId: string;
  creatorName: string;
}

export function CreatorMetricsPanel({ creatorId, creatorName }: CreatorMetricsPanelProps) {
  const [metrics, setMetrics] = useState<CreatorMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonthData, setCurrentMonthData] = useState<any[]>([]);
  const [previousMonthData, setPreviousMonthData] = useState<any[]>([]);
  
  useEffect(() => {
    loadMetrics();
    loadDailyData();
  }, [creatorId]);
  
  const loadMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await creatorMetricsService.getMetrics(creatorId);
      setMetrics(data);
    } catch (err: any) {
      console.error('Error cargando métricas:', err);
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const loadDailyData = async () => {
    try {
      const today = new Date();
      const currentMonth = today.toISOString().slice(0, 7);
      const [year, month] = currentMonth.split('-').map(Number);
      
      // Mes actual
      const firstDayCurrent = `${year}-${String(month).padStart(2, '0')}-01`;
      const todayStr = today.toISOString().split('T')[0];
      
      const { data: current } = await supabase
        .from('creator_daily_stats')
        .select('fecha, diamantes, duracion_live_horas')
        .eq('creator_id', creatorId)
        .gte('fecha', firstDayCurrent)
        .lte('fecha', todayStr)
        .order('fecha', { ascending: true });
      
      // Mes anterior
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const firstDayPrev = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
      const lastDayPrev = new Date(prevYear, prevMonth, 0).toISOString().split('T')[0];
      
      const { data: previous } = await supabase
        .from('creator_daily_stats')
        .select('fecha, diamantes, duracion_live_horas')
        .eq('creator_id', creatorId)
        .gte('fecha', firstDayPrev)
        .lte('fecha', lastDayPrev)
        .order('fecha', { ascending: true });
      
      setCurrentMonthData(current || []);
      setPreviousMonthData(previous || []);
    } catch (err) {
      console.error('Error cargando datos diarios:', err);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Cargando métricas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <NeoCard variant="flat" padding="lg">
        <div className="text-center py-8">
          <p className="text-destructive font-semibold mb-2">Error al cargar métricas</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </NeoCard>
    );
  }
  
  if (!metrics) {
    return (
      <NeoCard variant="flat" padding="lg">
        <div className="text-center py-8">
          <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No hay métricas disponibles</p>
        </div>
      </NeoCard>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <NeoKPICard
          label="Días Live MTD"
          value={metrics.liveDays_mtd}
          delta={{
            value: metrics.deltaLiveDays,
            direction: metrics.deltaLiveDays >= 0 ? 'up' : 'down',
            label: 'vs. mes anterior'
          }}
          insight={`Promedio ${(metrics.liveHours_mtd / Math.max(1, metrics.liveDays_mtd)).toFixed(1)}h/día`}
          icon={Calendar}
        />
        
        <NeoKPICard
          label="Horas Live MTD"
          value={`${metrics.liveHours_mtd.toFixed(1)}h`}
          delta={{
            value: metrics.deltaLiveHours,
            direction: metrics.deltaLiveHours >= 0 ? 'up' : 'down'
          }}
          icon={Clock}
        />
        
        <NeoKPICard
          label="Diamantes MTD"
          value={metrics.diamonds_mtd.toLocaleString()}
          delta={{
            value: metrics.deltaDiamondsPercent,
            direction: metrics.deltaDiamondsPercent >= 0 ? 'up' : 'down',
            label: '%'
          }}
          insight={`Proyección EOM: ${metrics.prediction.diamonds_eom.toLocaleString()}`}
          icon={Gem}
          variant="primary"
        />
      </div>
      
      {/* Panel de hitos */}
      <NeoCard variant="elevated" padding="lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Próximos Hitos
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {/* Hito Diamantes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">💎 Diamantes</span>
              <span className="font-semibold">{(metrics.nextMilestones.diamonds.target / 1000).toFixed(0)}K</span>
            </div>
            <div className="h-2 bg-neo-pressed rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                style={{ 
                  width: `${Math.min(100, ((metrics.diamonds_mtd / metrics.nextMilestones.diamonds.target) * 100)).toFixed(0)}%` 
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Faltan {(metrics.nextMilestones.diamonds.remaining / 1000).toFixed(0)}K
              {metrics.nextMilestones.diamonds.etaDays < 999 && (
                <span> • ETA {metrics.nextMilestones.diamonds.etaDays} días</span>
              )}
            </p>
          </div>
          
          {/* Hito Días */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">📅 Días</span>
              <span className="font-semibold">{metrics.nextMilestones.liveDays.target}d</span>
            </div>
            <div className="h-2 bg-neo-pressed rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all"
                style={{ 
                  width: `${Math.min(100, ((metrics.liveDays_mtd / metrics.nextMilestones.liveDays.target) * 100)).toFixed(0)}%` 
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Faltan {metrics.nextMilestones.liveDays.remaining} días
            </p>
          </div>
          
          {/* Hito Horas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">⏰ Horas</span>
              <span className="font-semibold">{metrics.nextMilestones.liveHours.target}h</span>
            </div>
            <div className="h-2 bg-neo-pressed rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all"
                style={{ 
                  width: `${Math.min(100, ((metrics.liveHours_mtd / metrics.nextMilestones.liveHours.target) * 100)).toFixed(0)}%` 
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Faltan {metrics.nextMilestones.liveHours.remaining.toFixed(1)}h
            </p>
          </div>
        </div>
      </NeoCard>
      
      {/* Gráfico de Tendencias */}
      {currentMonthData.length > 0 && (
        <CreatorTrendsChart 
          currentMonthData={currentMonthData}
          previousMonthData={previousMonthData}
        />
      )}

      {/* Predicción */}
      <NeoCard variant="flat" padding="md">
        <div className="flex items-start gap-3">
          <TrendingUp className="h-5 w-5 text-accent shrink-0 mt-1" />
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-2">📊 Proyección Fin de Mes</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Días</p>
                <p className="font-bold">{metrics.prediction.liveDays_eom}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Horas</p>
                <p className="font-bold">{metrics.prediction.liveHours_eom}h</p>
              </div>
              <div>
                <p className="text-muted-foreground">Diamantes</p>
                <p className="font-bold">{metrics.prediction.diamonds_eom.toLocaleString()}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Método: {metrics.prediction.method} • Confianza: {(metrics.prediction.confidence * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </NeoCard>
      
      {/* Supervisión */}
      {metrics.supervisionFlags.hasSupervision && (
        <NeoCard variant="flat" padding="md">
          <div className="flex items-start gap-3">
            <div className={`h-3 w-3 rounded-full shrink-0 mt-1 ${
              metrics.supervisionFlags.riskLevel === 'verde' ? 'bg-green-500' :
              metrics.supervisionFlags.riskLevel === 'amarillo' ? 'bg-yellow-500' :
              'bg-red-500'
            }`} />
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">🔍 Bajo Supervisión</h4>
              <p className="text-xs text-muted-foreground">
                Última revisión: {new Date(metrics.supervisionFlags.lastReviewAt!).toLocaleDateString()} • 
                Supervisor: {metrics.supervisionFlags.lastSupervisor}
              </p>
              {metrics.supervisionFlags.notes && (
                <p className="text-xs mt-1">{metrics.supervisionFlags.notes}</p>
              )}
            </div>
          </div>
        </NeoCard>
      )}
    </div>
  );
}

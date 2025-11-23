import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, Calendar, Clock, Target, Gem } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { NeoKPICard } from '@/components/neo/NeoKPICard';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CreatorTrendsChart } from './CreatorTrendsChart';
import { calculateAllMilestones, getMilestoneSummary } from '@/services/milestonesService';
import { calculateEOMPrediction, getPredictionSummary } from '@/services/predictiveAnalysis';
import { formatMetrics } from '@/utils/formatMetrics';

interface CreatorMetricsPanelProps {
  creatorId: string;
  creatorName: string;
}

export function CreatorMetricsPanel({ creatorId, creatorName }: CreatorMetricsPanelProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonthData, setCurrentMonthData] = useState<any[]>([]);
  const [previousMonthData, setPreviousMonthData] = useState<any[]>([]);
  
  // Métricas MTD calculadas
  const [liveDaysMTD, setLiveDaysMTD] = useState(0);
  const [liveHoursMTD, setLiveHoursMTD] = useState(0);
  const [diamondsMTD, setDiamondsMTD] = useState(0);
  
  // Deltas vs mes anterior
  const [deltaLiveDays, setDeltaLiveDays] = useState(0);
  const [deltaLiveHours, setDeltaLiveHours] = useState(0);
  const [deltaDiamonds, setDeltaDiamonds] = useState(0);
  const [deltaDiamondsPercent, setDeltaDiamondsPercent] = useState(0);
  
  // Flags de supervisión
  const [hasSupervision, setHasSupervision] = useState(false);
  const [lastSupervisor, setLastSupervisor] = useState<string | null>(null);
  const [lastReviewAt, setLastReviewAt] = useState<string | null>(null);
  const [riskLevel, setRiskLevel] = useState<'verde' | 'amarillo' | 'rojo' | null>(null);

  useEffect(() => {
    if (creatorId) {
      loadMetrics();
      loadDailyData();
    }
  }, [creatorId]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Métricas MTD del mes actual
      const { data: currentStats } = await supabase
        .from('creator_daily_stats')
        .select('diamantes, duracion_live_horas, dias_validos_live')
        .eq('creator_id', creatorId)
        .gte('fecha', currentMonthStart.toISOString().split('T')[0]);

      // Métricas del mes anterior completo
      const { data: previousStats } = await supabase
        .from('creator_daily_stats')
        .select('diamantes, duracion_live_horas, dias_validos_live')
        .eq('creator_id', creatorId)
        .gte('fecha', previousMonthStart.toISOString().split('T')[0])
        .lte('fecha', previousMonthEnd.toISOString().split('T')[0]);

      // Calcular MTD (usar Math.max porque son valores acumulados, no diarios)
      const currentDiamonds = Math.max(...(currentStats || []).map(s => s.diamantes || 0), 0);
      const currentHours = Math.max(...(currentStats || []).map(s => s.duracion_live_horas || 0), 0);
      const currentDays = Math.max(...(currentStats || []).map(s => s.dias_validos_live || 0), 0);

      // Calcular mes anterior completo (también con Math.max)
      const prevDiamonds = Math.max(...(previousStats || []).map(s => s.diamantes || 0), 0);
      const prevHours = Math.max(...(previousStats || []).map(s => s.duracion_live_horas || 0), 0);
      const prevDays = Math.max(...(previousStats || []).map(s => s.dias_validos_live || 0), 0);

      setLiveDaysMTD(currentDays);
      setLiveHoursMTD(currentHours);
      setDiamondsMTD(currentDiamonds);

      setDeltaLiveDays(currentDays - prevDays);
      setDeltaLiveHours(currentHours - prevHours);
      setDeltaDiamonds(currentDiamonds - prevDiamonds);
      setDeltaDiamondsPercent(prevDiamonds > 0 ? ((currentDiamonds - prevDiamonds) / prevDiamonds) * 100 : 0);
      
      // Supervision flags
      const { data: supervisionData } = await supabase
        .from('supervision_live_logs')
        .select('observer_name, created_at, riesgo')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (supervisionData) {
        setHasSupervision(true);
        setLastSupervisor(supervisionData.observer_name);
        setLastReviewAt(supervisionData.created_at);
        setRiskLevel(supervisionData.riesgo as any);
      }
      
    } catch (error: any) {
      console.error('Error cargando métricas:', error);
      setError(error.message || 'Error al cargar métricas');
    } finally {
      setLoading(false);
    }
  };

  const loadDailyData = async () => {
    try {
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const { data: currentData } = await supabase
        .from('creator_daily_stats')
        .select('fecha, diamantes, duracion_live_horas, dias_validos_live')
        .eq('creator_id', creatorId)
        .gte('fecha', currentMonthStart.toISOString().split('T')[0])
        .order('fecha', { ascending: true });

      const { data: previousData } = await supabase
        .from('creator_daily_stats')
        .select('fecha, diamantes, duracion_live_horas, dias_validos_live')
        .eq('creator_id', creatorId)
        .gte('fecha', previousMonthStart.toISOString().split('T')[0])
        .lte('fecha', previousMonthEnd.toISOString().split('T')[0])
        .order('fecha', { ascending: true });

      setCurrentMonthData(currentData || []);
      setPreviousMonthData(previousData || []);
    } catch (error) {
      console.error('Error loading daily data:', error);
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
      <Card className="glass-card">
        <CardContent className="py-12 text-center">
          <p className="text-destructive font-semibold mb-2">Error al cargar métricas</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Calcular hitos y predicción
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysElapsed = now.getDate();
  const daysRemaining = Math.max(0, daysInMonth - daysElapsed);

  const milestones = calculateAllMilestones(
    diamondsMTD || 0,
    liveDaysMTD || 0,
    liveHoursMTD || 0,
    daysInMonth,
    daysRemaining
  );

  const prediction = calculateEOMPrediction(
    diamondsMTD || 0,
    liveDaysMTD || 0,
    liveHoursMTD || 0,
    daysElapsed,
    daysInMonth
  );

  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NeoKPICard
          label="Días Live MTD"
          value={formatMetrics.days(liveDaysMTD)}
          delta={{
            value: deltaLiveDays,
            direction: deltaLiveDays >= 0 ? 'up' : 'down',
            label: 'vs mes anterior'
          }}
          insight={`${deltaLiveDays >= 0 ? 'Mejorando' : 'Bajó'} respecto al mes pasado`}
          icon={Calendar}
        />
        
        <NeoKPICard
          label="Horas Live MTD"
          value={formatMetrics.hours(liveHoursMTD)}
          delta={{
            value: deltaLiveHours,
            direction: deltaLiveHours >= 0 ? 'up' : 'down',
            label: 'horas'
          }}
          insight={`${deltaLiveHours >= 0 ? 'Más horas' : 'Menos horas'} que el mes pasado`}
          icon={Clock}
        />
        
        <NeoKPICard
          label="Diamantes MTD"
          value={formatMetrics.diamonds(diamondsMTD)}
          delta={{
            value: deltaDiamondsPercent,
            direction: deltaDiamondsPercent >= 0 ? 'up' : 'down',
            label: '%'
          }}
          insight={formatMetrics.percentage(deltaDiamondsPercent) + ' vs mes anterior'}
          icon={Gem}
          variant="primary"
        />
      </div>

      {/* Próximos Hitos */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Próximos Hitos
          </CardTitle>
          <p className="text-sm text-muted-foreground">{getMilestoneSummary(milestones)}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Hito de Diamantes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium flex items-center gap-2">
                💎 Diamantes
                <Badge variant={milestones.diamonds.achieved ? "default" : "secondary"}>
                  {milestones.diamonds.current >= 1_000_000 ? '1M+' : `${(milestones.diamonds.current / 1000).toFixed(0)}K`}
                </Badge>
              </span>
              <span className="text-muted-foreground">
                {milestones.diamonds.achieved 
                  ? '¡Meta máxima alcanzada!' 
                  : `Próximo: ${(milestones.diamonds.next! / 1000).toFixed(0)}K`}
              </span>
            </div>
            {!milestones.diamonds.achieved && (
              <>
                <Progress value={milestones.diamonds.progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Faltan: {formatMetrics.abbreviated(milestones.diamonds.remaining!)}</span>
                  {milestones.diamonds.eta && <span>ETA: {milestones.diamonds.eta} días</span>}
                </div>
              </>
            )}
          </div>

          {/* Hito de Días Live */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Días Live
                <Badge variant={milestones.days.achieved ? "default" : "secondary"}>
                  {milestones.days.current}
                </Badge>
              </span>
              <span className="text-muted-foreground">
                {milestones.days.achieved 
                  ? '¡Meta alcanzada!' 
                  : `Próximo: ${milestones.days.next} días`}
              </span>
            </div>
            {!milestones.days.achieved && (
              <>
                <Progress value={milestones.days.progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Faltan: {milestones.days.remaining}</span>
                  {milestones.days.eta && <span>ETA: {milestones.days.eta} días</span>}
                </div>
              </>
            )}
          </div>

          {/* Hito de Horas Live */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Horas Live
                <Badge variant={milestones.hours.achieved ? "default" : "secondary"}>
                  {formatMetrics.hours(milestones.hours.current)}
                </Badge>
              </span>
              <span className="text-muted-foreground">
                {milestones.hours.achieved 
                  ? '¡Meta alcanzada!' 
                  : `Próximo: ${milestones.hours.next}h`}
              </span>
            </div>
            {!milestones.hours.achieved && (
              <>
                <Progress value={milestones.hours.progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Faltan: {formatMetrics.hours(milestones.hours.remaining!)}</span>
                  {milestones.hours.eta && <span>ETA: {milestones.hours.eta} días</span>}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de tendencias */}
      {currentMonthData.length > 0 && (
        <CreatorTrendsChart 
          currentMonthData={currentMonthData}
          previousMonthData={previousMonthData}
        />
      )}

      {/* Predicción de fin de mes */}
      <Card className="glass-card border-primary/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Predicción Fin de Mes
          </CardTitle>
          <p className="text-sm text-muted-foreground">{getPredictionSummary(prediction)}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {prediction ? (
            <>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Diamantes proyectados</span>
                <span className="font-semibold">{formatMetrics.diamonds(prediction.diamonds)} 💎</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Días proyectados</span>
                <span className="font-semibold">{formatMetrics.days(prediction.days)}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Horas proyectadas</span>
                <span className="font-semibold">{formatMetrics.hours(prediction.hours)}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <span>Método: {prediction.method}</span>
                  <Badge variant={
                    prediction.confidence === 'high' ? 'default' :
                    prediction.confidence === 'medium' ? 'secondary' : 'outline'
                  }>
                    {prediction.confidence === 'high' ? 'Alta confianza' :
                     prediction.confidence === 'medium' ? 'Confianza media' : 'Confianza baja'}
                  </Badge>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay suficientes datos para proyectar (se necesitan al menos 3 días con actividad)
            </p>
          )}
        </CardContent>
      </Card>

      {/* Supervisión (si aplica) */}
      {hasSupervision && (
        <Card className="glass-card border-yellow-500/30">
          <CardHeader>
            <CardTitle className="text-lg">⚠️ Bajo Supervisión</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Última revisión</span>
              <span>{formatMetrics.date(lastReviewAt!)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Supervisor</span>
              <span>{lastSupervisor}</span>
            </div>
            {riskLevel && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Nivel de riesgo</span>
                <Badge variant={
                  riskLevel === 'rojo' ? 'destructive' :
                  riskLevel === 'amarillo' ? 'secondary' : 'default'
                }>
                  {riskLevel.toUpperCase()}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

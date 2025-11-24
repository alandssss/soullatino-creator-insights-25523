import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { NeoCard } from '@/components/neo/NeoCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TrendingUp } from 'lucide-react';

interface DailyData {
  fecha: string;
  diamantes: number;
  duracion_live_horas: number;
}

interface CreatorTrendsChartProps {
  currentMonthData: DailyData[];
  previousMonthData: DailyData[];
}

export function CreatorTrendsChart({ currentMonthData, previousMonthData }: CreatorTrendsChartProps) {
  const [metric, setMetric] = useState<'diamonds' | 'hours' | 'days'>('diamonds');

  // Preparar datos para el gráfico - calcular deltas diarios
  const prepareChartData = () => {
    const maxDays = Math.max(currentMonthData.length, previousMonthData.length);
    const chartData = [];

    for (let day = 1; day <= maxDays; day++) {
      const currentDay = currentMonthData[day - 1];
      const prevDayData = currentMonthData[day - 2]; // Día anterior del mismo mes
      const prevMonthDay = previousMonthData[day - 1];
      const prevMonthDayBefore = previousMonthData[day - 2];

      const dataPoint: any = {
        day: `Día ${day}`,
      };

      if (metric === 'diamonds') {
        // Calcular incremento diario (delta entre valores acumulados)
        const currentDelta = day === 1 
          ? (currentDay?.diamantes || 0)
          : (currentDay?.diamantes || 0) - (prevDayData?.diamantes || 0);
        
        const prevDelta = day === 1
          ? (prevMonthDay?.diamantes || 0)
          : (prevMonthDay?.diamantes || 0) - (prevMonthDayBefore?.diamantes || 0);
        
        dataPoint.mesActual = Math.max(0, currentDelta);
        dataPoint.mesAnterior = Math.max(0, prevDelta);
        
      } else if (metric === 'hours') {
        // Calcular incremento diario de horas
        const currentDelta = day === 1
          ? (currentDay?.duracion_live_horas || 0)
          : (currentDay?.duracion_live_horas || 0) - (prevDayData?.duracion_live_horas || 0);
        
        const prevDelta = day === 1
          ? (prevMonthDay?.duracion_live_horas || 0)
          : (prevMonthDay?.duracion_live_horas || 0) - (prevMonthDayBefore?.duracion_live_horas || 0);
        
        dataPoint.mesActual = parseFloat(Math.max(0, currentDelta).toFixed(1));
        dataPoint.mesAnterior = parseFloat(Math.max(0, prevDelta).toFixed(1));
        
      } else {
        // Para días, contar acumulativo (esto está correcto)
        const currentActiveDays = currentMonthData.slice(0, day).filter(d => 
          (d.diamantes || 0) > 0 || (d.duracion_live_horas || 0) >= 1.0
        ).length;
        const prevActiveDays = previousMonthData.slice(0, day).filter(d => 
          (d.diamantes || 0) > 0 || (d.duracion_live_horas || 0) >= 1.0
        ).length;
        
        dataPoint.mesActual = currentActiveDays;
        dataPoint.mesAnterior = prevActiveDays;
      }

      chartData.push(dataPoint);
    }

    return chartData;
  };

  const chartData = prepareChartData();

  const getMetricLabel = () => {
    switch (metric) {
      case 'diamonds': return 'Diamantes';
      case 'hours': return 'Horas';
      case 'days': return 'Días Activos';
    }
  };

  const formatYAxis = (value: number) => {
    if (metric === 'diamonds') {
      return value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toString();
    }
    return value.toString();
  };

  return (
    <NeoCard variant="elevated" padding="lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            Evolución Diaria - {getMetricLabel()}
          </h3>
        </div>

        <Tabs value={metric} onValueChange={(v) => setMetric(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="diamonds">💎 Diamantes</TabsTrigger>
            <TabsTrigger value="hours">⏰ Horas</TabsTrigger>
            <TabsTrigger value="days">📅 Días</TabsTrigger>
          </TabsList>

          <TabsContent value={metric} className="mt-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="day" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={formatYAxis}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend 
                  wrapperStyle={{ 
                    paddingTop: '20px',
                    fontSize: '14px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="mesActual" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Mes Actual"
                  dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="mesAnterior" 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Mes Anterior"
                  dot={{ fill: 'hsl(var(--muted-foreground))', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>

            <p className="text-xs text-muted-foreground text-center mt-4">
              {metric === 'days' 
                ? 'Comparación acumulativa de días con actividad' 
                : 'Comparación diaria del mes actual vs mes anterior'}
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </NeoCard>
  );
}

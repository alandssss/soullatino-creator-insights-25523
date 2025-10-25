import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Creator {
  id: string;
  nombre: string;
  diamantes: number;
  hito_diamantes: number;
}

interface SimpleBarChartProps {
  creators: Creator[];
  title?: string;
}

export function SimpleBarChart({ creators, title = "Top 10 Creadores - Diamantes" }: SimpleBarChartProps) {
  const data = creators.slice(0, 10).map(c => ({
    name: c.nombre.substring(0, 10),
    diamantes: c.diamantes || 0,
    hito: c.hito_diamantes || 0,
  }));

  const getColor = (hito: number) => {
    if (hito >= 300000) return "hsl(var(--chart-1))";
    if (hito >= 100000) return "hsl(var(--chart-2))";
    return "hsl(var(--chart-3))";
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">💎</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Bar dataKey="diamantes" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.hito)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--chart-3))' }} />
            <span>&lt; 100k</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
            <span>100k - 300k</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
            <span>&gt; 300k</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

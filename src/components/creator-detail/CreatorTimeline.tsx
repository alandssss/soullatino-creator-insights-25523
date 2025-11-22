import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Phone, MessageSquare, Target, Eye, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TimelineEvent {
  id: string;
  tipo: 'whatsapp' | 'llamada' | 'meta' | 'supervision' | 'nota';
  fecha: string;
  usuario: string;
  detalles: string;
  metadata?: any;
}

interface CreatorTimelineProps {
  creatorId: string;
}

const ICONS = {
  whatsapp: MessageSquare,
  llamada: Phone,
  meta: Target,
  supervision: Eye,
  nota: FileText,
};

const COLORS = {
  whatsapp: 'text-green-500 bg-green-500/10 border-green-500/30',
  llamada: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
  meta: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
  supervision: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
  nota: 'text-slate-500 bg-slate-500/10 border-slate-500/30',
};

export function CreatorTimeline({ creatorId }: CreatorTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadTimeline();
  }, [creatorId]);

  const loadTimeline = async () => {
    setLoading(true);
    try {
      const [interactions, supervisions] = await Promise.all([
        supabase
          .from('creator_interactions')
          .select('*')
          .eq('creator_id', creatorId)
          .order('created_at', { ascending: false })
          .limit(50),
        
        supabase
          .from('supervision_live_logs')
          .select('*')
          .eq('creator_id', creatorId)
          .order('fecha_evento', { ascending: false })
          .limit(20),
      ]);

      const timelineEvents: TimelineEvent[] = [];

      interactions.data?.forEach(i => {
        timelineEvents.push({
          id: i.id,
          tipo: i.tipo as any,
          fecha: i.created_at,
          usuario: i.admin_nombre || 'Sistema',
          detalles: i.notas || '',
          metadata: i,
        });
      });

      supervisions.data?.forEach(s => {
        timelineEvents.push({
          id: s.id,
          tipo: 'supervision',
          fecha: s.fecha_evento || s.created_at,
          usuario: s.observer_name || 'Supervisor',
          detalles: s.notas || `Supervisión en vivo - Riesgo: ${s.riesgo}`,
          metadata: s,
        });
      });

      timelineEvents.sort((a, b) => 
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );

      setEvents(timelineEvents);
    } catch (error) {
      console.error('Error cargando timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(e => e.tipo === filter);

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground mt-4">Cargando timeline...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>Timeline de Interacciones</CardTitle>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              Todos ({events.length})
            </Button>
            {Object.keys(ICONS).map(tipo => {
              const count = events.filter(e => e.tipo === tipo).length;
              if (count === 0) return null;
              return (
                <Button
                  key={tipo}
                  size="sm"
                  variant={filter === tipo ? 'default' : 'outline'}
                  onClick={() => setFilter(tipo)}
                  className="text-xs"
                >
                  {tipo} ({count})
                </Button>
              );
            })}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay eventos en el timeline</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-white/10" />
              
              <div className="space-y-6">
                {filteredEvents.map((event, index) => {
                  const Icon = ICONS[event.tipo];
                  const colorClass = COLORS[event.tipo];
                  
                  return (
                    <div key={event.id} className="relative flex gap-4 animate-slide-in" style={{ animationDelay: `${index * 50}ms` }}>
                      <div className={cn(
                        "relative z-10 flex-shrink-0",
                        "w-12 h-12 rounded-full border-2",
                        "flex items-center justify-center",
                        colorClass
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      <Card className="flex-1 glass-card-hover">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={colorClass}>
                                {event.tipo}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                por <span className="font-semibold">{event.usuario}</span>
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(event.fecha), "dd MMM yyyy, HH:mm", { locale: es })}
                            </span>
                          </div>
                          
                          <p className="text-sm">{event.detalles}</p>
                          
                          {event.metadata && event.tipo === 'supervision' && event.metadata.riesgo && (
                            <div className="mt-3 pt-3 border-t border-white/10 text-xs text-muted-foreground">
                              <span>Riesgo: <span className="font-semibold">{event.metadata.riesgo}</span></span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { 
  Award, 
  TrendingUp, 
  Calendar,
  User,
  MessageCircle
} from 'lucide-react';

interface NuevoCreador {
  id: string;
  nombre: string;
  tiktok_username: string;
  dias_en_agencia: number;
  manager: string;
  telefono: string;
  diam_live_mes: number;
  dias_live_mes: number;
  horas_live_mes: number;
  nivel_graduacion: string;
  graduado: boolean;
  progreso_100k_pct: number;
  faltan_para_100k: number;
}

export function NuevosCreadoresDetailPanel() {
  const [creadores, setCreadores] = useState<NuevoCreador[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todos' | 'graduados' | 'cerca'>('todos');

  useEffect(() => {
    loadCreadores();
  }, []);

  const loadCreadores = async () => {
    try {
      const { data, error } = await supabase
        .from('v_nuevos_creadores_detalle')
        .select('*');

      if (error) throw error;
      setCreadores(data || []);
    } catch (err) {
      console.error('Error loading nuevos creadores:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCreadores = creadores.filter(c => {
    if (filter === 'graduados') return c.graduado;
    if (filter === 'cerca') {
      const cercaDias = c.dias_live_mes >= 20 && c.dias_live_mes < 30;
      const cercaProgreso = c.progreso_100k_pct >= 70 && c.progreso_100k_pct < 100;
      return (cercaDias || cercaProgreso) && !c.graduado;
    }
    return true;
  });

  const handleWhatsApp = (telefono: string, nombre: string) => {
    if (!telefono) return;
    
    const phoneNumber = telefono.replace(/[^0-9]/g, '');
    const finalNumber = phoneNumber.length === 10 ? `52${phoneNumber}` : phoneNumber;
    const message = encodeURIComponent(`Hola ${nombre}, ¡sigue así! Estás muy cerca de tu graduación 🎓💎`);
    window.open(`https://wa.me/${finalNumber}?text=${message}`, '_blank');
  };

  return (
    <Card className="rounded-2xl border-2 border-border/50" id="nuevos-creadores-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Detalle de Creadores Nuevos (≤90 días)
          </CardTitle>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={filter === 'todos' ? 'default' : 'outline'}
              onClick={() => setFilter('todos')}
            >
              Todos ({creadores.length})
            </Button>
            <Button
              size="sm"
              variant={filter === 'graduados' ? 'default' : 'outline'}
              onClick={() => setFilter('graduados')}
            >
              Graduados ({creadores.filter(c => c.graduado).length})
            </Button>
            <Button
              size="sm"
              variant={filter === 'cerca' ? 'default' : 'outline'}
              onClick={() => setFilter('cerca')}
            >
              Cerca ({creadores.filter(c => {
                const cercaDias = c.dias_live_mes >= 20 && c.dias_live_mes < 30;
                const cercaProgreso = c.progreso_100k_pct >= 70 && c.progreso_100k_pct < 100;
                return (cercaDias || cercaProgreso) && !c.graduado;
              }).length})
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCreadores.map((creator) => (
              <div
                key={creator.id}
                className="p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Info del Creador */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{creator.nombre}</h4>
                      {creator.graduado && (
                        <Badge className="bg-green-500">
                          <Award className="h-3 w-3 mr-1" />
                          {creator.nivel_graduacion}
                        </Badge>
                      )}
                      <Badge variant="outline">
                        <Calendar className="h-3 w-3 mr-1" />
                        {creator.dias_en_agencia} días
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>@{creator.tiktok_username}</span>
                      {creator.manager && (
                        <span>Manager: {creator.manager}</span>
                      )}
                    </div>

                    {/* Progreso hacia 100K */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>
                          {creator.diam_live_mes?.toLocaleString() || 0} / 100,000 diamantes
                        </span>
                        <span className="font-semibold">
                          {creator.progreso_100k_pct.toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={creator.progreso_100k_pct} 
                        className="h-2"
                      />
                      {!creator.graduado && (
                        <p className="text-xs text-muted-foreground">
                          Faltan {creator.faltan_para_100k.toLocaleString()} diamantes
                        </p>
                      )}
                    </div>

                    {/* Métricas Adicionales */}
                    <div className="flex gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">Días:</span>{' '}
                        <span className="font-semibold">{creator.dias_live_mes}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Horas:</span>{' '}
                        <span className="font-semibold">{creator.horas_live_mes?.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col gap-2">
                    {creator.telefono && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleWhatsApp(creator.telefono, creator.nombre)}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        WhatsApp
                      </Button>
                    )}
                    {!creator.graduado && creator.progreso_100k_pct >= 70 && (
                      <Button size="sm" variant="default">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        Priorizar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredCreadores.length === 0 && (
              <div className="text-center p-8 text-muted-foreground">
                <p>No hay creadores en esta categoría</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CreatorSupervisionHistoryProps {
  creatorId: string;
}

interface SupervisionLog {
  id: string;
  fecha_evento: string;
  en_vivo: boolean;
  en_batalla: boolean;
  buena_iluminacion: boolean;
  audio_claro: boolean;
  set_profesional: boolean;
  cumple_normas: boolean;
  score: number;
  riesgo: string;
  reporte?: string;
  observer_name?: string;
}

export function CreatorSupervisionHistory({ creatorId }: CreatorSupervisionHistoryProps) {
  const [logs, setLogs] = useState<SupervisionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadLogs();
  }, [creatorId]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('supervision_live_logs')
        .select('*')
        .eq('creator_id', creatorId)
        .order('fecha_evento', { ascending: false })
        .limit(5);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error cargando logs de supervisión:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFull = () => {
    navigate(`/supervision-live?creatorId=${creatorId}`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-purple-500" />
            Supervisión en Vivo
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleViewFull}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver completo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No hay registros de supervisión</p>
            <p className="text-xs mt-1">Los registros aparecerán cuando se supervise al creador</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="p-4 rounded-lg border bg-card/50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {new Date(log.fecha_evento).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.fecha_evento).toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {log.observer_name && ` • ${log.observer_name}`}
                    </p>
                  </div>
                  <Badge variant={
                    log.riesgo === 'verde' ? 'default' :
                    log.riesgo === 'amarillo' ? 'secondary' :
                    'destructive'
                  } className="text-lg">
                    {log.riesgo === 'verde' ? '🟢' : log.riesgo === 'amarillo' ? '🟡' : '🔴'}
                    {log.score}
                  </Badge>
                </div>
                
                <div className="flex gap-2 flex-wrap mb-3">
                  {log.en_vivo && (
                    <Badge variant="outline" className="text-[10px]">
                      🔴 EN VIVO
                    </Badge>
                  )}
                  {log.en_batalla && (
                    <Badge variant="outline" className="text-[10px]">
                      ⚔️ BATALLA
                    </Badge>
                  )}
                  {log.buena_iluminacion && (
                    <Badge variant="outline" className="text-[10px] bg-yellow-50 dark:bg-yellow-900/20">
                      💡 Luz
                    </Badge>
                  )}
                  {log.audio_claro && (
                    <Badge variant="outline" className="text-[10px] bg-blue-50 dark:bg-blue-900/20">
                      🔊 Audio
                    </Badge>
                  )}
                  {log.set_profesional && (
                    <Badge variant="outline" className="text-[10px] bg-purple-50 dark:bg-purple-900/20">
                      🎬 Set Pro
                    </Badge>
                  )}
                  {!log.cumple_normas && (
                    <Badge variant="destructive" className="text-[10px]">
                      ⚠️ Normas
                    </Badge>
                  )}
                </div>
                
                {log.reporte && (
                  <div className="p-2 rounded bg-muted/30 border border-border/50">
                    <p className="text-xs text-muted-foreground">
                      📋 {log.reporte}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Swords, Calendar, Clock, Users } from "lucide-react";
import { AddBattleDialog } from "./AddBattleDialog";

interface CreatorBattlesPanelProps {
  creatorId: string;
  creatorName: string;
}

interface Battle {
  id: string;
  fecha: string;
  hora: string;
  oponente: string;
  tipo: string;
  guantes: string;
  reto: string;
  notas?: string;
  estado: string;
  created_at: string;
}

export function CreatorBattlesPanel({ creatorId, creatorName }: CreatorBattlesPanelProps) {
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadBattles();
  }, [creatorId]);

  const loadBattles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('batallas')
        .select('*')
        .eq('creator_id', creatorId)
        .order('fecha', { ascending: false })
        .order('hora', { ascending: false })
        .limit(10);

      if (error) throw error;
      setBattles(data || []);
    } catch (error) {
      console.error('Error cargando batallas:', error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingBattles = battles.filter(b => {
    const battleDate = new Date(`${b.fecha}T${b.hora}`);
    return battleDate > new Date() && b.estado === 'programada';
  });

  const pastBattles = battles.filter(b => {
    const battleDate = new Date(`${b.fecha}T${b.hora}`);
    return battleDate <= new Date() || b.estado !== 'programada';
  });

  return (
    <div className="space-y-4">
      {/* Botón Agregar Batalla */}
      <Button 
        onClick={() => setDialogOpen(true)} 
        className="w-full gap-2"
        size="lg"
      >
        <Swords className="h-5 w-5" />
        Agregar Batalla Oficial
      </Button>

      {/* Próximas Batallas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-green-500" />
            Próximas Batallas ({upcomingBattles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingBattles.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No hay batallas programadas
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBattles.map((battle) => (
                <div key={battle.id} className="p-4 rounded-lg border bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-base flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        vs {battle.oponente}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(battle.fecha).toLocaleDateString('es-MX', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long' 
                        })}
                      </p>
                    </div>
                    <Badge variant="default" className="shrink-0">
                      <Clock className="h-3 w-3 mr-1" />
                      {battle.hora.slice(0, 5)}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap text-xs mt-2">
                    {battle.tipo && <Badge variant="outline">{battle.tipo}</Badge>}
                    {battle.guantes && <Badge variant="outline">🥊 {battle.guantes}</Badge>}
                    {battle.reto && <Badge variant="outline">🎯 {battle.reto}</Badge>}
                  </div>
                  
                  {battle.notas && (
                    <p className="text-xs text-muted-foreground mt-2 p-2 rounded bg-card/50">
                      📝 {battle.notas}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de Batallas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Swords className="h-5 w-5 text-muted-foreground" />
            Historial de Batallas ({pastBattles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pastBattles.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              Sin historial
            </div>
          ) : (
            <div className="space-y-2">
              {pastBattles.map((battle) => (
                <div key={battle.id} className="p-3 rounded-lg border bg-card/30 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">vs {battle.oponente}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(battle.fecha).toLocaleDateString('es-MX', { 
                        day: '2-digit', 
                        month: 'short' 
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px]">
                      {battle.estado}
                    </Badge>
                    {battle.tipo && (
                      <Badge variant="outline" className="text-[10px]">
                        {battle.tipo}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddBattleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        creatorId={creatorId}
        creatorName={creatorName}
        onBattleCreated={loadBattles}
      />
    </div>
  );
}

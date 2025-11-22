import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, DollarSign, CheckSquare, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ManagerKPI {
  manager_name: string;
  creator_count: number;
  potential_bonuses_saved: number;
  tasks_completed_week: number;
  last_interaction: string | null;
}

export function ManagerKPIsPanel() {
  const [managers, setManagers] = useState<ManagerKPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadManagerKPIs();
  }, []);

  const loadManagerKPIs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_manager_kpis');

      if (error) throw error;
      
      setManagers(data || []);
    } catch (error) {
      console.error('Error cargando KPIs de managers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (managers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No hay datos de managers disponibles</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {managers.map((manager, index) => {
        const initials = manager.manager_name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        const lastInteractionDays = manager.last_interaction
          ? Math.floor(
              (new Date().getTime() - new Date(manager.last_interaction).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : null;

        return (
          <Card 
            key={index}
            className={cn(
              "glass-card-hover",
              "group cursor-pointer",
              "animate-slide-in"
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-16 w-16 border-2 border-primary/30 group-hover:border-primary transition-colors">
                  <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-primary to-accent text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{manager.manager_name}</h3>
                  <Badge variant="outline" className="mt-1">
                    Manager
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-muted-foreground">Creadores</span>
                  </div>
                  <span className="font-bold">{manager.creator_count}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">Bonos Salvados</span>
                  </div>
                  <span className="font-bold text-green-500">
                    ${manager.potential_bonuses_saved.toFixed(0)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-purple-500" />
                    <span className="text-sm text-muted-foreground">Tareas (semana)</span>
                  </div>
                  <span className="font-bold">{manager.tasks_completed_week}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-muted-foreground">Última acción</span>
                  </div>
                  <span className={cn(
                    "text-sm font-semibold",
                    lastInteractionDays === null && "text-muted-foreground",
                    lastInteractionDays !== null && lastInteractionDays === 0 && "text-green-500",
                    lastInteractionDays !== null && lastInteractionDays <= 2 && "text-yellow-500",
                    lastInteractionDays !== null && lastInteractionDays > 2 && "text-red-500"
                  )}>
                    {lastInteractionDays === null 
                      ? 'Sin datos'
                      : lastInteractionDays === 0 
                        ? 'Hoy'
                        : `Hace ${lastInteractionDays}d`
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

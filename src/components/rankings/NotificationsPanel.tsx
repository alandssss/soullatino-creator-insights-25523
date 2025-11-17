import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, TrendingUp, TrendingDown, Award, Target, Check } from "lucide-react";
import { format } from "date-fns";

interface Notification {
  id: string;
  creator_id: string;
  tipo_notificacion: string;
  titulo: string;
  mensaje: string;
  metadata: any;
  leida: boolean;
  created_at: string;
  creators: {
    nombre: string;
    tiktok_username: string;
  };
}

export function NotificationsPanel() {
  const { data: notifications, refetch } = useQuery({
    queryKey: ['ranking-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ranking_notifications')
        .select(`
          *,
          creators!inner(nombre, tiktok_username)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Notification[];
    }
  });

  const handleMarkAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('ranking_notifications')
      .update({ leida: true })
      .eq('id', notificationId);

    if (!error) {
      refetch();
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'subida_ranking': return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'bajada_ranking': return <TrendingDown className="h-5 w-5 text-red-500" />;
      case 'cerca_top10': return <Target className="h-5 w-5 text-yellow-500" />;
      case 'nuevo_badge': return <Award className="h-5 w-5 text-purple-500" />;
      default: return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const unreadCount = notifications?.filter(n => !n.leida).length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5" />
            <CardTitle>Notificaciones de Ranking</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount} nuevas</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!notifications || notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No hay notificaciones</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <Card 
                key={notif.id}
                className={`transition-all ${!notif.leida ? 'bg-primary/5 border-primary/20' : 'opacity-60'}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getTipoIcon(notif.tipo_notificacion)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{notif.titulo}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{notif.mensaje}</p>
                          <div className="text-xs text-muted-foreground mt-2">
                            {notif.creators.nombre} (@{notif.creators.tiktok_username})
                          </div>
                        </div>
                        
                        {!notif.leida && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAsRead(notif.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground mt-2">
                        {format(new Date(notif.created_at), 'dd/MM/yyyy HH:mm')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Calendar } from "lucide-react";
import { format } from "date-fns";

interface BadgeData {
  id: string;
  creator_id: string;
  badge_tipo: string;
  badge_nivel: string | null;
  titulo: string;
  descripcion: string;
  icono: string;
  image_url: string | null;
  fecha_obtencion: string;
  metadata: any;
}

interface BadgesPanelProps {
  creatorId?: string;
  showAll?: boolean;
}

export function BadgesPanel({ creatorId, showAll = false }: BadgesPanelProps) {
  const { data: badges, isLoading } = useQuery({
    queryKey: ['badges', creatorId, showAll],
    queryFn: async () => {
      let query = supabase
        .from('creator_badges')
        .select(`
          *,
          creators!inner(nombre, tiktok_username)
        `)
        .order('fecha_obtencion', { ascending: false });

      if (!showAll && creatorId) {
        query = query.eq('creator_id', creatorId);
      }

      if (showAll) {
        query = query.limit(100);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as (BadgeData & { creators: { nombre: string; tiktok_username: string } })[];
    }
  });

  const getBadgeColor = (nivel: string | null) => {
    switch (nivel) {
      case 'platino': return 'from-slate-300 to-slate-500';
      case 'oro': return 'from-yellow-300 to-yellow-600';
      case 'plata': return 'from-gray-300 to-gray-500';
      case 'bronce': return 'from-amber-600 to-amber-800';
      default: return 'from-blue-400 to-blue-600';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Cargando logros...</div>
        </CardContent>
      </Card>
    );
  }

  if (!badges || badges.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No hay logros obtenidos aún</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          {showAll ? 'Últimos Logros Desbloqueados' : 'Mis Logros'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((badge) => (
            <Card 
              key={badge.id}
              className={`bg-gradient-to-br ${getBadgeColor(badge.badge_nivel)} border-2 border-white/20 overflow-hidden`}
            >
              <CardContent className="p-4 text-white">
                <div className="flex items-start justify-between mb-3">
                  {badge.image_url ? (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden shadow-lg">
                      <img 
                        src={badge.image_url} 
                        alt={badge.titulo}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden text-4xl absolute inset-0 flex items-center justify-center">
                        {badge.icono}
                      </div>
                    </div>
                  ) : (
                    <div className="text-4xl">{badge.icono}</div>
                  )}
                  {badge.badge_nivel && (
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      {badge.badge_nivel}
                    </Badge>
                  )}
                </div>
                
                <h4 className="font-bold text-lg mb-1">{badge.titulo}</h4>
                <p className="text-sm text-white/80 mb-3">{badge.descripcion}</p>
                
                {showAll && (
                  <div className="text-sm font-medium mb-2">
                    {badge.creators.nombre} (@{badge.creators.tiktok_username})
                  </div>
                )}
                
                <div className="flex items-center gap-1 text-xs text-white/70">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(badge.fecha_obtencion), 'dd/MM/yyyy')}
                </div>

                {badge.metadata?.ranking_position && (
                  <div className="mt-2 text-xs bg-white/10 rounded px-2 py-1">
                    Posición #{badge.metadata.ranking_position}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

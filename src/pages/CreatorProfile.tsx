import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreatorHeader } from '@/components/creator-detail/CreatorHeader';
import { CreatorBasicInfo } from '@/components/creator-detail/CreatorBasicInfo';
import { CreatorBonuses } from '@/components/creator-detail/CreatorBonuses';
import { CreatorMetricsPanel } from '@/components/creator-detail/CreatorMetricsPanel';
import { CreatorInteractions } from '@/components/creator-detail/CreatorInteractions';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type Creator = Tables<"creators">;
type Interaction = Tables<"creator_interactions">;

export default function CreatorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    
    const priority: Record<string, number> = { admin: 4, manager: 3, supervisor: 2, viewer: 1 };
    const sortedRoles = (rolesData || []).sort((a, b) => (priority[b.role] || 0) - (priority[a.role] || 0));
    
    setUserRole(sortedRoles[0]?.role || null);
  };

  useEffect(() => {
    if (id) {
      fetchCreator();
      fetchInteractions();
    }
  }, [id]);

  const fetchCreator = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      setCreator(data);
    } catch (error) {
      console.error("Error fetching creator:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil del creador",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInteractions = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("creator_interactions")
        .select("*")
        .eq("creator_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setInteractions(data || []);
    } catch (error) {
      console.error("Error fetching interactions:", error);
    }
  };

  const handleWhatsApp = () => {
    if (creator?.telefono) {
      const message = `Hola @${creator.tiktok_username || creator.nombre}! Tu manager de Soullatino aquí.`;
      window.open(`https://wa.me/${creator.telefono}?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleGenerateAI = () => {
    toast({
      title: "Generando consejos",
      description: "Esta funcionalidad estará disponible pronto",
    });
  };

  const handleAssignGoal = () => {
    toast({
      title: "Asignar meta",
      description: "Esta funcionalidad estará disponible pronto",
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 p-6">
        <Skeleton className="w-full h-96" />
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Creador no encontrado</h2>
          <Button onClick={() => navigate('/supervision')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Creadores
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <Button variant="outline" onClick={() => navigate('/supervision')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a Creadores
      </Button>

      {/* Header del Perfil */}
      <CreatorHeader 
        creator={creator} 
        onWhatsApp={handleWhatsApp}
        onGenerateAI={handleGenerateAI}
        onAssignGoal={handleAssignGoal}
        loadingAI={false}
        userRole={userRole}
      />

      {/* Tabs de Contenido */}
      <Tabs defaultValue="bonificaciones" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bonificaciones">Bonificaciones</TabsTrigger>
          <TabsTrigger value="metricas">Métricas</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>
        
        <TabsContent value="bonificaciones" className="mt-6">
          <CreatorBonuses
            creatorId={creator.id}
            creatorName={creator.nombre}
            tiktok_username={creator.tiktok_username || undefined}
          />
        </TabsContent>
        
        <TabsContent value="metricas" className="mt-6 space-y-6">
          <CreatorBasicInfo creator={creator} dailyStats={null} />
          <CreatorMetricsPanel creatorId={creator.id} creatorName={creator.nombre} />
        </TabsContent>
        
        <TabsContent value="historial" className="mt-6">
          <CreatorInteractions 
            creatorId={creator.id} 
            interactions={interactions}
            onInteractionAdded={fetchInteractions}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

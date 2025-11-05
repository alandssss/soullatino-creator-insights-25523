import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";
import PortalLayout from "@/components/portal/PortalLayout";
import PortalHeader from "@/components/portal/PortalHeader";
import UpcomingBattles from "@/components/portal/UpcomingBattles";
import BattleHistory from "@/components/portal/BattleHistory";
import EmptyBattles from "@/components/portal/EmptyBattles";

interface Creator {
  id: string;
  nombre: string;
  tiktok_username: string;
  status: string;
  manager?: string;
  telefono?: string;
}

interface Batalla {
  id: string;
  fecha: string;
  hora: string;
  oponente: string;
  tipo?: string;
  guantes?: string;
  reto?: string;
  notas?: string;
  estado: string;
}

export default function CreatorPortal() {
  const { username } = useParams<{ username: string }>();
  const [loading, setLoading] = useState(true);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [batallas, setBatallas] = useState<Batalla[]>([]);

  useEffect(() => {
    const loadCreatorData = async () => {
      if (!username) {
        setLoading(false);
        return;
      }

      try {
        // Buscar creador por username
        const { data: creatorData, error: creatorError } = await supabase
          .from('creators')
          .select('id, nombre, tiktok_username, status, manager, telefono')
          .eq('tiktok_username', username)
          .maybeSingle();

        if (creatorError) throw creatorError;
        if (!creatorData) {
          setLoading(false);
          return;
        }

        setCreator(creatorData);

        // Cargar batallas del creador
        const { data: batallasData, error: batallasError } = await supabase
          .from('batallas')
          .select('*')
          .eq('creator_id', creatorData.id)
          .in('estado', ['programada', 'completada', 'cancelada'])
          .order('fecha', { ascending: true })
          .order('hora', { ascending: true });

        if (batallasError) throw batallasError;
        setBatallas(batallasData || []);
      } catch (error) {
        console.error('Error loading creator data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCreatorData();
  }, [username]);

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PortalLayout>
    );
  }

  if (!creator) {
    return (
      <PortalLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AlertCircle className="h-16 w-16 text-destructive" />
          <h2 className="text-2xl font-bold">Creador no encontrado</h2>
          <p className="text-muted-foreground text-center px-4">
            Verifica que el username sea correcto
          </p>
        </div>
      </PortalLayout>
    );
  }

  const upcomingBattles = batallas.filter(b => b.estado === 'programada');
  const historyBattles = batallas.filter(b => ['completada', 'cancelada'].includes(b.estado));

  if (batallas.length === 0) {
    return (
      <PortalLayout>
        <PortalHeader creator={creator} />
        <EmptyBattles creatorName={creator.nombre} />
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <PortalHeader creator={creator} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingBattles batallas={upcomingBattles} />
        <BattleHistory batallas={historyBattles} />
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>¿Problemas con tus batallas? Contacta a tu manager</p>
        <p className="mt-2">© 2025 Soullatino</p>
      </div>
    </PortalLayout>
  );
}

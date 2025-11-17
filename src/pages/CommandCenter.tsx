import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { ActionCard } from "@/components/command-center/ActionCard";
import { AlertTriangle, Baby, Gem, DollarSign, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Alerta {
  creator_id: string;
  tiktok_username: string;
  nombre: string;
  telefono: string;
  manager: string;
  dias_en_agencia: number;
  texto_manager: string;
  faltan_300k: number;
  req_diam_por_dia_300k: number;
  dias_restantes: number;
  dias_live_mes: number;
  horas_live_mes: number;
  diam_live_mes: number;
  es_nuevo_menos_90_dias: boolean;
  es_prioridad_300k: boolean;
}

interface KPIs {
  acciones_prioritarias: number;
  nuevos_menos_90: number;
  diamantes_mes: number;
  bonos_generados: number;
}

const CommandCenter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [kpis, setKPIs] = useState<KPIs>({
    acciones_prioritarias: 0,
    nuevos_menos_90: 0,
    diamantes_mes: 0,
    bonos_generados: 0,
  });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Obtener nombre del usuario
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.email?.split("@")[0] || "Usuario");
      }

      // Mes actual
      const mesActual = new Date();
      const mesReferencia = `${mesActual.getFullYear()}-${String(
        mesActual.getMonth() + 1
      ).padStart(2, "0")}-01`;

      // Obtener alertas prioritarias
      const { data: bonificaciones, error: bonifError } = await supabase
        .from("creator_bonificaciones")
        .select(
          `
          *,
          creators!inner(
            id,
            tiktok_username,
            nombre,
            telefono,
            manager,
            dias_en_agencia
          )
        `
        )
        .eq("mes_referencia", mesReferencia)
        .or("cerca_de_objetivo.eq.true,es_prioridad_300k.eq.true")
        .order("es_nuevo_menos_90_dias", { ascending: false })
        .order("faltan_300k", { ascending: true })
        .limit(50);

      if (bonifError) throw bonifError;

      // Mapear datos
      const alertasMapeadas: Alerta[] = (bonificaciones || []).map((b: any) => ({
        creator_id: b.creator_id,
        tiktok_username: b.creators.tiktok_username,
        nombre: b.creators.nombre,
        telefono: b.creators.telefono,
        manager: b.creators.manager,
        dias_en_agencia: b.creators.dias_en_agencia,
        texto_manager: b.texto_manager || "Sin mensaje",
        faltan_300k: b.faltan_300k || 0,
        req_diam_por_dia_300k: b.req_diam_por_dia_300k || 0,
        dias_restantes: b.dias_restantes || 0,
        dias_live_mes: b.dias_live_mes || 0,
        horas_live_mes: b.horas_live_mes || 0,
        diam_live_mes: b.diam_live_mes || 0,
        es_nuevo_menos_90_dias: b.es_nuevo_menos_90_dias || false,
        es_prioridad_300k: b.es_prioridad_300k || false,
      }));

      setAlertas(alertasMapeadas);

      // Calcular KPIs
      const { data: allBonif } = await supabase
        .from("creator_bonificaciones")
        .select("diam_live_mes, bono_dias_extra_usd, bono_extra_usd, creators!inner(dias_en_agencia)")
        .eq("mes_referencia", mesReferencia);

      const nuevos = (allBonif || []).filter(
        (b: any) => b.creators.dias_en_agencia <= 90
      ).length;
      const diamantes = (allBonif || []).reduce(
        (sum: number, b: any) => sum + (b.diam_live_mes || 0),
        0
      );
      const bonos = (allBonif || []).reduce(
        (sum: number, b: any) =>
          sum + (b.bono_dias_extra_usd || 0) + (b.bono_extra_usd || 0),
        0
      );

      setKPIs({
        acciones_prioritarias: alertasMapeadas.length,
        nuevos_menos_90: nuevos,
        diamantes_mes: diamantes,
        bonos_generados: bonos,
      });
    } catch (error) {
      console.error("Error cargando datos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del Command Center",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (creatorId: string) => {
    navigate(`/creadores/${creatorId}`);
  };

  const handleSendWhatsApp = (alerta: Alerta) => {
    if (!alerta.telefono) {
      toast({
        title: "Sin teléfono",
        description: `El creador @${alerta.tiktok_username} no tiene teléfono registrado`,
        variant: "destructive",
      });
      return;
    }

    const message = encodeURIComponent(alerta.texto_manager);
    const whatsappUrl = `https://wa.me/${alerta.telefono.replace(/\D/g, "")}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(211,100%,50%)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Centro de Comando"
        description={`Buenos días, ${userName}`}
      />

      {/* KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Acciones Prioritarias</p>
                <p className="text-2xl font-bold text-white">{kpis.acciones_prioritarias}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Baby className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nuevos (&lt;90d)</p>
                <p className="text-2xl font-bold text-white">{kpis.nuevos_menos_90}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[hsl(45,100%,51%)]/10 rounded-lg">
                <Gem className="h-6 w-6 text-[hsl(45,100%,51%)]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Diamantes (Mes)</p>
                <p className="text-2xl font-bold text-white">
                  {(kpis.diamantes_mes / 1_000_000).toFixed(1)}M
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bonos Generados</p>
                <p className="text-2xl font-bold text-white">${kpis.bonos_generados.toFixed(0)} USD</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feed de Acciones */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Feed de Acciones Priorizadas</h2>
        {alertas.length === 0 ? (
          <Card className="bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)]">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                🎉 No hay acciones prioritarias en este momento
              </p>
            </CardContent>
          </Card>
        ) : (
          alertas.map((alerta) => (
            <ActionCard
              key={alerta.creator_id}
              alerta={alerta}
              onViewProfile={() => handleViewProfile(alerta.creator_id)}
              onSendWhatsApp={() => handleSendWhatsApp(alerta)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CommandCenter;

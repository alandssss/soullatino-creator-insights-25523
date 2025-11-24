import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tables } from "@/integrations/supabase/types";
import { CreatorDetailDialog } from "@/components/CreatorDetailDialog";
// Admin components moved to /admin page
import { LowActivityPanel } from "@/components/LowActivityPanel";
import DiamondsBars3D from "@/components/dashboard/DiamondsBars3D";
import TopPerformersCards from "@/components/dashboard/TopPerformersCards";
import { ManagerKPIsPanel } from "@/components/dashboard/ManagerKPIsPanel";
import { PriorityContactsPanel } from "@/components/dashboard/PriorityContactsPanel";
import { AlertTriangle, Users } from "lucide-react";

import { Suspense, lazy } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { startTour, shouldShowTour } from "@/lib/onboarding/tour-config";
import { KPIGraduacionNuevos } from "@/components/kpis/KPIGraduacionNuevos";
import { GraduacionAlert } from "@/components/kpis/GraduacionAlert";
import { isWebGLAvailable, getWebGLErrorMessage } from "@/utils/webglSupport";
import { WebGLFallback } from "@/components/dashboard/WebGLFallback";
import { WebGL3DErrorBoundary } from "@/components/dashboard/WebGL3DErrorBoundary";
import { SimpleBarChart } from "@/components/dashboard/SimpleBarChart";

type Creator = Tables<"creators">;

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [webGLSupported] = useState(isWebGLAvailable());
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (!loading && user) {
      const timer = setTimeout(() => {
        if (shouldShowTour('first-time')) {
          startTour('first-time');
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [loading, user]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
    } else {
      setUser(user);
      
      // Lectura robusta de rol
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role, created_at")
        .eq("user_id", user.id);
      
      // Priorizar roles: admin > manager > supervisor > viewer
      const priority: Record<string, number> = { admin: 4, manager: 3, supervisor: 2, viewer: 1 };
      const sortedRoles = (rolesData || []).sort((a, b) => (priority[b.role] || 0) - (priority[a.role] || 0));
      const userRoleValue = sortedRoles[0]?.role || null;
      
      setUserRole(userRoleValue);
      
      // Cargar stats reales del día
      await fetchDailyStats();
    }
    setLoading(false);
  };

  const fetchDailyStats = async () => {
    try {
      setLoading(true);
      
      // 1️⃣ Obtener snapshot date más reciente
      const { data: latestSnap } = await supabase
        .from('creator_daily_stats')
        .select('fecha')
        .order('fecha', { ascending: false })
        .limit(1)
        .single();

      if (!latestSnap) {
        setCreators([]);
        toast({
          title: "Sin snapshot diario",
          description: "No hay datos. Sube un Excel para comenzar.",
          variant: "default",
        });
        setLoading(false);
        return;
      }

      const snapshotDate = latestSnap.fecha;

      // 2️⃣ Obtener IDs del snapshot (exactamente 188)
      const { data: snapshotStats } = await supabase
        .from('creator_daily_stats')
        .select('creator_id')
        .eq('fecha', snapshotDate);

      const snapshotIds = [...new Set((snapshotStats || []).map(s => s.creator_id))];
      
      console.log(`[Dashboard] Snapshot: ${snapshotDate}, Creadores únicos del snapshot: ${snapshotIds.length}`);

      if (snapshotIds.length === 0) {
        setCreators([]);
        setLoading(false);
        return;
      }

      // 3️⃣ Obtener bonificaciones SOLO del snapshot
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
      const { data, error } = await supabase
        .from('creator_bonificaciones')
        .select(`
          creator_id,
          diam_live_mes,
          horas_live_mes,
          dias_live_mes,
          creators!inner(
            id,
            nombre,
            views,
            hito_diamantes,
            telefono,
            categoria
          )
        `)
        .eq('mes_referencia', currentMonth)
        .in('creator_id', snapshotIds)
        .order('diam_live_mes', { ascending: false });

      if (error) throw error;
      
      const creatorsFromBonificaciones = (data || []).map((item: any) => ({
        ...item.creators,
        diamantes: item.diam_live_mes || 0,
        dias_live: item.dias_live_mes || 0,
        horas_live: item.horas_live_mes || 0,
      }));
      
      // Deduplicar por creator.id
      const uniqueCreators = Array.from(
        new Map(creatorsFromBonificaciones.map(c => [c.id, c])).values()
      );

      setCreators(uniqueCreators);
      console.log(`[Dashboard] Creadores después del merge (únicos por ID): ${uniqueCreators.length}`);
      
    } catch (error) {
      console.error("Error loading bonificaciones:", error);
      toast({
        title: "Error cargando datos",
        description: "Problema al cargar las estadísticas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 container-safe">
      <PageHeader
        title="Dashboard Operativo"
        description="Visualización interactiva y métricas de alto impacto"
        sticky={false}
      />

      {/* Contactos Prioritarios */}
      <Card className="glass-card-elevated border-2 border-yellow-500/30 shadow-lg shadow-yellow-500/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              ⚡ A Quién Contactar HOY
            </CardTitle>
            <Badge variant="destructive" className="text-sm px-3 py-1">
              Urgente
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Creadores con mayor riesgo de perder bonificaciones este mes
          </p>
        </CardHeader>
        <CardContent>
          <PriorityContactsPanel />
        </CardContent>
      </Card>


        {/* Top Performers - Visual impact */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span>🏆</span>
            Top Performers del Mes
          </h2>
          {webGLSupported ? (
            <TopPerformersCards creators={creators} />
          ) : (
            <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
              Visualización 3D no disponible. Mostrando vista simplificada.
            </div>
          )}
        </div>

        {/* 3D Diamonds Chart - Interactive visualization with fallback */}
        {isMobile ? (
          <SimpleBarChart creators={creators} />
        ) : webGLSupported ? (
          <WebGL3DErrorBoundary>
            <Suspense fallback={
              <div className="flex items-center justify-center h-[500px] bg-card rounded-lg">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            }>
              <DiamondsBars3D creators={creators} />
            </Suspense>
          </WebGL3DErrorBoundary>
        ) : (
          <SimpleBarChart creators={creators} />
        )}

        {/* KPI Panels - Strategic metrics */}
        <GraduacionAlert />

        <KPIGraduacionNuevos />

        <LowActivityPanel />

        {/* KPIs por Manager */}
        {(userRole === 'admin' || userRole === 'manager') && (
          <Card className="glass-card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Productividad de Managers
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Desempeño de los managers del equipo este mes
              </p>
            </CardHeader>
            <CardContent>
              <ManagerKPIsPanel />
            </CardContent>
          </Card>
        )}

        <Card className="rounded-2xl border-2 border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold">Top Creadores</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Mostrando {creators.length} creadores únicos del snapshot
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {creators.map((creator, index) => (
                <button
                  key={creator.id}
                  onClick={() => {
                    setSelectedCreator(creator);
                    setDialogOpen(true);
                  }}
                  className="group w-full flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all border border-transparent hover:border-primary/30 cursor-pointer text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {creator.nombre}
                        </h3>
                        {creator.telefono && (
                          <a
                            href={`https://wa.me/${creator.telefono.replace(/[^0-9]/g, '').length === 10 ? '52' : ''}${creator.telefono.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-green-500 hover:text-green-600 transition-colors"
                            title="Abrir WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{creator.categoria || "Sin categoría"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-accent">{(creator.diamantes || 0).toLocaleString()} 💎</p>
                    <p className="text-sm text-muted-foreground">Hito: {((creator.hito_diamantes || 0) / 1000).toFixed(0)}K</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

      <CreatorDetailDialog
        creator={selectedCreator}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};

export default Dashboard;

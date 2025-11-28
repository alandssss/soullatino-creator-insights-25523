import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tables } from "@/integrations/supabase/types";
import { CreatorDetailDialog } from "@/components/CreatorDetailDialog";
// Admin components moved to /admin page
import { LowActivityPanel } from "@/components/LowActivityPanel";
import { ManagerKPIsPanel } from "@/components/dashboard/ManagerKPIsPanel";
import { PriorityContactsPanel } from "@/components/dashboard/PriorityContactsPanel";
import { AlertTriangle, Users } from "lucide-react";

import { Suspense, lazy, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { startTour, shouldShowTour } from "@/lib/onboarding/tour-config";
import { KPIGraduacionNuevos } from "@/components/kpis/KPIGraduacionNuevos";
import { GraduacionAlert } from "@/components/kpis/GraduacionAlert";
import { isWebGLAvailable } from "@/utils/webglSupport";
import { WebGLFallback } from "@/components/dashboard/WebGLFallback";
import { WebGL3DErrorBoundary } from "@/components/dashboard/WebGL3DErrorBoundary";
import { SimpleBarChart } from "@/components/dashboard/SimpleBarChart";
import { dedupeBy, normalizePhone, normalizeName } from "@/lib/dedupe";
import { CompactCreatorCard } from "@/components/dashboard/CompactCreatorCard";

// Lazy load heavy 3D components
const DiamondsBars3D = lazy(() => import("@/components/dashboard/DiamondsBars3D"));
const TopPerformersCards = lazy(() => import("@/components/dashboard/TopPerformersCards"));

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

      // Deduplicar por creator.id primero
      const uniqueCreatorsById = Array.from(
        new Map(creatorsFromBonificaciones.map(c => [c.id, c])).values()
      );

      // Aplicar deduplicación fuzzy (igual que CreatorsList)
      // Esto elimina duplicados que tienen diferente ID pero mismo nombre/teléfono
      const creatorsWithNorms = uniqueCreatorsById.map(c => ({
        ...c,
        phoneNorm: normalizePhone(c.telefono),
        nameNorm: normalizeName(c.nombre),
      }));

      const dedupedCreators = dedupeBy(creatorsWithNorms, c => c.phoneNorm || c.nameNorm);

      setCreators(dedupedCreators);

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

  // Hooks must be called before any early returns
  const topThree = useMemo(() => creators.slice(0, 3), [creators]);

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
    <div className="space-y-4 md:space-y-6 container-safe">
      <PageHeader
        title="Dashboard Operativo"
        description="Métricas clave y acciones prioritarias"
      />

      {/* KPIs Grid - 3 columnas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="neo-card-sm">
          <CardContent className="p-4">
            <KPIGraduacionNuevos />
          </CardContent>
        </Card>

        <Card className="neo-card-sm">
          <CardContent className="p-4">
            <LowActivityPanel />
          </CardContent>
        </Card>

        <Card className="glass-card-elevated border-2 border-yellow-500/30">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Contactar HOY
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <PriorityContactsPanel />
          </CardContent>
        </Card>
      </div>

      {/* Top 3 Performers - Horizontal Cards */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>🏆</span>
          Top 3 del Mes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topThree.map((creator, index) => (
            <div
              key={creator.id}
              onClick={() => {
                setSelectedCreator(creator);
                setDialogOpen(true);
              }}
            >
              <CompactCreatorCard creator={creator} rank={index + 1} />
            </div>
          ))}
        </div>
      </div>

      {/* 3D Chart - Más compacto */}
      {!isMobile && webGLSupported && (
        <WebGL3DErrorBoundary>
          <Suspense fallback={
            <div className="flex items-center justify-center h-[350px] bg-card rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          }>
            <div className="h-[350px]">
              <DiamondsBars3D creators={creators} />
            </div>
          </Suspense>
        </WebGL3DErrorBoundary>
      )}

      <GraduacionAlert />

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

      {/* Lista Completa - Tabla Compacta */}
      <Card className="neo-card-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Todos los Creadores</CardTitle>
          <p className="text-xs text-muted-foreground">
            {creators.length} creadores activos
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">#</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">Nombre</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-muted-foreground">💎 Diamantes</th>
                  <th className="text-center py-2 px-2 text-xs font-semibold text-muted-foreground hidden md:table-cell">📅 Días</th>
                  <th className="text-center py-2 px-2 text-xs font-semibold text-muted-foreground hidden md:table-cell">⏰ Horas</th>
                  <th className="text-center py-2 px-2 text-xs font-semibold text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {creators.map((creator, index) => (
                  <tr
                    key={creator.id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedCreator(creator);
                      setDialogOpen(true);
                    }}
                  >
                    <td className="py-2 px-2 text-sm font-medium">{index + 1}</td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{creator.nombre}</span>
                        {creator.telefono && (
                          <a
                            href={`https://wa.me/${creator.telefono.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-green-500 hover:text-green-600"
                          >
                            <MessageCircle className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{creator.categoria || "Sin categoría"}</p>
                    </td>
                    <td className="py-2 px-2 text-right font-bold text-accent text-sm">
                      {(creator.diamantes || 0).toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-center text-sm hidden md:table-cell">
                      {creator.dias_live || 0}
                    </td>
                    <td className="py-2 px-2 text-center text-sm hidden md:table-cell">
                      {(creator.horas_live || 0).toFixed(1)}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCreator(creator);
                          setDialogOpen(true);
                        }}
                      >
                        Ver
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

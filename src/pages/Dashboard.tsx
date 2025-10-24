import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Users, TrendingUp, Eye, Zap, LogOut, MessageCircle } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { CreatorDetailDialog } from "@/components/CreatorDetailDialog";
import { AdminUploadPanel } from "@/components/AdminUploadPanel";
import { AdminActivityPanel } from "@/components/AdminActivityPanel";
import { UserManagement } from "@/components/UserManagement";
import { LowActivityPanel } from "@/components/LowActivityPanel";
import { WorkTimeTracker } from "@/components/WorkTimeTracker";
import { StatCard } from "@/components/shared/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { startTour, shouldShowTour } from "@/lib/onboarding/tour-config";

type Creator = Tables<"creators">;

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
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
      // Obtener stats del día de hoy desde creator_daily_stats
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('creator_daily_stats')
        .select(`
          *,
          creators!inner(*)
        `)
        .eq('fecha', today)
        .order('diamantes', { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        // Convertir stats diarias a formato de creators
        const creatorsFromStats = data.map((stat: any) => {
          const creator = stat.creators;
          return {
            ...creator,
            diamantes: stat.diamantes || 0,
            horas_live: stat.duracion_live_horas || 0,
            dias_live: stat.dias_validos_live || 0,
          };
        });
        
        setCreators(creatorsFromStats);
      } else {
        // Fallback a tabla creators si no hay datos del día
        const { data: creatorsData } = await supabase
          .from("creators")
          .select("*")
          .order("diamantes", { ascending: false });
        
        setCreators(creatorsData || []);
      }
    } catch (error) {
      console.error('Error loading daily stats:', error);
      // Fallback silencioso a tabla creators
      const { data: creatorsData } = await supabase
        .from("creators")
        .select("*")
        .order("diamantes", { ascending: false });
      
      setCreators(creatorsData || []);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const totalCreators = creators.length;
  const totalDiamonds = creators.reduce((sum, c) => sum + (c.diamantes || 0), 0);
  const totalViews = creators.reduce((sum, c) => sum + (c.views || 0), 0);
  const avgHito = creators.reduce((sum, c) => sum + (c.hito_diamantes || 0), 0) / (creators.length || 1);

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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-primary to-primary/80 p-2">
              <TrendingUp className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Soullatino Analytics
              </h1>
              <p className="text-xs text-muted-foreground">Panel de Control</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-2 rounded-xl min-h-[40px] border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8">
        <PageHeader
          title="Dashboard"
          description="Resumen de métricas y rendimiento de tus creadores"
          sticky={false}
        />

        {userRole === "admin" && (
          <div className="space-y-8">
            <UserManagement />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AdminUploadPanel />
              <AdminActivityPanel />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Creadores"
            value={totalCreators}
            icon={Users}
            variant="primary"
          />
          <StatCard
            title="Total Diamantes"
            value={totalDiamonds.toLocaleString()}
            icon={Zap}
            variant="accent"
          />
          <StatCard
            title="Total Vistas"
            value={`${(totalViews / 1000000).toFixed(1)}M`}
            icon={Eye}
            variant="default"
          />
          <StatCard
            title="Hito Promedio"
            value={`${(avgHito / 1000).toFixed(0)}K`}
            icon={TrendingUp}
            variant="accent"
            subtitle="Diamantes"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OnboardingChecklist />
          <LowActivityPanel />
        </div>
        
        <WorkTimeTracker userEmail={user?.email} />

        <Card className="rounded-2xl border-2 border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold">Top Creadores</CardTitle>
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
      </main>

      <CreatorDetailDialog
        creator={selectedCreator}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};

export default Dashboard;

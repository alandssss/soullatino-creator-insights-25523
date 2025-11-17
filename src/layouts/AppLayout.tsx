import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Admin from "@/pages/Admin";
import Reclutamiento from "@/pages/Reclutamiento";
import SupervisionLive from "@/pages/SupervisionLive";
import AlertasSugerenciasPage from "@/pages/AlertasSugerencias";
import DebugTools from "@/pages/DebugTools";
import NotFound from "@/pages/NotFound";
import BrandingSettings from "@/pages/BrandingSettings";
import ScoringConfig from "@/pages/ScoringConfig";
import IAEffectiveness from "@/pages/IAEffectiveness";
import CommandCenter from "@/pages/CommandCenter";
import CreatorsCRM from "@/pages/CreatorsCRM";
import Campanas from "@/pages/Campanas";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import logo from "@/assets/logo-optimized.webp";

const AppLayout = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUserName(user.email?.split('@')[0] || 'Usuario');

    // Lectura robusta de rol
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("role, created_at")
      .eq("user_id", user.id);
    
    // Priorizar roles: admin > manager > supervisor > reclutador > viewer
    const priority: Record<string, number> = { admin: 5, manager: 4, supervisor: 3, reclutador: 2, viewer: 1 };
    const sortedRoles = (rolesData || []).sort((a, b) => (priority[b.role] || 0) - (priority[a.role] || 0));
    
    setUserRole(sortedRoles[0]?.role || null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[hsl(220,15%,11%)]">
        <AppSidebar userRole={userRole} />
        
        <main className="flex-1 overflow-y-auto">
          {/* Top Bar Global */}
          <header className="h-16 border-b border-[hsl(220,15%,22%)] bg-[hsl(220,15%,11%)]/95 backdrop-blur sticky top-0 z-40">
            <div className="flex items-center justify-between px-6 h-full">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div className="flex items-center gap-3">
                  <img 
                    src={logo} 
                    alt="Soullatino" 
                    className="h-8 w-8 object-contain" 
                  />
                  <span className="text-lg font-semibold text-white hidden md:block">
                    Soullatino Command Center
                  </span>
                </div>
              </div>
              
              {/* Usuario + Logout */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground hidden md:block">{userName}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Salir
                </Button>
              </div>
            </div>
          </header>
          
          {/* Content Area */}
          <div className="min-h-[calc(100vh-4rem)]">
            <Routes>
              <Route path="/" element={<CommandCenter />} />
              <Route path="/creadores" element={<CreatorsCRM />} />
              <Route path="/creadores/:id" element={<div className="p-6">Creator Profile (Coming soon)</div>} />
              <Route path="/campanas" element={<Navigate to="/campanas/batallas" replace />} />
              <Route path="/campanas/*" element={<Campanas />} />
              <Route path="/analitica/performance" element={<div className="p-6">Performance (Coming soon)</div>} />
              <Route path="/analitica/ia" element={<IAEffectiveness />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/supervision" element={<SupervisionLive />} />
              <Route path="/reclutamiento" element={<Reclutamiento />} />
              <Route path="/alertas" element={<AlertasSugerenciasPage />} />
              <Route path="/branding" element={<BrandingSettings />} />
              <Route path="/scoring" element={<ScoringConfig />} />
              <Route path="/debug" element={<DebugTools />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;

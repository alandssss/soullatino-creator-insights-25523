import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const AppLayout = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

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
    <div className="min-h-screen w-full flex overflow-x-hidden bg-gradient-to-br from-[#E8ECF0] via-[#F0F3F7] to-[#E8ECF0]">
      {/* Sidebar Desktop */}
      <AppSidebar userRole={userRole} />

      {/* Mobile Menu Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="md:hidden fixed top-4 left-4 z-50 neo-button bg-white/90 backdrop-blur-md border-border shadow-lg hover:bg-white hover:border-primary/30 transition-all"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="bg-white/95 backdrop-blur-xl border-r border-border w-[260px] max-w-[80vw] p-0"
        >
          <AppSidebar userRole={userRole} isMobile={true} />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar (minimal) */}
        <header className="border-b border-border bg-white/50 backdrop-blur-md sticky top-0 z-40">
          <div className="px-4 md:px-6 py-3 flex items-center justify-end gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="neo-button hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
            >
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Salir</span>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden">
          <div className="px-4 md:px-6 py-4 md:py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

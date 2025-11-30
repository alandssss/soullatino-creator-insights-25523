import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Upload, Users, Settings, TrendingUp, Activity } from "lucide-react";
import { UserManagement } from "@/components/UserManagement";
import { AdminUploadPanel } from "@/components/AdminUploadPanel";
import { AdminActivityPanel } from "@/components/AdminActivityPanel";
import BrandingSettings from "@/pages/BrandingSettings";
import ScoringConfig from "@/pages/ScoringConfig";
import IAEffectiveness from "@/pages/IAEffectiveness";
import { toast } from "sonner";
import { CreatorTable } from "@/components/CreatorTable";

export default function AdminPanel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    console.log('[Admin] 🔐 Verificando acceso...');

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      console.log('[Admin] Usuario:', user?.id);
      console.log('[Admin] Error auth:', authError);

      if (!user) {
        console.log('[Admin] ❌ Sin usuario, redirigiendo a login');
        navigate("/login");
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      console.log('[Admin] Rol obtenido:', roleData);
      console.log('[Admin] Error rol:', roleError);

      if (roleData?.role !== "admin") {
        console.log('[Admin] ❌ Rol insuficiente:', roleData?.role);
        toast.error("Acceso denegado. Solo administradores pueden acceder.");
        navigate("/");
        return;
      }

      console.log('[Admin] ✅ Acceso concedido');
      setUserRole(roleData.role);
    } catch (error) {
      console.error("[Admin] ❌ Error crítico:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userRole || userRole !== "admin") {
    return null;
  }

  return (
    <div className="container mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-4 md:mb-6">
        <Shield className="w-6 h-6 md:w-8 md:h-8 text-primary" />
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">Panel de Administración</h1>
          <p className="text-sm md:text-base text-muted-foreground">Gestión completa del sistema</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1 md:gap-2 mb-4 md:mb-6">
          <TabsTrigger value="users" className="gap-1 md:gap-2 text-xs md:text-sm">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Usuarios</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-1 md:gap-2 text-xs md:text-sm">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Carga</span>
          </TabsTrigger>
          <TabsTrigger value="creators" className="gap-1 md:gap-2 text-xs md:text-sm">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Creadores</span>
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-1 md:gap-2 text-xs md:text-sm">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Config</span>
          </TabsTrigger>
          <TabsTrigger value="ia" className="gap-1 md:gap-2 text-xs md:text-sm">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">IA</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1 md:gap-2 text-xs md:text-sm">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Actividad</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>
                Crear nuevos usuarios, asignar roles y gestionar contraseñas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Carga Masiva de Datos</CardTitle>
              <CardDescription>
                Importar creadores, teléfonos y datos desde archivos Excel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminUploadPanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="creators" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Creadores</CardTitle>
              <CardDescription>Lista paginada de creadores con edición básica</CardDescription>
            </CardHeader>
            <CardContent>
              <CreatorTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <BrandingSettings />
          <ScoringConfig />
        </TabsContent>

        <TabsContent value="ia" className="space-y-4">
          <IAEffectiveness />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actividad del Sistema</CardTitle>
              <CardDescription>
                Logs de WhatsApp, auditoría y actividad en tiempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminActivityPanel />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

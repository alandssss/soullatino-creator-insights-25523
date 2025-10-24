import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Upload, Users, Settings, TrendingUp, Activity } from "lucide-react";
import { UserManagement } from "@/components/UserManagement";
import { AdminUploadPanel } from "@/components/AdminUploadPanel";
import { AdminActivityPanel } from "@/components/AdminActivityPanel";
import { toast } from "sonner";

export default function AdminPanel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (roleData?.role !== "admin") {
        toast.error("Acceso denegado. Solo administradores pueden acceder.");
        navigate("/");
        return;
      }

      setUserRole(roleData.role);
    } catch (error) {
      console.error("Error checking admin access:", error);
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground">Gestión completa del sistema</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-6 mb-6">
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="w-4 h-4" />
            Carga Masiva
          </TabsTrigger>
          <TabsTrigger value="creators" className="gap-2">
            <Users className="w-4 h-4" />
            Creadores
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2">
            <Settings className="w-4 h-4" />
            Configuración
          </TabsTrigger>
          <TabsTrigger value="ia" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            IA Stats
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="w-4 h-4" />
            Actividad
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
              <CardDescription>
                Lista completa de creadores con edición avanzada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>Tabla de gestión de creadores disponible próximamente</p>
                <p className="text-sm mt-2">Por ahora, usa el Dashboard para ver creadores</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Branding</CardTitle>
                <CardDescription>
                  Personaliza el logo, colores y nombre del producto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p>Accede a <a href="/branding" className="text-primary underline">Branding Settings</a> para configurar</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuración de Scoring</CardTitle>
                <CardDescription>
                  Ajusta pesos del algoritmo y umbrales de evaluación
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p>Accede a <a href="/scoring" className="text-primary underline">Scoring Config</a> para configurar</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ia" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas de IA</CardTitle>
              <CardDescription>
                Efectividad de recomendaciones y ROI del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>Accede a <a href="/ia-effectiveness" className="text-primary underline">IA Effectiveness</a> para ver estadísticas</p>
              </div>
            </CardContent>
          </Card>
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

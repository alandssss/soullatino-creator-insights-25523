import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const UserManagement = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<'admin' | 'manager' | 'supervisor' | 'viewer'>('manager');
  const [loading, setLoading] = useState(false);

  const handleCreateUser = async () => {
    if (!email || !password) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: {
          action: 'create',
          email,
          password,
          role
        }
      });

      if (error) throw error;

      toast.success(`Usuario ${email} creado exitosamente`);
      setEmail("");
      setPassword("");
    } catch (error: any) {
      toast.error(error.message || "Error al crear usuario");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!email || !password) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: {
          action: 'update_password',
          email,
          password
        }
      });

      if (error) throw error;

      toast.success(`Contraseña actualizada para ${email}`);
      setEmail("");
      setPassword("");
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Gestión de Usuarios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="usuario@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            placeholder="Contraseña segura"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Rol</Label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="viewer">Viewer</option>
            <option value="supervisor">Supervisor</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={handleCreateUser} 
            disabled={loading}
            className="flex-1 w-full sm:w-auto"
          >
            {loading ? "Creando..." : `Crear Usuario ${role.charAt(0).toUpperCase() + role.slice(1)}`}
          </Button>
          <Button 
            onClick={handleUpdatePassword} 
            disabled={loading}
            variant="outline"
            className="flex-1 w-full sm:w-auto"
          >
            {loading ? "Actualizando..." : "Actualizar Contraseña"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

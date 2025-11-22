import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PanelReclutamiento } from "@/components/reclutamiento/PanelReclutamiento";

const Reclutamiento = () => {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkUserAccess();
  }, []);

  const checkUserAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    setUser(user);

    // Lectura robusta de rol
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("role, created_at")
      .eq("user_id", user.id);
    
    // Priorizar roles: admin > manager > supervisor > viewer
    const priority: Record<string, number> = { admin: 4, manager: 3, supervisor: 2, viewer: 1 };
    const sortedRoles = (rolesData || []).sort((a, b) => (priority[b.role] || 0) - (priority[a.role] || 0));
    const role = sortedRoles[0]?.role || null;
    
    setUserRole(role);

    // Solo admins, managers y reclutadores pueden acceder
    if (role !== 'admin' && role !== 'manager' && role !== 'reclutador') {
      navigate("/");
      return;
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PanelReclutamiento />
  );
};

export default Reclutamiento;

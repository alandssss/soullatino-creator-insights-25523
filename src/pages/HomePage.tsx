import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertTriangle,
  UserPlus,
  Diamond,
  DollarSign,
  Send,
  User,
  Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ----------------------------------------------------------------------
// DATOS MOCKEADOS (DE EJEMPLO)
// ----------------------------------------------------------------------
const mockKpis = [
  { 
    title: "Acciones Prioritarias", 
    value: "2", 
    icon: AlertTriangle, 
    color: "text-destructive" 
  },
  { 
    title: "Nuevos Creadores (<90d)", 
    value: "1", 
    icon: UserPlus, 
    color: "text-primary" 
  },
  { 
    title: "Total Diamantes (Mes)", 
    value: "1.58M", 
    icon: Diamond, 
    color: "text-primary" 
  },
  { 
    title: "Total Bonos Generados", 
    value: "$0.00", 
    icon: DollarSign, 
    color: "text-accent" 
  },
];

const mockAlerts = [
  {
    id: 1,
    username: "@alice01",
    avatarUrl: "",
    priority: "ALTA",
    priorityVariant: "destructive" as const,
    icon: AlertTriangle,
    iconColor: "text-destructive",
    tag: "Nuevo <90 Días",
    action: "Priorizar Meta 300K",
    details: "Faltan: 120,000 diamantes.",
    required: "Requerido: ~6,000 / día (Restan 20 días).",
    stats: "Stats: 10d | 38h | 180k diam.",
  },
  {
    id: 2,
    username: "@murillo.oficiall",
    avatarUrl: "",
    priority: "MEDIA",
    priorityVariant: "secondary" as const,
    icon: Zap,
    iconColor: "text-accent",
    tag: "Hito en Riesgo",
    action: "Riesgo de Hito 22d/80h",
    details: "Faltan: 2 días y 3.5 horas.",
    required: "Requerido: ~1 hora / día.",
    stats: "Stats: 20d | 76.5h | 410k diam.",
  },
];

interface AlertCardProps {
  alert: typeof mockAlerts[0];
}

const AlertCard = ({ alert }: AlertCardProps) => (
  <Card className={`overflow-hidden ${alert.priorityVariant === 'destructive' ? 'border-l-4 border-l-destructive' : 'border-l-4 border-l-accent'}`}>
    <CardContent className="p-4">
      <div className="flex flex-col md:flex-row md:items-start md:space-x-4">
        {/* Avatar y Prioridad */}
        <div className="flex flex-row md:flex-col items-center gap-2 md:gap-0">
          <Avatar className="h-12 w-12">
            <AvatarImage src={alert.avatarUrl} alt={alert.username} />
            <AvatarFallback>{alert.username.substring(1, 3).toUpperCase()}</AvatarFallback>
          </Avatar>
          <Badge variant={alert.priorityVariant} className="mt-2 hidden md:inline-flex">
            {alert.priority}
          </Badge>
        </div>

        {/* Info Principal */}
        <div className="flex-grow my-4 md:my-0">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold">{alert.username}</span>
            <Badge variant="outline">{alert.tag}</Badge>
          </div>
          
          <div className="flex items-center space-x-2 mt-2">
            <alert.icon className={`h-5 w-5 ${alert.iconColor}`} />
            <span className="text-xl font-semibold text-foreground">{alert.action}</span>
          </div>
          
          <p className="text-muted-foreground mt-1">{alert.details}</p>
          <p className="text-sm font-medium text-primary mt-1">{alert.required}</p>
          <p className="text-xs text-muted-foreground mt-2">{alert.stats}</p>
        </div>
        
        {/* Acciones */}
        <div className="flex flex-col space-y-2 w-full md:w-auto mt-4 md:mt-0">
          <Button size="sm">
            <User className="mr-2 h-4 w-4" /> Ver Perfil Completo
          </Button>
          <Button size="sm" variant="outline">
            <Send className="mr-2 h-4 w-4" /> Enviar WhatsApp
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

const HomePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [kpis] = useState(mockKpis);
  const [alerts] = useState(mockAlerts);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/login");
      } else {
        setUser(session.user);
        // Simular carga de datos
        setTimeout(() => {
          setLoading(false);
        }, 500);
      }
    };

    checkAuthAndFetchData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="p-6 md:p-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Buenos días, {user?.email?.split('@')[0] || "Manager"}
          </h1>
          <p className="text-muted-foreground">
            Aquí están tus acciones prioritarias para hoy.
          </p>
        </header>

        {/* KPIs Globales */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {kpis.map((kpi) => (
        <Card key={kpi.title} className="glass-card group overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {kpi.title}
            </CardTitle>
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 group-hover:from-blue-500/30 group-hover:to-indigo-500/30 transition-all">
            <kpi.icon className="h-5 w-5 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
          </CardContent>
        </Card>
          ))}
        </div>

        {/* Feed de Acciones Priorizadas */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Feed de Acciones Priorizadas</h2>
          <div className="space-y-4">
            {alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;

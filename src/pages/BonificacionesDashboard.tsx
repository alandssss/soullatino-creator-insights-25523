import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Diamond, 
  TrendingUp, 
  Calendar, 
  Target, 
  MessageCircle,
  Download,
  Search,
  Filter,
  Loader2
} from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as XLSX from 'xlsx';

type Bonificacion = Tables<"creator_bonificaciones">;

interface EnrichedBonificacion extends Bonificacion {
  creator_name?: string;
  creator_phone?: string;
}

const BonificacionesDashboard = () => {
  const [bonificaciones, setBonificaciones] = useState<EnrichedBonificacion[]>([]);
  const [filteredData, setFilteredData] = useState<EnrichedBonificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [goalFilter, setGoalFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bonificaciones, searchTerm, goalFilter, riskFilter]);

  const checkAuthAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }
    await loadBonificaciones();
  };

  const loadBonificaciones = async () => {
    setLoading(true);
    try {
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
      
      const { data: bonifData, error: bonifError } = await supabase
        .from("creator_bonificaciones")
        .select("*")
        .eq("mes_referencia", currentMonth)
        .order("diam_live_mes", { ascending: false });

      if (bonifError) throw bonifError;

      // Enrich with creator data
      const creatorIds = bonifData?.map(b => b.creator_id).filter(Boolean) || [];
      const { data: creators } = await supabase
        .from("creators")
        .select("id, nombre, telefono")
        .in("id", creatorIds);

      const enriched = (bonifData || []).map(bonif => {
        const creator = creators?.find(c => c.id === bonif.creator_id);
        return {
          ...bonif,
          creator_name: creator?.nombre || "Sin nombre",
          creator_phone: creator?.telefono || null,
        };
      });

      setBonificaciones(enriched);
    } catch (error: any) {
      console.error("Error loading bonificaciones:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las bonificaciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...bonificaciones];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(b => 
        b.creator_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Goal filter
    if (goalFilter !== "all") {
      const goalKey = `grad_${goalFilter}` as keyof Bonificacion;
      filtered = filtered.filter(b => !b[goalKey]);
    }

    // Risk filter
    if (riskFilter === "priority") {
      filtered = filtered.filter(b => b.es_prioridad_300k);
    } else if (riskFilter === "close") {
      filtered = filtered.filter(b => b.cerca_de_objetivo);
    }

    setFilteredData(filtered);
  };

  const handleWhatsApp = (bonif: EnrichedBonificacion) => {
    if (!bonif.creator_phone) {
      toast({
        title: "Sin teléfono",
        description: "Este creador no tiene teléfono registrado",
        variant: "destructive",
      });
      return;
    }

    const dias = bonif.dias_live_mes || 0;
    const horas = bonif.horas_live_mes || 0;
    const diamantes = bonif.diam_live_mes || 0;
    const diasRestantes = bonif.dias_restantes || 0;
    const reqDiamPorDia = bonif.req_diam_por_dia || 0;

    const message = `Hola ${bonif.creator_name}! 👋\n\nResumen del mes:\n📅 Días: ${dias}\n⏰ Horas: ${horas.toFixed(1)}h\n💎 Diamantes: ${diamantes.toLocaleString()}\n\n🎯 Meta: ${bonif.proximo_objetivo_valor || "En progreso"}\n📆 Días restantes: ${diasRestantes}\n💪 Necesitas: ${reqDiamPorDia.toLocaleString()} 💎/día\n\n¡Sigue así! 🚀`;

    const phone = bonif.creator_phone.replace(/[^0-9]/g, '');
    const fullPhone = phone.length === 10 ? `52${phone}` : phone;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const exportToExcel = () => {
    const exportData = filteredData.map(b => ({
      Creador: b.creator_name,
      "Días Live": b.dias_live_mes,
      "Horas Live": b.horas_live_mes,
      Diamantes: b.diam_live_mes,
      "Próxima Meta": b.proximo_objetivo_valor,
      "Días Restantes": b.dias_restantes,
      "Req. Diario": b.req_diam_por_dia,
      "Prioridad 300K": b.es_prioridad_300k ? "Sí" : "No",
      "Cerca de Objetivo": b.cerca_de_objetivo ? "Sí" : "No",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bonificaciones");
    XLSX.writeFile(wb, `bonificaciones_${new Date().toISOString().slice(0, 10)}.xlsx`);

    toast({
      title: "✅ Exportado",
      description: "Archivo Excel descargado exitosamente",
    });
  };

  const getGoalBadge = (bonif: Bonificacion) => {
    if (bonif.grad_1m) return <Badge variant="default">1M ⭐</Badge>;
    if (bonif.grad_500k) return <Badge variant="default">500K 🎖️</Badge>;
    if (bonif.grad_300k) return <Badge variant="default">300K 🏆</Badge>;
    if (bonif.grad_100k) return <Badge variant="default">100K 🥈</Badge>;
    if (bonif.grad_50k) return <Badge variant="default">50K 🥉</Badge>;
    return <Badge variant="outline">En progreso</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalCreadores = bonificaciones.length;
  const totalDiamantes = bonificaciones.reduce((sum, b) => sum + (b.diam_live_mes || 0), 0);
  const promedioHoras = bonificaciones.reduce((sum, b) => sum + (b.horas_live_mes || 0), 0) / (totalCreadores || 1);
  const prioridadCount = bonificaciones.filter(b => b.es_prioridad_300k).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-premium bg-clip-text text-transparent">
            Bonificaciones del Mes
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestión completa de metas y progreso
          </p>
        </div>
        <Button onClick={exportToExcel} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Excel
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="neo-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Diamond className="h-4 w-4" />
              Total Diamantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {totalDiamantes.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="neo-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Creadores Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {totalCreadores}
            </div>
          </CardContent>
        </Card>

        <Card className="neo-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Promedio Horas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {promedioHoras.toFixed(1)}h
            </div>
          </CardContent>
        </Card>

        <Card className="neo-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Prioridad 300K
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {prioridadCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="neo-card">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar creador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={goalFilter} onValueChange={setGoalFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por meta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las metas</SelectItem>
                <SelectItem value="50k">50K</SelectItem>
                <SelectItem value="100k">100K</SelectItem>
                <SelectItem value="300k">300K</SelectItem>
                <SelectItem value="500k">500K</SelectItem>
                <SelectItem value="1m">1M</SelectItem>
              </SelectContent>
            </Select>

            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por riesgo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="priority">Solo prioridad 300K</SelectItem>
                <SelectItem value="close">Cerca de objetivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="neo-card">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Creador</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Meta Actual</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Días</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Horas</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Diamantes</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Req. Diario</th>
                  <th className="text-center p-3 text-sm font-medium text-muted-foreground">Estado</th>
                  <th className="text-center p-3 text-sm font-medium text-muted-foreground">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((bonif) => (
                  <tr key={bonif.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      <div className="font-medium">{bonif.creator_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {bonif.dias_restantes} días restantes
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-sm">{bonif.proximo_objetivo_valor || "N/A"}</div>
                      <div className="text-xs text-muted-foreground">{bonif.proximo_objetivo_tipo}</div>
                    </td>
                    <td className="text-right p-3 font-mono">{bonif.dias_live_mes || 0}</td>
                    <td className="text-right p-3 font-mono">{(bonif.horas_live_mes || 0).toFixed(1)}h</td>
                    <td className="text-right p-3 font-bold text-accent">
                      {(bonif.diam_live_mes || 0).toLocaleString()}
                    </td>
                    <td className="text-right p-3 font-mono text-sm">
                      {(bonif.req_diam_por_dia || 0).toLocaleString()}
                    </td>
                    <td className="text-center p-3">
                      <div className="flex flex-col gap-1 items-center">
                        {getGoalBadge(bonif)}
                        {bonif.es_prioridad_300k && (
                          <Badge variant="destructive" className="text-xs">Prioridad</Badge>
                        )}
                      </div>
                    </td>
                    <td className="text-center p-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleWhatsApp(bonif)}
                        disabled={!bonif.creator_phone}
                        className="gap-2"
                      >
                        <MessageCircle className="h-3 w-3" />
                        WhatsApp
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No se encontraron resultados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BonificacionesDashboard;

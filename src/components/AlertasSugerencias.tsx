import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Download, Search, AlertTriangle, TrendingDown, Clock, Users, RefreshCw } from "lucide-react";
import { openWhatsApp } from "@/utils/whatsapp";
import { KpiCard } from "./alertas/KpiCard";
import { FilterChips, FilterType } from "./alertas/FilterChips";
import { RiskTable } from "./alertas/RiskTable";
import { EmptyState } from "./alertas/EmptyState";
import { getCreatorDisplayName } from "@/utils/creator-display";

interface Recommendation {
  creator_id: string;
  creator_username: string;
  phone_e164: string | null;
  dias_actuales: number;
  horas_actuales: number;
  diamantes_actuales: number;
  proximo_objetivo: string;
  dias_restantes: number;
  faltan_dias: number;
  faltan_horas: number;
  horas_min_dia_sugeridas: number;
  prioridad_riesgo: number;
}

interface Summary {
  total: number;
  riesgo_alto: number;
  riesgo_medio: number;
  riesgo_bajo: number;
  con_deficit_dias: number;
  con_deficit_horas: number;
}

export default function AlertasSugerencias() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [filteredRecs, setFilteredRecs] = useState<Recommendation[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FilterType>('all');

  useEffect(() => {
    loadRecommendations();
  }, []);

  useEffect(() => {
    filterRecommendations();
  }, [recommendations, searchTerm, filterType]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Debes iniciar sesión para ver las recomendaciones');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('get-recommendations-today');
      
      console.log('[RECS] data:', data, 'error:', error);
      
      if (error) throw error;
      
      if (!data?.success) {
        throw new Error(data?.error || 'Sin datos de hoy');
      }
      
      setRecommendations(data.recommendations || []);
      setSummary(data.summary || null);
      
      if (data.error && data.recommendations?.length === 0) {
        toast.info(data.hint || 'No hay datos disponibles. Sube un archivo Excel para comenzar.');
      }
    } catch (error: any) {
      console.error('Error loading recommendations:', error);
      toast.error('Error al cargar recomendaciones: ' + error.message);
    } finally {
      setLoading(false);
    }
  };


  const filterRecommendations = () => {
    let filtered = [...recommendations];

    // Búsqueda por nombre
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.creator_username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por tipo
    if (filterType === 'alto') {
      filtered = filtered.filter(r => r.prioridad_riesgo >= 40);
    } else if (filterType === 'medio') {
      filtered = filtered.filter(r => r.prioridad_riesgo >= 20 && r.prioridad_riesgo < 40);
    } else if (filterType === 'bajo') {
      filtered = filtered.filter(r => r.prioridad_riesgo < 20);
    } else if (filterType === 'deficit_dias') {
      filtered = filtered.filter(r => r.faltan_dias > 0);
    } else if (filterType === 'deficit_horas') {
      filtered = filtered.filter(r => r.faltan_horas > 0);
    }

    setFilteredRecs(filtered);
  };

  const generarMensajeWhatsApp = (rec: Recommendation): string => {
    const displayName = rec.creator_username || 'Creador';
    return `Hola ${displayName} 👋
Quedan ${rec.dias_restantes} días del mes.

Para ${rec.proximo_objetivo}:
• Te faltan ${rec.faltan_dias} día(s)
• Te faltan ${rec.faltan_horas.toFixed(1)} horas

Recomiendo ${rec.horas_min_dia_sugeridas.toFixed(1)} horas/día hasta fin de mes.

${rec.prioridad_riesgo >= 40 ? '⚠️ Si saltas 1 día, podrías perder la bonificación.' : ''}

¿Confirmas ${rec.horas_min_dia_sugeridas.toFixed(1)}h hoy y 5 PKO de 5 min?`;
  };

  const handleWhatsApp = async (rec: Recommendation) => {
    if (!rec.phone_e164) {
      toast.error('Este creador no tiene teléfono registrado');
      return;
    }

    try {
      await openWhatsApp({
        phone: rec.phone_e164,
        message: generarMensajeWhatsApp(rec),
        creatorId: rec.creator_id,
        creatorName: rec.creator_username,
        actionType: 'bonificaciones'
      });
    } catch (error: any) {
      console.error('Error WhatsApp:', error);
      toast.error('Error al abrir WhatsApp');
    }
  };

  const handleLlamar = async (rec: Recommendation) => {
    if (!rec.phone_e164) {
      toast.error('Este creador no tiene teléfono registrado');
      return;
    }

    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.location.href = `tel:${rec.phone_e164}`;
    } else {
      toast.success(`Número: ${rec.phone_e164}`);
    }
  };

  const exportarCSV = () => {
    const headers = ['Creator', 'Días', 'Horas', 'Diamantes', 'Objetivo', 'Faltan Días', 'Faltan Horas', 'Horas/Día Sugeridas', 'Riesgo'];
    const rows = filteredRecs.map(r => [
      r.creator_username,
      r.dias_actuales,
      r.horas_actuales.toFixed(1),
      r.diamantes_actuales.toFixed(0),
      r.proximo_objetivo,
      r.faltan_dias,
      r.faltan_horas.toFixed(1),
      r.horas_min_dia_sugeridas.toFixed(1),
      r.prioridad_riesgo
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alertas-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterType('all');
  };

  const showEmptyState = !loading && filteredRecs.length === 0;
  const hasFilters = searchTerm || filterType !== 'all';

  return (
    <div className="min-h-screen space-y-8 p-6 lg:p-8">
      {/* Encabezado sticky */}
      <div className="sticky top-0 z-10 -mx-6 -mt-6 bg-background/95 px-6 py-6 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:-mx-8 lg:-mt-8 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold leading-none tracking-tight">
              Alertas y Sugerencias
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Prioriza a quién contactar hoy para no perder bonificaciones
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={loadRecommendations}
              disabled={loading}
              size="lg"
              className="gap-2 rounded-xl min-h-[44px]"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </Button>
            
            <Button 
              onClick={exportarCSV} 
              variant="outline" 
              size="lg"
              disabled={filteredRecs.length === 0}
              className="gap-2 rounded-xl min-h-[44px]"
            >
              <Download className="h-4 w-4" />
              <span>Exportar CSV</span>
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Total Creadores"
            value={summary.total}
            icon={Users}
            variant="default"
          />
          <KpiCard
            title="Riesgo Alto"
            value={summary.riesgo_alto}
            icon={AlertTriangle}
            variant="danger"
          />
          <KpiCard
            title="Déficit Días"
            value={summary.con_deficit_dias}
            icon={Clock}
            variant="warning"
          />
          <KpiCard
            title="Déficit Horas"
            value={summary.con_deficit_horas}
            icon={TrendingDown}
            variant="warning"
          />
        </div>
      ) : null}

      {/* Filtros */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <FilterChips
            activeFilter={filterType}
            onFilterChange={setFilterType}
            counts={{
              alto: summary?.riesgo_alto || 0,
              medio: summary?.riesgo_medio || 0,
              bajo: summary?.riesgo_bajo || 0,
              deficit_dias: summary?.con_deficit_dias || 0,
              deficit_horas: summary?.con_deficit_horas || 0,
            }}
          />
        </div>
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar creador por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 rounded-xl pl-11 text-sm"
          />
        </div>
      </div>

      {/* Tabla/Lista */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : showEmptyState ? (
        <EmptyState
          variant={recommendations.length === 0 ? 'no-data' : 'no-results'}
          onClearFilters={handleClearFilters}
        />
      ) : (
        <RiskTable
          recommendations={filteredRecs}
          onWhatsApp={handleWhatsApp}
          onCall={handleLlamar}
        />
      )}
    </div>
  );
}

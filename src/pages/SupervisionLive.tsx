import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, AlertCircle, Download, Search, Shield, Lightbulb } from "lucide-react";
import { CreatorCard } from "@/components/supervision/CreatorCard";
import { CreatorPanel } from "@/components/supervision/CreatorPanel";
import { IncidentDialog } from "@/components/supervision/IncidentDialog";
import * as XLSX from "xlsx";

interface Creator {
  id: string;
  nombre: string;
  telefono?: string;
  dias_en_agencia?: number;
  diam_live_mes?: number;
  horas_live_mes?: number;
  dias_live_mes?: number;
  tiktok_username?: string;
  graduacion?: string;
  manager?: string;
}

interface SupervisionLog {
  id: string;
  creator_id: string;
  fecha_evento: string;
  en_vivo: boolean;
  en_batalla: boolean;
  riesgo: string;
  score: number;
}

export default function SupervisionLive() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [logs, setLogs] = useState<SupervisionLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroRiesgo, setFiltroRiesgo] = useState<"todos" | "verde" | "amarillo" | "rojo">("todos");
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: creatorsData, error } = await supabase
        .from('creators')
        .select('id, nombre, tiktok_username, telefono, dias_en_agencia, manager')
        .eq('status', 'activo');

      if (error) throw error;

      const now = new Date();
      const mesRef = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

      const { data: bonif } = await supabase
        .from('creator_bonificaciones')
        .select('creator_id, diam_live_mes, horas_live_mes, dias_live_mes')
        .eq('mes_referencia', mesRef);

      const metricsMap = new Map((bonif || []).map(m => [m.creator_id, m]));

      setCreators((creatorsData || []).map(c => ({
        ...c,
        tiktok_username: c.tiktok_username || c.nombre,
        diam_live_mes: metricsMap.get(c.id)?.diam_live_mes || 0,
        horas_live_mes: metricsMap.get(c.id)?.horas_live_mes || 0,
        dias_live_mes: metricsMap.get(c.id)?.dias_live_mes || 0,
      })));

      const { data: logsData } = await supabase
        .from('supervision_live_logs')
        .select('*')
        .gte('fecha_evento', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      setLogs(logsData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const creatorsWithLogs = creators.map(c => ({
    creator: c,
    latestLog: logs.filter(l => l.creator_id === c.id).sort((a, b) =>
      new Date(b.fecha_evento).getTime() - new Date(a.fecha_evento).getTime()
    )[0]
  }));

  const filteredCreators = creatorsWithLogs.filter(({ creator, latestLog }) =>
    (creator.tiktok_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     creator.nombre.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filtroRiesgo === 'todos' || latestLog?.riesgo === filtroRiesgo)
  );

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">👁️ Supervisión en Vivo</h1>
          <p className="text-muted-foreground">Monitoreo activo de creadores</p>
        </div>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Buscar por username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button variant={filtroRiesgo === 'todos' ? 'default' : 'outline'} onClick={() => setFiltroRiesgo('todos')}>Todos</Button>
        <Button variant={filtroRiesgo === 'verde' ? 'default' : 'outline'} onClick={() => setFiltroRiesgo('verde')}>Verde</Button>
        <Button variant={filtroRiesgo === 'amarillo' ? 'default' : 'outline'} onClick={() => setFiltroRiesgo('amarillo')}>Amarillo</Button>
        <Button variant={filtroRiesgo === 'rojo' ? 'default' : 'outline'} onClick={() => setFiltroRiesgo('rojo')}>Rojo</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCreators.map(({ creator, latestLog }) => (
          <CreatorCard
            key={creator.id}
            creator={creator}
            latestLog={latestLog}
            onClick={() => {
              setSelectedCreator(creator);
              setDrawerOpen(true);
            }}
          />
        ))}
      </div>

      <CreatorPanel
        creator={selectedCreator}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onOpenIncident={() => setIncidentDialogOpen(true)}
        onReload={loadData}
      />

      <IncidentDialog
        open={incidentDialogOpen}
        onOpenChange={setIncidentDialogOpen}
        creator={selectedCreator}
        onSuccess={() => {
          loadData();
          setIncidentDialogOpen(false);
        }}
      />
    </div>
  );
}

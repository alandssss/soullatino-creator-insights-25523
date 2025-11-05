import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MessageCircle, CheckCircle2, Clock, XCircle, Search } from "lucide-react";
import { toast } from "sonner";

interface CreatorOptInStatus {
  id: string;
  nombre: string;
  telefono: string;
  tiktok_username: string;
  opt_in_enviado: boolean;
  fecha_opt_in: string | null;
  twilio_status: string | null;
  message_sid: string | null;
  ventana_abierta: boolean;
  dias_desde_envio: number | null;
}

export function OptInMonitorPanel() {
  const [creators, setCreators] = useState<CreatorOptInStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadCreatorsOptInStatus();
  }, []);

  const loadCreatorsOptInStatus = async () => {
    try {
      setLoading(true);

      // Obtener creadores activos con teléfono
      const { data: creatorsData, error: creatorsError } = await supabase
        .from('creators')
        .select('id, nombre, telefono, tiktok_username')
        .eq('status', 'activo')
        .not('telefono', 'is', null)
        .order('nombre');

      if (creatorsError) throw creatorsError;

      // Obtener logs de opt-in (buscar por action_type = 'optin_masivo')
      const { data: optInLogs, error: logsError } = await supabase
        .from('logs_whatsapp')
        .select('*')
        .ilike('mensaje_enviado', '%opt-in%')
        .order('created_at', { ascending: false });

      if (logsError) throw logsError;

      // Procesar datos
      const creatorsWithStatus = (creatorsData || []).map(creator => {
        // Buscar el log más reciente de opt-in para este creador
        const log = (optInLogs || []).find(l => 
          l.telefono?.includes(creator.telefono?.replace(/\D/g, '').slice(-10) || '')
        );

        const fechaOptIn = log?.created_at ? new Date(log.created_at) : null;
        const diasDesdeEnvio = fechaOptIn 
          ? Math.floor((Date.now() - fechaOptIn.getTime()) / (1000 * 60 * 60 * 24))
          : null;

        // Ventana abierta si: opt-in enviado Y (mensaje delivered/read) Y menos de 24h
        // Para simplificar, asumimos ventana abierta si status es 'delivered' o 'sent' y < 1 día
        const ventanaAbierta = log && 
          (log.twilio_status === 'delivered' || log.twilio_status === 'sent') &&
          diasDesdeEnvio !== null && diasDesdeEnvio === 0;

        return {
          id: creator.id,
          nombre: creator.nombre,
          telefono: creator.telefono,
          tiktok_username: creator.tiktok_username || '',
          opt_in_enviado: !!log,
          fecha_opt_in: log?.created_at || null,
          twilio_status: log?.twilio_status || null,
          message_sid: log?.twilio_message_sid || null,
          ventana_abierta: ventanaAbierta,
          dias_desde_envio: diasDesdeEnvio,
        };
      });

      setCreators(creatorsWithStatus);
    } catch (error: any) {
      console.error('[OptInMonitor] Error:', error);
      toast.error("Error cargando estado de opt-in");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (creator: CreatorOptInStatus) => {
    if (!creator.opt_in_enviado) {
      return (
        <Badge variant="outline" className="gap-1">
          <XCircle className="h-3 w-3" />
          Sin opt-in
        </Badge>
      );
    }

    if (creator.ventana_abierta) {
      return (
        <Badge variant="default" className="gap-1 bg-green-600">
          <CheckCircle2 className="h-3 w-3" />
          Ventana abierta
        </Badge>
      );
    }

    if (creator.dias_desde_envio !== null && creator.dias_desde_envio > 0) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          Enviado hace {creator.dias_desde_envio}d
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" />
        Opt-in enviado
      </Badge>
    );
  };

  const getTwilioStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">-</Badge>;

    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      'sent': { label: 'Enviado', variant: 'secondary' },
      'delivered': { label: 'Entregado', variant: 'default' },
      'read': { label: 'Leído', variant: 'default' },
      'failed': { label: 'Fallido', variant: 'destructive' },
      'undelivered': { label: 'No entregado', variant: 'destructive' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'outline' as const };

    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  // Filtros
  const filteredCreators = creators.filter(creator => {
    // Filtro por búsqueda
    const matchesSearch = searchQuery === "" || 
      creator.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.tiktok_username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.telefono.includes(searchQuery);

    // Filtro por estado
    let matchesStatus = true;
    if (statusFilter === "ventana_abierta") {
      matchesStatus = creator.ventana_abierta;
    } else if (statusFilter === "opt_in_enviado") {
      matchesStatus = creator.opt_in_enviado && !creator.ventana_abierta;
    } else if (statusFilter === "sin_opt_in") {
      matchesStatus = !creator.opt_in_enviado;
    }

    return matchesSearch && matchesStatus;
  });

  // Estadísticas
  const stats = {
    total: creators.length,
    conOptIn: creators.filter(c => c.opt_in_enviado).length,
    ventanaAbierta: creators.filter(c => c.ventana_abierta).length,
    sinOptIn: creators.filter(c => !c.opt_in_enviado).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="neo-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-primary" />
          Monitor de Opt-in WhatsApp
        </CardTitle>
        <CardDescription>
          Estado de mensajes de opt-in y ventanas de comunicación activas
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total creadores</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.conOptIn}</div>
            <div className="text-sm text-muted-foreground">Opt-in enviado</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-2xl font-bold text-green-600">{stats.ventanaAbierta}</div>
            <div className="text-sm text-muted-foreground">Ventana abierta</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.sinOptIn}</div>
            <div className="text-sm text-muted-foreground">Sin opt-in</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, usuario o teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ventana_abierta">Ventana abierta</SelectItem>
              <SelectItem value="opt_in_enviado">Opt-in enviado</SelectItem>
              <SelectItem value="sin_opt_in">Sin opt-in</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabla */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creador</TableHead>
                <TableHead>Usuario TikTok</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Estado Opt-in</TableHead>
                <TableHead>Estado Twilio</TableHead>
                <TableHead>Fecha envío</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCreators.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No se encontraron creadores con los filtros seleccionados
                  </TableCell>
                </TableRow>
              ) : (
                filteredCreators.map((creator) => (
                  <TableRow key={creator.id}>
                    <TableCell className="font-medium">{creator.nombre}</TableCell>
                    <TableCell className="text-muted-foreground">
                      @{creator.tiktok_username || 'N/A'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{creator.telefono}</TableCell>
                    <TableCell>{getStatusBadge(creator)}</TableCell>
                    <TableCell>{getTwilioStatusBadge(creator.twilio_status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {creator.fecha_opt_in 
                        ? new Date(creator.fecha_opt_in).toLocaleString('es-MX', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

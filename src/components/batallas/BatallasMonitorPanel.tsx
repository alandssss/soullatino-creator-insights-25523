import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

interface LogEntry {
  id: string;
  batalla_id: string;
  telefono: string;
  mensaje_enviado: string;
  twilio_status: string;
  twilio_message_sid: string;
  error_message: string | null;
  created_at: string;
  batalla?: {
    fecha: string;
    hora: string;
    oponente: string;
    creators: {
      nombre: string;
      tiktok_username: string;
    };
  };
}

export function BatallasMonitorPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    pending: 0,
    failed: 0,
  });

  useEffect(() => {
    loadInitialData();
    setupRealtimeSubscription();
  }, []);

  const loadInitialData = async () => {
    try {
      const { data, error } = await supabase
        .from("logs_whatsapp")
        .select(`
          *,
          batallas (
            fecha,
            hora,
            oponente,
            creators (
              nombre,
              tiktok_username
            )
          )
        `)
        .not("batalla_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setLogs(data || []);
      updateStats(data || []);
    } catch (error) {
      console.error("Error loading logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("batalla-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "logs_whatsapp",
        },
        (payload) => {
          console.log("New log received:", payload);
          
          // Fetch full data with batalla details
          supabase
            .from("logs_whatsapp")
            .select(`
              *,
              batallas (
                fecha,
                hora,
                oponente,
                creators (
                  nombre,
                  tiktok_username
                )
              )
            `)
            .eq("id", payload.new.id)
            .single()
            .then(({ data }) => {
              if (data) {
                setLogs((prev) => [data, ...prev.slice(0, 49)]);
                updateStats([data, ...logs]);
              }
            });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "logs_whatsapp",
        },
        (payload) => {
          console.log("Log updated:", payload);
          setLogs((prev) =>
            prev.map((log) =>
              log.id === payload.new.id ? { ...log, ...payload.new } : log
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const updateStats = (data: LogEntry[]) => {
    const total = data.length;
    const sent = data.filter((l) => 
      ["sent", "delivered", "queued"].includes(l.twilio_status?.toLowerCase() || "")
    ).length;
    const pending = data.filter((l) => 
      ["pending", "accepted"].includes(l.twilio_status?.toLowerCase() || "")
    ).length;
    const failed = data.filter((l) => 
      ["failed", "undelivered"].includes(l.twilio_status?.toLowerCase() || "") || l.error_message
    ).length;

    setStats({ total, sent, pending, failed });
  };

  const getStatusBadge = (status: string, errorMessage: string | null) => {
    if (errorMessage) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="w-3 h-3" />
          Error
        </Badge>
      );
    }

    const lowerStatus = status?.toLowerCase() || "";
    
    if (["sent", "delivered"].includes(lowerStatus)) {
      return (
        <Badge variant="default" className="gap-1 bg-green-600">
          <CheckCircle2 className="w-3 h-3" />
          Enviado
        </Badge>
      );
    }
    
    if (["queued", "accepted"].includes(lowerStatus)) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="w-3 h-3" />
          En cola
        </Badge>
      );
    }
    
    if (["failed", "undelivered"].includes(lowerStatus)) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="w-3 h-3" />
          Fallido
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="gap-1">
        <AlertCircle className="w-3 h-3" />
        {status || "Desconocido"}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-MX", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-green-600">Enviados</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.sent}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-yellow-600">Pendientes</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-red-600">Fallidos</CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats.failed}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Monitor de Notificaciones en Tiempo Real
          </CardTitle>
          <CardDescription>
            Últimas 50 notificaciones de batalla enviadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay notificaciones registradas
                </div>
              ) : (
                logs.map((log) => (
                  <Card key={log.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {log.batalla?.creators?.nombre || "Creador desconocido"}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            @{log.batalla?.creators?.tiktok_username}
                          </span>
                        </div>
                        
                        <div className="text-sm space-y-1">
                          <div className="flex gap-4">
                            <span className="text-muted-foreground">📅 {log.batalla?.fecha}</span>
                            <span className="text-muted-foreground">🕒 {log.batalla?.hora}</span>
                            <span className="text-muted-foreground">🆚 {log.batalla?.oponente}</span>
                          </div>
                          <div className="text-muted-foreground">📱 {log.telefono}</div>
                          {log.twilio_message_sid && (
                            <div className="text-xs text-muted-foreground font-mono">
                              SID: {log.twilio_message_sid}
                            </div>
                          )}
                          {log.error_message && (
                            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                              ⚠️ {log.error_message}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(log.twilio_status, log.error_message)}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Loader2, ExternalLink, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { normalizePhoneE164 } from "@/utils/whatsapp";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Batalla {
  id: string;
  fecha: string;
  hora: string;
  oponente: string;
  tipo?: string;
  guantes?: string;
  reto?: string;
  notas?: string;
  wa_me_enviado_at?: string;
  wa_me_enviado_por?: string;
  creator: {
    id: string;
    nombre: string;
    telefono: string;
  };
}

type PlantillaType = 'formal' | 'motivacional' | 'urgente' | 'simple';

export function EnviarBatallasWaMe() {
  const [loading, setLoading] = useState(false);
  const [batallas, setBatallas] = useState<Batalla[]>([]);
  const [selectedBatallas, setSelectedBatallas] = useState<Set<string>>(new Set());
  const [plantilla, setPlantilla] = useState<PlantillaType>('formal');
  const [filtro, setFiltro] = useState<'todas' | 'enviadas' | 'pendientes'>('pendientes');

  useEffect(() => {
    loadBatallas();
  }, []);

  const loadBatallas = async () => {
    setLoading(true);
    try {
      // Obtener batallas programadas con fecha futura o de hoy
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('batallas')
        .select(`
          id,
          fecha,
          hora,
          oponente,
          tipo,
          guantes,
          reto,
          notas,
          wa_me_enviado_at,
          wa_me_enviado_por,
          creator:creators!inner (
            id,
            nombre,
            telefono
          )
        `)
        .eq('estado', 'programada')
        .gte('fecha', today)
        .not('creator.telefono', 'is', null)
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true });

      if (error) throw error;

      // Filtrar batallas con teléfono válido
      const validBatallas = (data || []).filter(b => {
        const normalized = normalizePhoneE164(b.creator.telefono, 'MX');
        return normalized !== null;
      });

      setBatallas(validBatallas);
    } catch (error: any) {
      console.error('[EnviarBatallasWaMe] Error cargando batallas:', error);
      toast.error("Error cargando batallas");
    } finally {
      setLoading(false);
    }
  };

  const generateBatallaMessage = (batalla: Batalla, plantillaType: PlantillaType = 'formal'): string => {
    const fechaFormateada = new Date(batalla.fecha + 'T00:00:00').toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });

    const detalles = `📅 ${fechaFormateada}
🕐 ${batalla.hora}
🆚 Oponente: ${batalla.oponente}${batalla.tipo ? `\n🎯 Modalidad: ${batalla.tipo}` : ''}${batalla.guantes ? `\n🧤 Guantes: ${batalla.guantes}` : ''}${batalla.reto ? `\n💥 Reto: ${batalla.reto}` : ''}${batalla.notas ? `\n\n📝 ${batalla.notas}` : ''}`;

    const plantillas: Record<PlantillaType, string> = {
      formal: `🎮 Batalla Programada

Hola ${batalla.creator.nombre}, te confirmamos tu batalla próxima:

${detalles}

¡Éxito en tu batalla! 💪`,

      motivacional: `🔥 ¡ES HORA DE BRILLAR! 🔥

${batalla.creator.nombre}, tienes una batalla épica esperándote:

${detalles}

¡Prepárate para ROMPERLA y demostrar de qué estás hecho! 💎🚀
¡Vamos por esa victoria! 🏆`,

      urgente: `⚠️ RECORDATORIO IMPORTANTE ⚠️

${batalla.creator.nombre}, tu batalla está cerca:

${detalles}

Por favor confirma tu asistencia lo antes posible. ⏰`,

      simple: `Hola ${batalla.creator.nombre} 👋

Batalla programada:
${detalles}

¡Nos vemos ahí! 🎮`
    };

    return plantillas[plantillaType];
  };

  const handleSelectAll = () => {
    if (selectedBatallas.size === batallas.length) {
      setSelectedBatallas(new Set());
    } else {
      setSelectedBatallas(new Set(batallas.map(b => b.id)));
    }
  };

  const handleToggleBatalla = (batallaId: string) => {
    const newSelected = new Set(selectedBatallas);
    if (newSelected.has(batallaId)) {
      newSelected.delete(batallaId);
    } else {
      newSelected.add(batallaId);
    }
    setSelectedBatallas(newSelected);
  };

  const handleSendBatallas = async () => {
    if (selectedBatallas.size === 0) {
      toast.error("Selecciona al menos una batalla");
      return;
    }

    const selectedBatallasList = batallas.filter(b => selectedBatallas.has(b.id));
    const { data: { user } } = await supabase.auth.getUser();
    
    // Abrir wa.me para cada batalla en nuevas pestañas (con delay)
    selectedBatallasList.forEach((batalla, index) => {
      setTimeout(() => {
        const e164 = normalizePhoneE164(batalla.creator.telefono, 'MX');
        if (!e164) return;

        const message = generateBatallaMessage(batalla, plantilla);
        const url = `https://wa.me/${e164}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
      }, index * 500); // 500ms delay entre cada ventana
    });

    // Marcar como enviadas
    try {
      const updates = selectedBatallasList.map(b => ({
        id: b.id,
        wa_me_enviado_at: new Date().toISOString(),
        wa_me_enviado_por: user?.id
      }));

      for (const update of updates) {
        await supabase
          .from('batallas')
          .update({ 
            wa_me_enviado_at: update.wa_me_enviado_at,
            wa_me_enviado_por: update.wa_me_enviado_por
          })
          .eq('id', update.id);
      }

      toast.success(`✅ ${selectedBatallas.size} batallas enviadas y marcadas`);
      setSelectedBatallas(new Set());
      loadBatallas();
    } catch (error) {
      console.error('[EnviarBatallasWaMe] Error actualizando historial:', error);
      toast.warning(`Batallas enviadas pero no se pudo guardar el historial`);
    }
  };

  const handleMarcarEnviada = async (batallaId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from('batallas')
        .update({ 
          wa_me_enviado_at: new Date().toISOString(),
          wa_me_enviado_por: user?.id
        })
        .eq('id', batallaId);

      toast.success("✅ Batalla marcada como enviada");
      loadBatallas();
    } catch (error) {
      console.error('[EnviarBatallasWaMe] Error marcando batalla:', error);
      toast.error("Error al marcar batalla");
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const batallasFiltradas = batallas.filter(b => {
    if (filtro === 'todas') return true;
    if (filtro === 'enviadas') return !!b.wa_me_enviado_at;
    if (filtro === 'pendientes') return !b.wa_me_enviado_at;
    return true;
  });

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Enviar Batallas por WhatsApp
            </CardTitle>
            <CardDescription className="mt-2">
              Envía notificaciones personalizadas de batallas programadas
            </CardDescription>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleSelectAll}
              size="sm"
            >
              {selectedBatallas.size === batallasFiltradas.length ? 'Deseleccionar' : 'Seleccionar todos'}
            </Button>
            <Button 
              variant="default" 
              disabled={selectedBatallas.size === 0}
              onClick={handleSendBatallas}
              className="shrink-0"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Enviar ({selectedBatallas.size})
            </Button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Plantilla de mensaje:</label>
            <Select value={plantilla} onValueChange={(v) => setPlantilla(v as PlantillaType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="formal">📋 Formal - Profesional y directo</SelectItem>
                <SelectItem value="motivacional">🔥 Motivacional - Energético y animado</SelectItem>
                <SelectItem value="urgente">⚠️ Urgente - Recordatorio importante</SelectItem>
                <SelectItem value="simple">💬 Simple - Corto y casual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Filtrar por:</label>
            <Tabs value={filtro} onValueChange={(v) => setFiltro(v as any)}>
              <TabsList>
                <TabsTrigger value="pendientes" className="gap-1">
                  <Clock className="h-3 w-3" />
                  Pendientes ({batallas.filter(b => !b.wa_me_enviado_at).length})
                </TabsTrigger>
                <TabsTrigger value="enviadas" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Enviadas ({batallas.filter(b => b.wa_me_enviado_at).length})
                </TabsTrigger>
                <TabsTrigger value="todas">
                  Todas ({batallas.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {batallasFiltradas.map((batalla) => {
            const isSelected = selectedBatallas.has(batalla.id);
            const message = generateBatallaMessage(batalla, plantilla);
            const e164 = normalizePhoneE164(batalla.creator.telefono, 'MX');
            const yaEnviada = !!batalla.wa_me_enviado_at;
            
            return (
              <div 
                key={batalla.id}
                className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                  yaEnviada 
                    ? 'bg-muted/50 border-muted' 
                    : isSelected 
                    ? 'border-primary bg-primary/5 cursor-pointer' 
                    : 'border-border hover:bg-muted/50 cursor-pointer'
                }`}
                onClick={() => !yaEnviada && handleToggleBatalla(batalla.id)}
              >
                <div className="flex items-center gap-3 flex-1">
                  {!yaEnviada && (
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => handleToggleBatalla(batalla.id)}
                      className="h-4 w-4"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  {yaEnviada && (
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{batalla.creator.nombre}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatFecha(batalla.fecha)} · {batalla.hora} · vs {batalla.oponente}
                      {batalla.tipo && ` · ${batalla.tipo}`}
                    </div>
                    {yaEnviada && (
                      <div className="text-xs text-green-600 mt-1">
                        Enviada: {new Date(batalla.wa_me_enviado_at).toLocaleString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!e164) return;
                      const url = `https://wa.me/${e164}?text=${encodeURIComponent(message)}`;
                      window.open(url, '_blank');
                      if (!yaEnviada) {
                        handleMarcarEnviada(batalla.id);
                      }
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {batallasFiltradas.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay batallas {filtro === 'enviadas' ? 'enviadas' : filtro === 'pendientes' ? 'pendientes' : ''}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

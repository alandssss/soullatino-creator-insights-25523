import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { normalizePhoneE164 } from "@/utils/whatsapp";

interface Batalla {
  id: string;
  fecha: string;
  hora: string;
  oponente: string;
  tipo?: string;
  guantes?: string;
  reto?: string;
  notas?: string;
  creator: {
    id: string;
    nombre: string;
    telefono: string;
  };
}

export function EnviarBatallasWaMe() {
  const [loading, setLoading] = useState(false);
  const [batallas, setBatallas] = useState<Batalla[]>([]);
  const [selectedBatallas, setSelectedBatallas] = useState<Set<string>>(new Set());

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

  const generateBatallaMessage = (batalla: Batalla): string => {
    const fechaFormateada = new Date(batalla.fecha + 'T00:00:00').toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });

    let mensaje = `🎮 ¡Batalla Programada! 🎮

Hola ${batalla.creator.nombre}, tienes una batalla próxima:

📅 ${fechaFormateada}
🕐 ${batalla.hora}
🆚 Oponente: ${batalla.oponente}`;

    if (batalla.tipo) {
      mensaje += `\n🎯 Modalidad: ${batalla.tipo}`;
    }

    if (batalla.guantes) {
      mensaje += `\n🧤 Guantes: ${batalla.guantes}`;
    }

    if (batalla.reto) {
      mensaje += `\n💥 Reto: ${batalla.reto}`;
    }

    if (batalla.notas) {
      mensaje += `\n\n📝 Notas: ${batalla.notas}`;
    }

    mensaje += `\n\n¡Prepárate para dar lo mejor! 💪`;

    return mensaje;
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

  const handleSendBatallas = () => {
    if (selectedBatallas.size === 0) {
      toast.error("Selecciona al menos una batalla");
      return;
    }

    const selectedBatallasList = batallas.filter(b => selectedBatallas.has(b.id));
    
    // Abrir wa.me para cada batalla en nuevas pestañas (con delay)
    selectedBatallasList.forEach((batalla, index) => {
      setTimeout(() => {
        const e164 = normalizePhoneE164(batalla.creator.telefono, 'MX');
        if (!e164) return;

        const message = generateBatallaMessage(batalla);
        const url = `https://wa.me/${e164}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
      }, index * 500); // 500ms delay entre cada ventana
    });

    toast.success(`✅ Abriendo ${selectedBatallas.size} chats de WhatsApp`);
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

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Enviar Batallas por WhatsApp (wa.me)
            </CardTitle>
            <CardDescription className="mt-2">
              Envía notificaciones de batallas programadas a los creadores via WhatsApp
            </CardDescription>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleSelectAll}
              size="sm"
            >
              {selectedBatallas.size === batallas.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </Button>
            <Button 
              variant="default" 
              disabled={selectedBatallas.size === 0}
              onClick={handleSendBatallas}
              className="shrink-0"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Enviar Batallas ({selectedBatallas.size})
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {batallas.map((batalla) => {
            const isSelected = selectedBatallas.has(batalla.id);
            const message = generateBatallaMessage(batalla);
            const e164 = normalizePhoneE164(batalla.creator.telefono, 'MX');
            
            return (
              <div 
                key={batalla.id}
                className={`flex items-center justify-between rounded-lg border p-3 transition-colors cursor-pointer ${
                  isSelected 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:bg-muted/50'
                }`}
                onClick={() => handleToggleBatalla(batalla.id)}
              >
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={() => handleToggleBatalla(batalla.id)}
                    className="h-4 w-4"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div>
                    <div className="font-medium">{batalla.creator.nombre}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatFecha(batalla.fecha)} · {batalla.hora} · vs {batalla.oponente}
                      {batalla.tipo && ` · ${batalla.tipo}`}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!e164) return;
                    const url = `https://wa.me/${e164}?text=${encodeURIComponent(message)}`;
                    window.open(url, '_blank');
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>

        {batallas.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay batallas programadas pendientes de notificar</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

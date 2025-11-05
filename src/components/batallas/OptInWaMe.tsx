import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { normalizePhoneE164 } from "@/utils/whatsapp";

interface Creator {
  id: string;
  nombre: string;
  telefono: string;
}

export function OptInWaMe() {
  const [loading, setLoading] = useState(false);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [selectedCreators, setSelectedCreators] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCreators();
  }, []);

  const loadCreators = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('creators')
        .select('id, nombre, telefono')
        .eq('status', 'activo')
        .not('telefono', 'is', null)
        .order('nombre');

      if (error) throw error;

      // Filtrar creadores con teléfono válido
      const validCreators = (data || []).filter(c => {
        const normalized = normalizePhoneE164(c.telefono, 'MX');
        return normalized !== null;
      });

      setCreators(validCreators);
    } catch (error: any) {
      console.error('[OptInWaMe] Error cargando creadores:', error);
      toast.error("Error cargando creadores");
    } finally {
      setLoading(false);
    }
  };

  const generateOptInMessage = (nombre: string): string => {
    return `¡Hola ${nombre}! 👋

Este es el Canal Oficial de Comunicación de Batallas SoulLatino. 

¿Deseas recibir notificaciones de tus batallas próximas por este medio?

Responde "Sí" para confirmar. ✅`;
  };

  const handleSelectAll = () => {
    if (selectedCreators.size === creators.length) {
      setSelectedCreators(new Set());
    } else {
      setSelectedCreators(new Set(creators.map(c => c.id)));
    }
  };

  const handleToggleCreator = (creatorId: string) => {
    const newSelected = new Set(selectedCreators);
    if (newSelected.has(creatorId)) {
      newSelected.delete(creatorId);
    } else {
      newSelected.add(creatorId);
    }
    setSelectedCreators(newSelected);
  };

  const handleSendOptIn = () => {
    if (selectedCreators.size === 0) {
      toast.error("Selecciona al menos un creador");
      return;
    }

    const selectedCreatorsList = creators.filter(c => selectedCreators.has(c.id));
    
    // Abrir wa.me para cada creador en nuevas pestañas (con delay)
    selectedCreatorsList.forEach((creator, index) => {
      setTimeout(() => {
        const e164 = normalizePhoneE164(creator.telefono, 'MX');
        if (!e164) return;

        const message = generateOptInMessage(creator.nombre);
        const url = `https://wa.me/${e164}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
      }, index * 500); // 500ms delay entre cada ventana
    });

    toast.success(`✅ Abriendo ${selectedCreators.size} chats de WhatsApp`);
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
    <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-accent" />
              Opt-in WhatsApp (wa.me)
            </CardTitle>
            <CardDescription className="mt-2">
              Envía mensajes de opt-in manuales vía wa.me. Los creadores deben responder "Sí" para abrir la ventana de 24h.
            </CardDescription>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleSelectAll}
              size="sm"
            >
              {selectedCreators.size === creators.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </Button>
            <Button 
              variant="default" 
              disabled={selectedCreators.size === 0}
              onClick={handleSendOptIn}
              className="shrink-0"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Enviar Opt-in ({selectedCreators.size})
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {creators.map((creator) => {
            const isSelected = selectedCreators.has(creator.id);
            const message = generateOptInMessage(creator.nombre);
            const e164 = normalizePhoneE164(creator.telefono, 'MX');
            
            return (
              <div 
                key={creator.id}
                className={`flex items-center justify-between rounded-lg border p-3 transition-colors cursor-pointer ${
                  isSelected 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:bg-muted/50'
                }`}
                onClick={() => handleToggleCreator(creator.id)}
              >
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={() => handleToggleCreator(creator.id)}
                    className="h-4 w-4"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div>
                    <div className="font-medium">{creator.nombre}</div>
                    <div className="text-xs text-muted-foreground">{creator.telefono}</div>
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

        {creators.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay creadores activos con teléfono registrado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

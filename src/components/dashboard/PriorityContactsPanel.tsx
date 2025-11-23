import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Eye, Calendar, TrendingDown, CheckCircle } from 'lucide-react';
import { openWhatsApp } from '@/utils/whatsapp';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatMetrics } from '@/utils/formatMetrics';

interface PriorityContact {
  creator_id: string;
  creator_username: string;
  phone_e164: string | null;
  prioridad_riesgo: number;
  dias_restantes: number;
  faltan_dias: number;
  faltan_horas: number;
  diamantes_actuales: number;
  proximo_objetivo: string;
  horas_min_dia_sugeridas: number;
}

export function PriorityContactsPanel() {
  const [contacts, setContacts] = useState<PriorityContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPriorityContacts();
  }, []);

  const loadPriorityContacts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-recommendations-today');
      
      if (error) throw error;
      
      if (data?.success && data.recommendations) {
        const priorityContacts = data.recommendations
          .filter((r: any) => r.prioridad_riesgo >= 40)
          .slice(0, 5);
        
        setContacts(priorityContacts);
      }
    } catch (error) {
      console.error('Error cargando contactos prioritarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = async (contact: PriorityContact) => {
    if (!contact.phone_e164) {
      toast.error('Este creador no tiene teléfono registrado');
      return;
    }

    const message = `Hola ${contact.creator_username} 👋

Quedan solo ${contact.dias_restantes} días del mes y te queremos apoyar para alcanzar tu meta de ${contact.proximo_objetivo}.

• Te faltan ${formatMetrics.days(contact.faltan_dias)} día(s) en vivo
• Te faltan ${formatMetrics.hours(contact.faltan_horas)}
• Recomiendo ${formatMetrics.hours(contact.horas_min_dia_sugeridas)} por día

⚠️ Si saltas 1 día, podrías perder la bonificación.

¿Puedes confirmar ${formatMetrics.hours(contact.horas_min_dia_sugeridas)} hoy y 5 PKO de 5 min?`;

    try {
      await openWhatsApp({
        phone: contact.phone_e164,
        message,
        creatorId: contact.creator_id,
        creatorName: contact.creator_username,
        actionType: 'bonificaciones'
      });
    } catch (error) {
      toast.error('Error al abrir WhatsApp');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <p className="font-semibold text-lg">¡Todo bajo control!</p>
        <p className="text-sm text-muted-foreground mt-2">
          No hay contactos urgentes por hacer hoy
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {contacts.map((contact, index) => {
        const initials = contact.creator_username.substring(0, 2).toUpperCase();
        const urgencyLevel = 
          contact.dias_restantes <= 5 ? 'critical' :
          contact.dias_restantes <= 10 ? 'high' : 'medium';

        return (
          <Card 
            key={contact.creator_id}
            className={cn(
              "glass-card-hover",
              "animate-slide-in",
              urgencyLevel === 'critical' && "border-2 border-red-500/50",
              urgencyLevel === 'high' && "border-2 border-yellow-500/50"
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <Avatar className="h-14 w-14 border-2 border-primary/30">
                    <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-primary to-accent text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute -top-1 -right-1 w-6 h-6 rounded-full",
                    "flex items-center justify-center text-xs font-bold shadow-lg",
                    urgencyLevel === 'critical' && "bg-gradient-to-br from-red-500 to-red-600 text-white",
                    urgencyLevel === 'high' && "bg-gradient-to-br from-yellow-500 to-yellow-600 text-white",
                    urgencyLevel === 'medium' && "bg-gradient-to-br from-orange-500 to-orange-600 text-white"
                  )}>
                    {index + 1}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-lg truncate">
                      {contact.creator_username}
                    </h4>
                    <Badge 
                      variant="destructive" 
                      className={cn(
                        urgencyLevel === 'critical' && "bg-red-500",
                        urgencyLevel === 'high' && "bg-yellow-500",
                        urgencyLevel === 'medium' && "bg-orange-500"
                      )}
                    >
                      Riesgo: {contact.prioridad_riesgo}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Quedan:</span>
                      <span className="font-semibold">{contact.dias_restantes}d</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingDown className="h-3 w-3 text-red-500" />
                      <span className="text-muted-foreground">Faltan:</span>
                      <span className="font-semibold text-red-500">{contact.faltan_dias}d</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingDown className="h-3 w-3 text-red-500" />
                      <span className="text-muted-foreground">Faltan:</span>
                      <span className="font-semibold text-red-500">{contact.faltan_horas.toFixed(1)}h</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Meta:</span>
                      <span className="font-semibold">{contact.proximo_objetivo}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm"
                      onClick={() => handleWhatsApp(contact)}
                      disabled={!contact.phone_e164}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      WhatsApp
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      asChild
                      className="flex-1"
                    >
                      <Link to={`/supervision/${contact.creator_id}`}>
                        <Eye className="h-3 w-3 mr-1" />
                        Ver Perfil
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      <div className="text-center pt-4 border-t border-white/10">
        <p className="text-sm text-muted-foreground">
          💡 Prioriza estos contactos para maximizar bonificaciones este mes
        </p>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, MessageSquare, Clock } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { interactionService } from "@/services/interactionService";

type Interaction = Tables<"creator_interactions">;

const interactionSchema = z.object({
  tipo: z.string().trim().min(1, "Tipo de interacción requerido").max(100, "Máximo 100 caracteres"),
  notas: z.string().trim().min(1, "Notas requeridas").max(2000, "Máximo 2000 caracteres"),
  admin_nombre: z.string().trim().max(100, "Máximo 100 caracteres").optional(),
});

interface CreatorInteractionsProps {
  creatorId: string;
  interactions: Interaction[];
  onInteractionAdded: () => void;
}

export const CreatorInteractions = ({ 
  creatorId, 
  interactions,
  onInteractionAdded 
}: CreatorInteractionsProps) => {
  const [newInteraction, setNewInteraction] = useState({
    tipo: "",
    notas: "",
    admin_nombre: "",
  });
  const { toast } = useToast();

  const addInteraction = async () => {
    try {
      const validated = interactionSchema.parse(newInteraction);

      await interactionService.recordInteraction(creatorId, {
        tipo: validated.tipo,
        notas: validated.notas,
        admin_nombre: validated.admin_nombre,
      });

      toast({
        title: "✅ Éxito",
        description: "Interacción guardada correctamente",
      });
      
      setNewInteraction({ tipo: "", notas: "", admin_nombre: "" });
      onInteractionAdded();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Error de validación",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "No se pudo guardar la interacción",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card className="neo-card-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          Historial de Interacciones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add interaction form */}
        <div className="space-y-4 p-4 rounded-lg bg-muted/20 border border-border/50">
          <h3 className="font-semibold text-sm text-foreground">Registrar Nueva Interacción</h3>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Interacción</Label>
              <Input
                id="tipo"
                placeholder="ej: Llamada, Mensaje, Reunión"
                value={newInteraction.tipo}
                onChange={(e) => setNewInteraction({ ...newInteraction, tipo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                placeholder="Detalles de la interacción..."
                value={newInteraction.notas}
                onChange={(e) => setNewInteraction({ ...newInteraction, notas: e.target.value })}
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin">Tu Nombre (opcional)</Label>
              <Input
                id="admin"
                placeholder="Nombre del administrador"
                value={newInteraction.admin_nombre}
                onChange={(e) => setNewInteraction({ ...newInteraction, admin_nombre: e.target.value })}
              />
            </div>
            <Button 
              onClick={addInteraction}
              className="w-full"
              disabled={!newInteraction.tipo || !newInteraction.notas}
            >
              Guardar Interacción
            </Button>
          </div>
        </div>

        {/* Interactions list */}
        <div className="space-y-3">
          {interactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay interacciones registradas
            </p>
          ) : (
            interactions.map((interaction) => (
              <div
                key={interaction.id}
                className="p-4 rounded-lg bg-muted/10 border border-border/30 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">{interaction.tipo}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(interaction.created_at || "").toLocaleString()}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  {interaction.notas}
                </p>
                {interaction.admin_nombre && (
                  <p className="text-xs text-muted-foreground pl-6 italic">
                    Por: {interaction.admin_nombre}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

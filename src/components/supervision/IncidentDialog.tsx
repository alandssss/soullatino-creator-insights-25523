import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { SupervisionLogSchema } from "@/core/validation/schemas/supervision";
import { z } from "zod";

interface Creator {
  id: string;
  nombre: string;
}

interface IncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creator: Creator;
  onSuccess: () => void;
}

export function IncidentDialog({ open, onOpenChange, creator, onSuccess }: IncidentDialogProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [reporte, setReporte] = useState("");
  const [severidad, setSeveridad] = useState<"baja" | "media" | "alta">("baja");
  const [accionSugerida, setAccionSugerida] = useState("ninguna");

  // Resetear formulario al abrir
  useEffect(() => {
    if (open) {
      setReporte("");
      setSeveridad("baja");
      setAccionSugerida("ninguna");
    }
  }, [open]);

  const handleSubmit = useCallback(async () => {
    if (!reporte.trim()) {
      toast({
        title: "Campo requerido",
        description: "Debes ingresar un reporte",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Validar datos con Zod antes de enviar
      const validatedData = SupervisionLogSchema.parse({
        creator_id: creator.id,
        observer_name: "Sistema", // Se obtendrá del user context en el backend
        en_vivo: false,
        cumple_normas: false,
        severidad,
        accion_sugerida: accionSugerida.trim() || null,
        reporte: reporte.trim(),
      });

      const { error } = await supabase.functions.invoke('supervision-quicklog', {
        body: {
          creator_id: validatedData.creator_id,
          flags: {
            cumple_normas: validatedData.cumple_normas
          },
          reporte: validatedData.reporte,
          severidad: validatedData.severidad,
          accion_sugerida: validatedData.accion_sugerida
        }
      });

      if (error) throw error;

      toast({
        title: "Incidente reportado",
        description: `Reporte guardado para ${creator.nombre}`,
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error reporting incident:', error);
      
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast({
          title: "Validación fallida",
          description: `${firstError.path.join('.')}: ${firstError.message}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "No se pudo guardar el reporte",
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }, [creator.id, creator.nombre, reporte, severidad, accionSugerida, toast, onOpenChange, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] sm:w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>Reportar Incidente - {creator.nombre}</DialogTitle>
          <DialogDescription>
            Documenta cualquier situación que requiera atención o seguimiento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reporte">Descripción del reporte *</Label>
            <Textarea
              id="reporte"
              placeholder="Describe lo observado..."
              value={reporte}
              onChange={(e) => setReporte(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="severidad">Severidad</Label>
            <Select value={severidad} onValueChange={(v: "baja" | "media" | "alta") => setSeveridad(v)}>
              <SelectTrigger id="severidad">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baja">Baja - Observación general</SelectItem>
                <SelectItem value="media">Media - Requiere atención</SelectItem>
                <SelectItem value="alta">Alta - Acción inmediata</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accion">Acción sugerida</Label>
            <Select value={accionSugerida} onValueChange={setAccionSugerida}>
              <SelectTrigger id="accion">
                <SelectValue placeholder="Selecciona una acción..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ninguna">Sin acción específica</SelectItem>
                <SelectItem value="recordar_normas">Recordar normas</SelectItem>
                <SelectItem value="pausar_live">Pausar temporalmente</SelectItem>
                <SelectItem value="llamar_manager">Contactar manager</SelectItem>
                <SelectItem value="seguimiento_24h">Seguimiento en 24h</SelectItem>
                <SelectItem value="capacitacion">Programar capacitación</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar Reporte
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
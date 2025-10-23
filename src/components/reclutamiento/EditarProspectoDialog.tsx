import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

interface Prospecto {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  tiktok_username: string | null;
  instagram: string | null;
  estado: string;
  notas: string | null;
  agente_asignado: string | null;
  diamantes_estimados: number;
  seguidores_estimados: number;
}

interface EditarProspectoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospecto: Prospecto | null;
  onSuccess?: () => void;
}

const prospectoSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  telefono: z.string().trim().max(20).optional().nullable(),
  email: z.string().trim().email("Email inválido").max(255).optional().nullable().or(z.literal('')),
  tiktok_username: z.string().trim().max(100).optional().nullable(),
  instagram: z.string().trim().max(100).optional().nullable(),
  estado: z.enum(['contactado', 'en_proceso', 'aceptado', 'rechazado']),
  notas: z.string().trim().max(1000).optional().nullable(),
  diamantes_estimados: z.number().min(0).max(10000000).optional(),
  seguidores_estimados: z.number().min(0).max(100000000).optional(),
  agente_asignado: z.string().trim().max(255).optional().nullable(),
});

export const EditarProspectoDialog = ({ open, onOpenChange, prospecto, onSuccess }: EditarProspectoDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    tiktok_username: '',
    instagram: '',
    estado: 'contactado',
    notas: '',
    diamantes_estimados: 0,
    seguidores_estimados: 0,
    agente_asignado: '',
  });

  useEffect(() => {
    if (prospecto) {
      setFormData({
        nombre: prospecto.nombre || '',
        telefono: prospecto.telefono || '',
        email: prospecto.email || '',
        tiktok_username: prospecto.tiktok_username || '',
        instagram: prospecto.instagram || '',
        estado: prospecto.estado || 'contactado',
        notas: prospecto.notas || '',
        diamantes_estimados: prospecto.diamantes_estimados || 0,
        seguidores_estimados: prospecto.seguidores_estimados || 0,
        agente_asignado: prospecto.agente_asignado || '',
      });
    }
  }, [prospecto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prospecto) return;
    
    setLoading(true);

    try {
      const validatedData = prospectoSchema.parse({
        ...formData,
        email: formData.email || null,
        telefono: formData.telefono || null,
        tiktok_username: formData.tiktok_username || null,
        instagram: formData.instagram || null,
        notas: formData.notas || null,
        agente_asignado: formData.agente_asignado || null,
      });

      const { error } = await supabase
        .from('prospectos_reclutamiento')
        .update({
          nombre: validatedData.nombre,
          telefono: validatedData.telefono,
          email: validatedData.email,
          tiktok_username: validatedData.tiktok_username,
          instagram: validatedData.instagram,
          estado: validatedData.estado,
          notas: validatedData.notas,
          diamantes_estimados: validatedData.diamantes_estimados || 0,
          seguidores_estimados: validatedData.seguidores_estimados || 0,
          agente_asignado: validatedData.agente_asignado,
          fecha_ultima_actualizacion: new Date().toISOString(),
        })
        .eq('id', prospecto.id);

      if (error) throw error;

      toast.success('Prospecto actualizado exitosamente');
      onSuccess?.();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        toast.error('Error al actualizar prospecto: ' + error.message);
        console.error('Error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Prospecto</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre completo"
                required
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="+52 123 456 7890"
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="correo@ejemplo.com"
                maxLength={255}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tiktok">TikTok Username</Label>
              <Input
                id="tiktok"
                value={formData.tiktok_username}
                onChange={(e) => setFormData({ ...formData, tiktok_username: e.target.value })}
                placeholder="@username"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                placeholder="@username"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado">Estado *</Label>
              <Select
                value={formData.estado}
                onValueChange={(value) => setFormData({ ...formData, estado: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contactado">Contactado</SelectItem>
                  <SelectItem value="en_proceso">En Proceso</SelectItem>
                  <SelectItem value="aceptado">Aceptado</SelectItem>
                  <SelectItem value="rechazado">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="diamantes">Diamantes Estimados</Label>
              <Input
                id="diamantes"
                type="number"
                value={formData.diamantes_estimados}
                onChange={(e) => setFormData({ ...formData, diamantes_estimados: parseInt(e.target.value) || 0 })}
                placeholder="0"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seguidores">Seguidores Estimados</Label>
              <Input
                id="seguidores"
                type="number"
                value={formData.seguidores_estimados}
                onChange={(e) => setFormData({ ...formData, seguidores_estimados: parseInt(e.target.value) || 0 })}
                placeholder="0"
                min="0"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="agente">Agente Asignado</Label>
              <Input
                id="agente"
                value={formData.agente_asignado}
                onChange={(e) => setFormData({ ...formData, agente_asignado: e.target.value })}
                placeholder="Nombre del agente"
                maxLength={255}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              placeholder="Notas adicionales sobre el prospecto..."
              rows={3}
              maxLength={1000}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="neo-button">
              {loading ? 'Guardando...' : 'Actualizar Prospecto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

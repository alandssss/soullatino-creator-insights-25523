import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface AddBattleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorId: string;
  creatorName: string;
  onBattleCreated?: () => void;
}

export function AddBattleDialog({ 
  open, 
  onOpenChange, 
  creatorId, 
  creatorName,
  onBattleCreated 
}: AddBattleDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fecha: '',
    hora: '',
    oponente: '',
    guantes: '',
    reto: '',
    tipo: 'PK',
    notas: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fecha || !formData.hora || !formData.oponente) {
      toast({
        title: "Campos requeridos",
        description: "Completa fecha, hora y oponente",
        variant: "destructive",
      });
      return;
    }

    // Validar que la fecha no sea en el pasado
    const batallaDate = new Date(`${formData.fecha}T${formData.hora}`);
    if (batallaDate < new Date()) {
      toast({
        title: "Fecha inválida",
        description: "La batalla no puede ser en el pasado",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('batallas')
        .insert([{
          creator_id: creatorId,
          ...formData,
          estado: 'programada'
        }]);
      
      if (error) throw error;
      
      toast({
        title: "✅ Batalla creada",
        description: `Batalla oficial programada para ${creatorName}`,
      });

      // Reset form
      setFormData({
        fecha: '',
        hora: '',
        oponente: '',
        guantes: '',
        reto: '',
        tipo: 'PK',
        notas: '',
      });
      
      onOpenChange(false);
      onBattleCreated?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Nueva Batalla Oficial - {creatorName}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className="neo-input"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <Label>Hora *</Label>
              <Input
                type="time"
                value={formData.hora}
                onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                className="neo-input"
              />
            </div>

            <div>
              <Label>Oponente *</Label>
              <Input
                value={formData.oponente}
                onChange={(e) => setFormData({ ...formData, oponente: e.target.value })}
                placeholder="Nombre del oponente"
                className="neo-input"
              />
            </div>

            <div>
              <Label>Modalidad</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData({ ...formData, tipo: value })}
              >
                <SelectTrigger className="neo-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PK">PK</SelectItem>
                  <SelectItem value="1v1">1v1</SelectItem>
                  <SelectItem value="3 Rondas">3 Rondas</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Guantes/Potenciadores</Label>
              <Input
                value={formData.guantes}
                onChange={(e) => setFormData({ ...formData, guantes: e.target.value })}
                placeholder="Tipo de guantes"
                className="neo-input"
              />
            </div>

            <div>
              <Label>Reto</Label>
              <Input
                value={formData.reto}
                onChange={(e) => setFormData({ ...formData, reto: e.target.value })}
                placeholder="Descripción del reto"
                className="neo-input"
              />
            </div>

            <div className="col-span-2">
              <Label>Notas</Label>
              <Textarea
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                placeholder="Notas adicionales..."
                className="neo-input"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="neo-button" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Batalla"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

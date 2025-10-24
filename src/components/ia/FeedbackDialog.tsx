import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface FeedbackDialogProps {
  recommendationId: string | null;
  creatorId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackDialog({ recommendationId, creatorId, open, onOpenChange }: FeedbackDialogProps) {
  const [seguida, setSeguida] = useState<'yes' | 'no' | null>(null);
  const [resultado, setResultado] = useState<'mejoró' | 'sin_cambio' | 'empeoró' | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!seguida || !recommendationId) return;

    setLoading(true);

    // Obtener diamantes actuales vs. hace 7 días
    const hoy = new Date().toISOString().split('T')[0];
    const hace7dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: dataHoy } = await supabase
      .from('creator_live_daily')
      .select('diamantes')
      .eq('creator_id', creatorId)
      .eq('fecha', hoy)
      .maybeSingle();

    const { data: dataAntes } = await supabase
      .from('creator_live_daily')
      .select('diamantes')
      .eq('creator_id', creatorId)
      .eq('fecha', hace7dias)
      .maybeSingle();

    const diamAntes = dataAntes?.diamantes || 0;
    const diamDespues = dataHoy?.diamantes || 0;

    // Actualizar recomendación
    const { error } = await supabase
      .from('creator_recommendations')
      .update({
        seguida_por_manager: seguida === 'yes',
        fecha_seguimiento: new Date().toISOString(),
        resultado_creador: resultado,
        diam_antes_recomendacion: diamAntes,
        diam_despues_recomendacion: diamDespues,
      })
      .eq('id', recommendationId);

    if (error) {
      toast({ title: 'Error guardando feedback', variant: 'destructive' });
    } else {
      toast({ title: '✅ Gracias por tu feedback. Esto mejora nuestra IA.' });
      onOpenChange(false);
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Feedback de Recomendación IA</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>¿Seguiste esta recomendación con el creador?</Label>
            <RadioGroup value={seguida || ''} onValueChange={(v) => setSeguida(v as 'yes' | 'no')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="yes" />
                <Label htmlFor="yes" className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-green-500" />
                  Sí, la apliqué
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="no" />
                <Label htmlFor="no" className="flex items-center gap-2">
                  <ThumbsDown className="h-4 w-4 text-red-500" />
                  No, usé otra estrategia
                </Label>
              </div>
            </RadioGroup>
          </div>

          {seguida === 'yes' && (
            <div>
              <Label>¿Cómo resultó con el creador?</Label>
              <RadioGroup value={resultado || ''} onValueChange={(v) => setResultado(v as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mejoró" id="mejoró" />
                  <Label htmlFor="mejoró">✅ Mejoró su rendimiento</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sin_cambio" id="sin_cambio" />
                  <Label htmlFor="sin_cambio">➖ Sin cambios notables</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="empeoró" id="empeoró" />
                  <Label htmlFor="empeoró">❌ Empeoró (raro pero posible)</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          <Button onClick={handleSubmit} disabled={!seguida || loading} className="w-full">
            {loading ? 'Guardando...' : 'Enviar Feedback'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

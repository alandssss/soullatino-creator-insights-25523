import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function GraduacionAlert() {
  const [showAlert, setShowAlert] = useState(false);
  const [brecha, setBrecha] = useState(0);

  useEffect(() => {
    checkKPI();
  }, []);

  const checkKPI = async () => {
    try {
      const { data } = await supabase.rpc('kpi_new_creator_graduation');
      
      if (data && data.length > 0) {
        const kpi = data[0];
        
        // Mostrar alerta si estamos por debajo del objetivo
        if (kpi.brecha_porcentual_100k < 0) {
          setShowAlert(true);
          setBrecha(kpi.brecha_porcentual_100k);
        }
      }
    } catch (error) {
      console.error('Error checking graduation KPI:', error);
    }
  };

  if (!showAlert) return null;

  return (
    <Alert variant="destructive" className="mb-6 rounded-xl border-2">
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="text-lg font-bold">
        ⚠️ Alerta: Graduación de Nuevos Creadores por Debajo del Objetivo
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <p>
          Estás <strong>{Math.abs(brecha).toFixed(1)} puntos porcentuales</strong> por debajo del objetivo del 4%.
        </p>
        <p className="text-sm">
          <strong>Acción recomendada:</strong> Prioriza el acompañamiento a creadores nuevos que están cerca del 70% de progreso hacia 100K diamantes.
        </p>
        <div className="flex gap-2 mt-3">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              // Navegar a panel de nuevos creadores
              document.getElementById('nuevos-creadores-panel')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Ver Creadores Nuevos
          </Button>
          <Button 
            size="sm" 
            onClick={() => setShowAlert(false)}
          >
            Entendido
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

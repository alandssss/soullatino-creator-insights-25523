import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { startTour } from '@/lib/onboarding/tour-config';
import { useNavigate } from 'react-router-dom';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  action?: () => void;
  completed: boolean;
}

export function OnboardingChecklist() {
  const navigate = useNavigate();
  
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'upload-data',
      title: 'Sube tu primer archivo de métricas',
      description: 'Importa datos de TikTok usando nuestro template Excel',
      action: () => navigate('/dashboard'),
      completed: false,
    },
    {
      id: 'view-bonificaciones',
      title: 'Revisa bonificaciones del mes',
      description: 'Conoce el progreso de tus creadores',
      action: () => {
        navigate('/bonificaciones');
        setTimeout(() => startTour('bonificaciones'), 500);
      },
      completed: false,
    },
    {
      id: 'generate-ia-advice',
      title: 'Genera tu primera recomendación IA',
      description: 'Usa inteligencia artificial para crear planes de acción',
      completed: false,
    },
    {
      id: 'send-whatsapp',
      title: 'Envía tu primer mensaje por WhatsApp',
      description: 'Comunica resultados directamente a un creador',
      completed: false,
    },
  ]);

  const progress = (steps.filter(s => s.completed).length / steps.length) * 100;

  return (
    <Card className="neo-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Primeros Pasos
        </CardTitle>
        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {Math.round(progress)}% completado
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            {step.completed ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{step.title}</h4>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
            {step.action && !step.completed && (
              <Button size="sm" variant="outline" onClick={step.action}>
                Ir
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, MessageSquare, Target, Zap } from "lucide-react";

export function FeedbackGuide() {
  return (
    <Card className="neo-card-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-accent" />
          Guía para Retroalimentaciones Efectivas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-semibold text-sm mb-1">1. Revisa el Análisis IA</p>
                <p className="text-xs text-muted-foreground">
                  Presiona "Generar Consejos IA" para obtener un análisis completo basado en datos históricos.
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-semibold text-sm mb-1">2. Identifica Metas Alcanzables</p>
                <p className="text-xs text-muted-foreground">
                  Revisa el tab "Bonificaciones" para ver cuánto falta para cada hito (50k, 100k, 300k, 500k, 1M).
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-purple-500 mt-0.5" />
              <div>
                <p className="font-semibold text-sm mb-1">3. Envía Mensaje Personalizado</p>
                <p className="text-xs text-muted-foreground">
                  Usa el botón WhatsApp para enviar el análisis directamente al creador. El mensaje incluye:
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    <li>Resumen de días/horas/diamantes</li>
                    <li>Cuánto falta para cada meta</li>
                    <li>Requerido diario para lograrlo</li>
                  </ul>
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip Pro:</strong> Combina el análisis IA con tu conocimiento del creador para retroalimentación más efectiva.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

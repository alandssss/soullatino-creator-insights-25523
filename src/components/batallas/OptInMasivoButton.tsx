import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MessageSquare, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OptInResult {
  creator_id: string;
  nombre: string;
  telefono: string;
  success: boolean;
  message_sid?: string;
  error?: string;
}

interface OptInResponse {
  success: boolean;
  total: number;
  exitosos: number;
  fallidos: number;
  results: OptInResult[];
}

export function OptInMasivoButton() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<OptInResponse | null>(null);

  const handleSendOptIn = async () => {
    setLoading(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-optin-masivo', {
        method: 'POST'
      });

      if (error) throw error;

      console.log('[OptInMasivo] Resultado:', data);
      setResults(data);

      if (data.exitosos > 0) {
        toast.success(`✅ Opt-in enviado a ${data.exitosos} creadores`);
      }
      if (data.fallidos > 0) {
        toast.error(`⚠️ ${data.fallidos} envíos fallidos`);
      }
    } catch (error: any) {
      console.error('[OptInMasivo] Error:', error);
      toast.error("Error enviando mensajes de opt-in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-accent" />
              Opt-in Masivo WhatsApp
            </CardTitle>
            <CardDescription className="mt-2">
              Envía mensaje de opt-in a todos los creadores activos con teléfono para abrir la ventana de comunicación de 24h
            </CardDescription>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="default" 
                disabled={loading}
                className="shrink-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Enviar Opt-in
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Enviar opt-in masivo?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se enviará un mensaje de opt-in a <strong>todos los creadores activos con teléfono</strong>.
                  <br /><br />
                  Este mensaje les pregunta si desean recibir notificaciones de batallas.
                  <br /><br />
                  ⏱️ El proceso puede tardar varios minutos (500ms entre mensajes).
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleSendOptIn}>
                  Confirmar Envío
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>

      {results && (
        <CardContent>
          <div className="space-y-4">
            {/* Resumen */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border bg-card p-3 text-center">
                <div className="text-2xl font-bold">{results.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="rounded-lg border bg-card p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{results.exitosos}</div>
                <div className="text-xs text-muted-foreground">Exitosos</div>
              </div>
              <div className="rounded-lg border bg-card p-3 text-center">
                <div className="text-2xl font-bold text-destructive">{results.fallidos}</div>
                <div className="text-xs text-muted-foreground">Fallidos</div>
              </div>
            </div>

            {/* Detalle de resultados */}
            <div className="max-h-60 overflow-y-auto space-y-2">
              {results.results.map((result) => (
                <div 
                  key={result.creator_id}
                  className={`flex items-center justify-between rounded-lg border p-2 text-sm ${
                    result.success 
                      ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950' 
                      : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span className="font-medium">{result.nombre}</span>
                    <span className="text-xs text-muted-foreground">{result.telefono}</span>
                  </div>
                  {result.error && (
                    <span className="text-xs text-destructive">{result.error}</span>
                  )}
                  {result.message_sid && (
                    <span className="text-xs text-muted-foreground font-mono">{result.message_sid.slice(-8)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

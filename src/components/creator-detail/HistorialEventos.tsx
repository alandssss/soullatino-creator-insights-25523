import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface Interaction {
  id: string;
  tipo: string;
  notas: string;
  created_at: string;
  admin_nombre?: string;
}

interface HistorialEventosProps {
  interactions: Interaction[];
  onAddInteraction: (data: { tipo: string; notas: string }) => Promise<void>;
}

export function HistorialEventos({ interactions, onAddInteraction }: HistorialEventosProps) {
  const [showForm, setShowForm] = useState(false);
  const [tipo, setTipo] = useState("llamada");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!notas.trim()) {
      toast.error("Las notas son requeridas");
      return;
    }

    setLoading(true);
    try {
      await onAddInteraction({ tipo, notas });
      setNotas("");
      setTipo("llamada");
      setShowForm(false);
      toast.success("Interacción registrada");
    } catch (error) {
      console.error("Error al agregar interacción:", error);
      toast.error("Error al registrar interacción");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Historial de Interacciones</h3>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? "outline" : "default"}
        >
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? "Cancelar" : "Nueva Interacción"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nueva Interacción</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tipo de Interacción</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="llamada">Llamada</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="reunion">Reunión</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="nota">Nota</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notas</Label>
              <Textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Describe la interacción..."
                rows={4}
                maxLength={2000}
              />
            </div>

            <Button onClick={handleSubmit} disabled={loading} className="w-full">
              {loading ? "Guardando..." : "Guardar Interacción"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {interactions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No hay interacciones registradas
            </CardContent>
          </Card>
        ) : (
          interactions.map((interaction) => (
            <Card key={interaction.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium capitalize">{interaction.tipo}</span>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(interaction.created_at), "dd MMM yyyy HH:mm", {
                      locale: es,
                    })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{interaction.notas}</p>
                {interaction.admin_nombre && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Por: {interaction.admin_nombre}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

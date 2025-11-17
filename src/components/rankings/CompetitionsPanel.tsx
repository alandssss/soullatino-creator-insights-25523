import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Trophy, Plus, Calendar, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useToast } from "@/hooks/use-toast";

interface Competition {
  id: string;
  nombre: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  tipo_competencia: string;
  estado: string;
  equipos: any[];
  resultados: any;
}

export function CompetitionsPanel() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    tipo_competencia: 'diamantes',
    equipos: [
      { team: 'Equipo A', managers: [], creators: [], color: '#3b82f6' },
      { team: 'Equipo B', managers: [], creators: [], color: '#ef4444' }
    ]
  });

  const { data: competitions, refetch } = useQuery({
    queryKey: ['competitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_competitions')
        .select('*')
        .order('fecha_inicio', { ascending: false });

      if (error) throw error;
      return data as Competition[];
    }
  });

  const handleCreateCompetition = async () => {
    try {
      const { error } = await supabase
        .from('team_competitions')
        .insert({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          fecha_inicio: formData.fecha_inicio,
          fecha_fin: formData.fecha_fin,
          tipo_competencia: formData.tipo_competencia,
          estado: 'programada',
          equipos: formData.equipos
        });

      if (error) throw error;

      toast({
        title: "✅ Competencia Creada",
        description: "La competencia ha sido creada exitosamente"
      });

      setIsDialogOpen(false);
      refetch();

      // Reset form
      setFormData({
        nombre: '',
        descripcion: '',
        fecha_inicio: '',
        fecha_fin: '',
        tipo_competencia: 'diamantes',
        equipos: [
          { team: 'Equipo A', managers: [], creators: [], color: '#3b82f6' },
          { team: 'Equipo B', managers: [], creators: [], color: '#ef4444' }
        ]
      });

    } catch (error) {
      console.error('Error creando competencia:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la competencia",
        variant: "destructive"
      });
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      programada: { variant: "secondary", label: "📅 Programada" },
      activa: { variant: "default", label: "🔥 En Curso" },
      finalizada: { variant: "outline", label: "✅ Finalizada" }
    };
    
    const config = variants[estado] || variants.programada;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'diamantes': return '💎';
      case 'horas': return '⏰';
      case 'consistencia': return '🔥';
      default: return '🎯';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <CardTitle>Competencias Entre Equipos</CardTitle>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Competencia
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Crear Nueva Competencia</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nombre de la Competencia</Label>
                    <Input
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Ej: Batalla de Diamantes Diciembre"
                    />
                  </div>
                  
                  <div>
                    <Label>Descripción</Label>
                    <Textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      placeholder="Describe el objetivo de la competencia..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Fecha Inicio</Label>
                      <Input
                        type="date"
                        value={formData.fecha_inicio}
                        onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Fecha Fin</Label>
                      <Input
                        type="date"
                        value={formData.fecha_fin}
                        onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Tipo de Competencia</Label>
                    <Select 
                      value={formData.tipo_competencia}
                      onValueChange={(value) => setFormData({ ...formData, tipo_competencia: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="diamantes">💎 Más Diamantes</SelectItem>
                        <SelectItem value="horas">⏰ Más Horas en Vivo</SelectItem>
                        <SelectItem value="consistencia">🔥 Mayor Consistencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleCreateCompetition} className="w-full">
                    Crear Competencia
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {!competitions || competitions.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No hay competencias activas</h3>
              <p className="text-muted-foreground mb-4">Crea una competencia para motivar a tus equipos</p>
            </div>
          ) : (
            <div className="space-y-4">
              {competitions.map((comp) => (
                <Card key={comp.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{getTipoIcon(comp.tipo_competencia)}</span>
                          <h3 className="text-xl font-bold">{comp.nombre}</h3>
                          {getEstadoBadge(comp.estado)}
                        </div>
                        <p className="text-muted-foreground">{comp.descripcion}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(comp.fecha_inicio).toLocaleDateString()} - {new Date(comp.fecha_fin).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        {comp.tipo_competencia}
                      </div>
                    </div>

                    {/* Equipos participantes */}
                    <div className="grid grid-cols-2 gap-4">
                      {comp.equipos?.map((equipo: any, index: number) => (
                        <Card key={index} style={{ borderColor: equipo.color, borderWidth: 2 }}>
                          <CardContent className="p-4">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {equipo.team}
                            </h4>
                            <div className="text-sm text-muted-foreground">
                              <div>Managers: {equipo.managers?.length || 0}</div>
                              <div>Creadores: {equipo.creators?.length || 0}</div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

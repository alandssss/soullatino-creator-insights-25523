import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Phone, Mail, TrendingUp, Users, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NuevoProspectoDialog } from "./NuevoProspectoDialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Prospecto {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  tiktok_username: string | null;
  instagram: string | null;
  estado: string;
  notas: string | null;
  fecha_contacto: string;
  agente_asignado: string | null;
  diamantes_estimados: number;
  seguidores_estimados: number;
}

export const PanelReclutamiento = () => {
  const [prospectos, setProspectos] = useState<Prospecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchProspectos();
  }, []);

  const fetchProspectos = async () => {
    try {
      const { data, error } = await supabase
        .from('prospectos_reclutamiento')
        .select('*')
        .order('fecha_contacto', { ascending: false });

      if (error) throw error;
      setProspectos(data || []);
    } catch (error: any) {
      toast.error('Error al cargar prospectos');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { variant: any; icon: any }> = {
      contactado: { variant: "secondary", icon: Clock },
      en_proceso: { variant: "default", icon: TrendingUp },
      aceptado: { variant: "default", icon: CheckCircle2 },
      rechazado: { variant: "destructive", icon: null },
    };

    const config = estados[estado] || estados.contactado;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        {Icon && <Icon className="h-3 w-3" />}
        {estado.replace('_', ' ')}
      </Badge>
    );
  };

  const totalProspectos = prospectos.length;
  const aceptados = prospectos.filter(p => p.estado === 'aceptado').length;
  const enProceso = prospectos.filter(p => p.estado === 'en_proceso').length;
  const tasaConversion = totalProspectos > 0 ? ((aceptados / totalProspectos) * 100).toFixed(1) : '0';

  return (
    <>
      <div className="space-y-6">
        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="neo-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Prospectos</p>
                  <p className="text-2xl font-bold">{totalProspectos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="neo-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">En Proceso</p>
                  <p className="text-2xl font-bold">{enProceso}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="neo-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aceptados</p>
                  <p className="text-2xl font-bold">{aceptados}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="neo-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conversión</p>
                  <p className="text-2xl font-bold">{tasaConversion}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de Prospectos */}
        <Card className="neo-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Prospectos
              </CardTitle>
              <Button onClick={() => setDialogOpen(true)} className="neo-button">
                <UserPlus className="h-4 w-4 mr-2" />
                Nuevo Prospecto
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : prospectos.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground mb-4">No hay prospectos registrados</p>
                <Button onClick={() => setDialogOpen(true)} variant="outline" className="neo-button">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Agregar Primer Prospecto
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Diamantes Est.</TableHead>
                      <TableHead>Seguidores</TableHead>
                      <TableHead>Agente</TableHead>
                      <TableHead>Fecha Contacto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prospectos.map((prospecto) => (
                      <TableRow key={prospecto.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p>{prospecto.nombre}</p>
                            {prospecto.tiktok_username && (
                              <p className="text-xs text-muted-foreground">@{prospecto.tiktok_username}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {prospecto.telefono && (
                              <span className="flex items-center gap-1 text-xs">
                                <Phone className="h-3 w-3" />
                                {prospecto.telefono}
                              </span>
                            )}
                            {prospecto.email && (
                              <span className="flex items-center gap-1 text-xs">
                                <Mail className="h-3 w-3" />
                                {prospecto.email}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getEstadoBadge(prospecto.estado)}</TableCell>
                        <TableCell>{prospecto.diamantes_estimados.toLocaleString()}</TableCell>
                        <TableCell>{prospecto.seguidores_estimados.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {prospecto.agente_asignado || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {format(new Date(prospecto.fecha_contacto), 'dd MMM yyyy', { locale: es })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <NuevoProspectoDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          fetchProspectos();
          setDialogOpen(false);
        }}
      />
    </>
  );
};

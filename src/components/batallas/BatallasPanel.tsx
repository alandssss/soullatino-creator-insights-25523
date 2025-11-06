import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { dedupeBy, normalizePhone, normalizeName } from "@/lib/dedupe";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Swords, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EnviarBatallasWaMe } from "./EnviarBatallasWaMe";

interface Batalla {
  id: string;
  creator_id: string;
  fecha: string;
  hora: string;
  oponente: string;
  guantes?: string;
  reto?: string;
  tipo?: string;
  notas?: string;
  estado: string;
  creator?: { nombre: string; telefono?: string };
}

export function BatallasPanel() {
  const { toast } = useToast();
  const [batallas, setBatallas] = useState<Batalla[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBatalla, setEditingBatalla] = useState<Batalla | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [batallaToDelete, setBatallaToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    creator_id: '',
    fecha: '',
    hora: '',
    oponente: '',
    guantes: '',
    reto: '',
    tipo: '',
    notas: '',
    estado: 'programada',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load creators
      const { data: creatorsData } = await supabase
        .from('creators')
        .select('id, nombre, telefono')
        .eq('status', 'activo')
        .order('nombre');
      
      // Deduplicar creadores por teléfono normalizado o nombre
      const creatorsWithNorms = (creatorsData || []).map(c => ({
        ...c,
        phoneNorm: normalizePhone(c.telefono),
        nameNorm: normalizeName(c.nombre),
      }));
      
      const uniqueCreators = dedupeBy(creatorsWithNorms, c => c.phoneNorm || c.nameNorm);
      setCreators(uniqueCreators);
      console.log(`[BatallasPanel] Creadores únicos cargados: ${uniqueCreators.length}`);

      // Load batallas
      const { data: batallasData, error } = await supabase
        .from('batallas')
        .select(`
          *,
          creator:creators(nombre, telefono)
        `)
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true });

      if (error) throw error;
      setBatallas(batallasData || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.creator_id || !formData.fecha || !formData.hora || !formData.oponente) {
      toast({
        title: "Campos requeridos",
        description: "Completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingBatalla) {
        const { error } = await supabase
          .from('batallas')
          .update(formData)
          .eq('id', editingBatalla.id);
        
        if (error) throw error;
        
        toast({
          title: "Batalla actualizada",
          description: "La batalla se actualizó correctamente",
        });
      } else {
        const { error } = await supabase
          .from('batallas')
          .insert([formData]);
        
        if (error) throw error;
        
        toast({
          title: "Batalla creada",
          description: "La batalla se creó correctamente",
        });
      }

      setDialogOpen(false);
      setEditingBatalla(null);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (batalla: Batalla) => {
    setEditingBatalla(batalla);
    setFormData({
      creator_id: batalla.creator_id,
      fecha: batalla.fecha,
      hora: batalla.hora,
      oponente: batalla.oponente,
      guantes: batalla.guantes || '',
      reto: batalla.reto || '',
      tipo: batalla.tipo || '',
      notas: batalla.notas || '',
      estado: batalla.estado,
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!batallaToDelete) return;

    try {
      const { error } = await supabase
        .from('batallas')
        .delete()
        .eq('id', batallaToDelete);
      
      if (error) throw error;
      
      toast({
        title: "Batalla eliminada",
        description: "La batalla se eliminó correctamente",
      });
      
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setBatallaToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      creator_id: '',
      fecha: '',
      hora: '',
      oponente: '',
      guantes: '',
      reto: '',
      tipo: '',
      notas: '',
      estado: 'programada',
    });
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'programada':
        return <Badge variant="default">Programada</Badge>;
      case 'completada':
        return <Badge variant="secondary">Completada</Badge>;
      case 'cancelada':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <EnviarBatallasWaMe />
      
      <Card className="neo-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Swords className="h-6 w-6 text-primary" />
              Gestión de Batallas Oficiales
            </CardTitle>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setEditingBatalla(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button className="neo-button">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Batalla
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingBatalla ? 'Editar Batalla' : 'Nueva Batalla'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Creador *</Label>
                      <Select
                        value={formData.creator_id}
                        onValueChange={(value) => setFormData({ ...formData, creator_id: value })}
                      >
                        <SelectTrigger className="neo-input">
                          <SelectValue placeholder="Selecciona un creador" />
                        </SelectTrigger>
                        <SelectContent>
                          {creators.map((creator) => {
                            // Verificar si hay otros creadores con el mismo nombre
                            const duplicatesByName = creators.filter(c => 
                              normalizeName(c.nombre) === normalizeName(creator.nombre)
                            );
                            const hasDuplicateName = duplicatesByName.length > 1;
                            
                            // Generar label distinguible
                            const label = hasDuplicateName
                              ? `${creator.nombre} · ${(creator as any).phoneNorm ? `+${(creator as any).phoneNorm.slice(-4)}` : `ID ${creator.id.slice(-4)}`}`
                              : creator.nombre;
                            
                            return (
                              <SelectItem key={creator.id} value={creator.id}>
                                {label}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Fecha *</Label>
                      <Input
                        type="date"
                        value={formData.fecha}
                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                        className="neo-input"
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
                      <Input
                        value={formData.tipo}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                        placeholder="PK, 1v1, etc."
                        className="neo-input"
                      />
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
                      <Label>Estado</Label>
                      <Select
                        value={formData.estado}
                        onValueChange={(value) => setFormData({ ...formData, estado: value })}
                      >
                        <SelectTrigger className="neo-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="programada">Programada</SelectItem>
                          <SelectItem value="completada">Completada</SelectItem>
                          <SelectItem value="cancelada">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Label>Notas</Label>
                      <Textarea
                        value={formData.notas}
                        onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                        placeholder="Notas adicionales..."
                        className="neo-input"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDialogOpen(false);
                        setEditingBatalla(null);
                        resetForm();
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="neo-button">
                      {editingBatalla ? 'Actualizar' : 'Crear'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {batallas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Swords className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay batallas registradas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Creador</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Oponente</TableHead>
                  <TableHead>Modalidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batallas.map((batalla) => (
                  <TableRow key={batalla.id}>
                    <TableCell className="font-medium">
                      {batalla.creator?.nombre || 'N/A'}
                    </TableCell>
                    <TableCell>{batalla.fecha}</TableCell>
                    <TableCell>{batalla.hora}</TableCell>
                    <TableCell>{batalla.oponente}</TableCell>
                    <TableCell>{batalla.tipo || '-'}</TableCell>
                    <TableCell>{getEstadoBadge(batalla.estado)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(batalla)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setBatallaToDelete(batalla.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar batalla?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La batalla será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

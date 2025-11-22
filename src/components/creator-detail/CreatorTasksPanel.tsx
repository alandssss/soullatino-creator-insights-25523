import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, Clock, AlertCircle, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Task {
  id: string;
  creator_id: string;
  tipo: string;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  descripcion: string;
  fecha_limite: string | null;
  estado: 'pendiente' | 'en_progreso' | 'completada';
  asignado_a: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

interface CreatorTasksPanelProps {
  creatorId: string;
  creatorName: string;
}

export const CreatorTasksPanel = ({ creatorId, creatorName }: CreatorTasksPanelProps) => {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({
    tipo: "",
    prioridad: "media" as Task['prioridad'],
    descripcion: "",
    fecha_limite: "",
    asignado_a: "",
    notas: "",
  });

  useEffect(() => {
    loadTasks();
  }, [creatorId]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('creator_tasks')
        .select('*')
        .eq('creator_id', creatorId)
        .order('fecha_limite', { ascending: true });

      if (error) throw error;
      setTasks((data as Task[]) || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las tareas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { error } = await supabase.from('creator_tasks').insert({
        creator_id: creatorId,
        tipo: newTask.tipo,
        prioridad: newTask.prioridad,
        descripcion: newTask.descripcion,
        fecha_limite: newTask.fecha_limite || null,
        asignado_a: newTask.asignado_a || user.email,
        notas: newTask.notas || null,
        estado: 'pendiente',
      });

      if (error) throw error;

      toast({
        title: "✅ Tarea creada",
        description: "La tarea se creó correctamente",
      });

      setNewTask({
        tipo: "",
        prioridad: "media",
        descripcion: "",
        fecha_limite: "",
        asignado_a: "",
        notas: "",
      });
      setShowAddForm(false);
      loadTasks();
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la tarea",
        variant: "destructive",
      });
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: Task['estado']) => {
    try {
      const { error } = await supabase
        .from('creator_tasks')
        .update({ estado: newStatus, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "✅ Estado actualizado",
        description: `Tarea marcada como ${newStatus}`,
      });

      loadTasks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('¿Eliminar esta tarea?')) return;

    try {
      const { error } = await supabase
        .from('creator_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "🗑️ Tarea eliminada",
        description: "La tarea se eliminó correctamente",
      });

      loadTasks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la tarea",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (prioridad: Task['prioridad']) => {
    switch (prioridad) {
      case 'urgente': return 'bg-red-500/20 text-red-500 border-red-500/30';
      case 'alta': return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
      case 'media': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'baja': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      default: return 'bg-muted';
    }
  };

  const getStatusColor = (estado: Task['estado']) => {
    switch (estado) {
      case 'completada': return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'en_progreso': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      case 'pendiente': return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
      default: return 'bg-muted';
    }
  };

  const tasksByStatus = {
    pendiente: tasks.filter(t => t.estado === 'pendiente'),
    en_progreso: tasks.filter(t => t.estado === 'en_progreso'),
    completada: tasks.filter(t => t.estado === 'completada'),
  };

  if (loading) {
    return (
      <Card className="neo-card-sm">
        <CardHeader>
          <CardTitle>Cargando tareas...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="neo-card-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            Agenda & Tareas - {creatorName}
          </CardTitle>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nueva Tarea
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulario de nueva tarea */}
        {showAddForm && (
          <div className="p-4 rounded-lg bg-muted/20 border border-border/50 space-y-4">
            <h3 className="font-semibold text-sm">Crear Nueva Tarea</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Input
                  placeholder="ej: Llamar, Reunión, Seguimiento"
                  value={newTask.tipo}
                  onChange={(e) => setNewTask({ ...newTask, tipo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select
                  value={newTask.prioridad}
                  onValueChange={(value: Task['prioridad']) => 
                    setNewTask({ ...newTask, prioridad: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Descripción</Label>
                <Textarea
                  placeholder="¿Qué hay que hacer?"
                  value={newTask.descripcion}
                  onChange={(e) => setNewTask({ ...newTask, descripcion: e.target.value })}
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha Límite</Label>
                <Input
                  type="date"
                  value={newTask.fecha_limite}
                  onChange={(e) => setNewTask({ ...newTask, fecha_limite: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Asignado a</Label>
                <Input
                  placeholder="Email del responsable"
                  value={newTask.asignado_a}
                  onChange={(e) => setNewTask({ ...newTask, asignado_a: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Notas</Label>
                <Textarea
                  placeholder="Notas adicionales..."
                  value={newTask.notas}
                  onChange={(e) => setNewTask({ ...newTask, notas: e.target.value })}
                  className="min-h-[60px]"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={createTask}
                disabled={!newTask.tipo || !newTask.descripcion}
                className="flex-1"
              >
                Crear Tarea
              </Button>
              <Button
                onClick={() => setShowAddForm(false)}
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Vista Kanban simple de tareas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pendientes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <h3 className="font-semibold text-sm">Pendientes ({tasksByStatus.pendiente.length})</h3>
            </div>
            <div className="space-y-2">
              {tasksByStatus.pendiente.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={updateTaskStatus}
                  onDelete={deleteTask}
                  getPriorityColor={getPriorityColor}
                  getStatusColor={getStatusColor}
                />
              ))}
              {tasksByStatus.pendiente.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Sin tareas pendientes
                </p>
              )}
            </div>
          </div>

          {/* En Progreso */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <h3 className="font-semibold text-sm">En Progreso ({tasksByStatus.en_progreso.length})</h3>
            </div>
            <div className="space-y-2">
              {tasksByStatus.en_progreso.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={updateTaskStatus}
                  onDelete={deleteTask}
                  getPriorityColor={getPriorityColor}
                  getStatusColor={getStatusColor}
                />
              ))}
              {tasksByStatus.en_progreso.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Sin tareas en progreso
                </p>
              )}
            </div>
          </div>

          {/* Completadas */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <h3 className="font-semibold text-sm">Completadas ({tasksByStatus.completada.length})</h3>
            </div>
            <div className="space-y-2">
              {tasksByStatus.completada.slice(0, 5).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={updateTaskStatus}
                  onDelete={deleteTask}
                  getPriorityColor={getPriorityColor}
                  getStatusColor={getStatusColor}
                />
              ))}
              {tasksByStatus.completada.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Sin tareas completadas
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente auxiliar para la tarjeta de tarea
const TaskCard = ({ 
  task, 
  onStatusChange, 
  onDelete, 
  getPriorityColor, 
  getStatusColor 
}: {
  task: Task;
  onStatusChange: (id: string, status: Task['estado']) => void;
  onDelete: (id: string) => void;
  getPriorityColor: (p: Task['prioridad']) => string;
  getStatusColor: (s: Task['estado']) => string;
}) => {
  return (
    <div className="p-3 rounded-lg bg-muted/10 border border-border/30 space-y-2 group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`${getPriorityColor(task.prioridad)} text-xs`}>
              {task.prioridad}
            </Badge>
            <span className="text-xs font-medium">{task.tipo}</span>
          </div>
          <p className="text-sm">{task.descripcion}</p>
          {task.notas && (
            <p className="text-xs text-muted-foreground italic">{task.notas}</p>
          )}
          {task.fecha_limite && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {format(new Date(task.fecha_limite), 'dd/MM/yyyy')}
            </div>
          )}
          {task.asignado_a && (
            <p className="text-xs text-muted-foreground">
              Asignado: {task.asignado_a}
            </p>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      <div className="flex gap-1">
        <Select
          value={task.estado}
          onValueChange={(value: Task['estado']) => onStatusChange(task.id, value)}
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="en_progreso">En Progreso</SelectItem>
            <SelectItem value="completada">Completada</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

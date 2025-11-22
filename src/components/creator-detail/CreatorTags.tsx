import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, X, Tag as TagIcon } from 'lucide-react';
import { tagsService, TagType, CreatorTag } from '@/services/tagsService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CreatorTagsProps {
  creatorId: string;
  userRole?: string | null;
}

const TAG_COLORS: Record<TagType, string> = {
  'VIP': 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-yellow-500/50',
  'Nuevo': 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500/50',
  'Riesgo Alto': 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-500/50',
  'Potencial 300K': 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-500/50',
  'Graduado': 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-500/50',
  'Inactivo': 'bg-gradient-to-r from-slate-500 to-slate-600 text-white border-slate-500/50',
  'Prioritario': 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-500/50',
  'En Observación': 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white border-cyan-500/50',
};

const AVAILABLE_TAGS: TagType[] = [
  'VIP', 'Nuevo', 'Riesgo Alto', 'Potencial 300K', 
  'Graduado', 'Inactivo', 'Prioritario', 'En Observación'
];

export function CreatorTags({ creatorId, userRole }: CreatorTagsProps) {
  const [tags, setTags] = useState<CreatorTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingTag, setAddingTag] = useState(false);
  const [selectedTag, setSelectedTag] = useState<TagType | null>(null);
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  const canEdit = userRole === 'admin' || userRole === 'manager';

  useEffect(() => {
    loadTags();
  }, [creatorId]);

  const loadTags = async () => {
    setLoading(true);
    try {
      const data = await tagsService.getCreatorTags(creatorId);
      setTags(data);
    } catch (error: any) {
      console.error('Error cargando tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = async () => {
    if (!selectedTag) return;

    setAddingTag(true);
    try {
      await tagsService.assignTag(creatorId, selectedTag, notes);
      await loadTags();
      
      setSelectedTag(null);
      setNotes('');
      
      toast({
        title: 'Tag asignado',
        description: `Se asignó el tag "${selectedTag}" al creador`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setAddingTag(false);
    }
  };

  const handleRemoveTag = async (tag: TagType) => {
    try {
      await tagsService.removeTag(creatorId, tag);
      await loadTags();
      
      toast({
        title: 'Tag removido',
        description: `Se removió el tag "${tag}"`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const availableToAdd = AVAILABLE_TAGS.filter(
    t => !tags.some(tag => tag.tag === t)
  );

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TagIcon className="h-5 w-5" />
            Tags del Creador
          </CardTitle>
          
          {canEdit && availableToAdd.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 glass-card">
                <div className="space-y-4">
                  <div>
                    <Label>Seleccionar Tag</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {availableToAdd.map(tag => (
                        <Button
                          key={tag}
                          size="sm"
                          variant={selectedTag === tag ? 'default' : 'outline'}
                          onClick={() => setSelectedTag(tag)}
                          className="justify-start text-xs"
                        >
                          {tag}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {selectedTag && (
                    <>
                      <div>
                        <Label>Notas (opcional)</Label>
                        <Textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Razón para asignar este tag..."
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                      
                      <Button 
                        onClick={handleAddTag} 
                        disabled={addingTag}
                        className="w-full"
                      >
                        {addingTag ? 'Añadiendo...' : 'Asignar Tag'}
                      </Button>
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : tags.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <TagIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No hay tags asignados</p>
            {canEdit && (
              <p className="text-xs mt-2">Haz clic en "Añadir" para comenzar</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <Badge
                  key={tag.id}
                  className={cn(
                    'px-3 py-2 text-sm font-semibold',
                    'flex items-center gap-2',
                    'shadow-md hover:shadow-lg transition-shadow',
                    TAG_COLORS[tag.tag]
                  )}
                >
                  <span>{tag.tag}</span>
                  {canEdit && (
                    <button
                      onClick={() => handleRemoveTag(tag.tag)}
                      className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            
            {tags.some(t => t.notes) && (
              <div className="pt-4 border-t border-white/10 space-y-2">
                <p className="text-xs text-muted-foreground font-semibold">Notas:</p>
                {tags.filter(t => t.notes).map(tag => (
                  <div key={tag.id} className="text-xs bg-white/5 p-2 rounded">
                    <span className="font-semibold">{tag.tag}:</span> {tag.notes}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

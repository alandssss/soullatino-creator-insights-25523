import { supabase } from '@/integrations/supabase/client';

export type TagType = 'VIP' | 'Nuevo' | 'Riesgo Alto' | 'Potencial 300K' | 'Graduado' | 'Inactivo' | 'Prioritario' | 'En Observación';

export interface CreatorTag {
  id: string;
  creator_id: string;
  tag: TagType;
  assigned_by: string | null;
  assigned_at: string;
  notes: string | null;
}

export class TagsService {
  static async getCreatorTags(creatorId: string): Promise<CreatorTag[]> {
    const { data, error } = await supabase
      .from('creator_tags')
      .select('*')
      .eq('creator_id', creatorId)
      .order('assigned_at', { ascending: false });

    if (error) throw new Error(`Error obteniendo tags: ${error.message}`);
    return data || [];
  }

  static async assignTag(creatorId: string, tag: TagType, notes?: string): Promise<CreatorTag> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('creator_tags')
      .insert({
        creator_id: creatorId,
        tag,
        assigned_by: user?.id,
        notes,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Este tag ya está asignado al creador');
      }
      throw new Error(`Error asignando tag: ${error.message}`);
    }

    return data;
  }

  static async removeTag(creatorId: string, tag: TagType): Promise<void> {
    const { error } = await supabase
      .from('creator_tags')
      .delete()
      .eq('creator_id', creatorId)
      .eq('tag', tag);

    if (error) throw new Error(`Error removiendo tag: ${error.message}`);
  }

  static async getCreatorsByTag(tag: TagType): Promise<string[]> {
    const { data, error } = await supabase
      .from('creator_tags')
      .select('creator_id')
      .eq('tag', tag);

    if (error) throw new Error(`Error obteniendo creadores por tag: ${error.message}`);
    return data?.map(t => t.creator_id) || [];
  }

  static async getTagCounts(): Promise<Record<TagType, number>> {
    const { data, error } = await supabase
      .from('creator_tags')
      .select('tag');

    if (error) throw new Error(`Error obteniendo conteo de tags: ${error.message}`);

    const counts: Record<string, number> = {};
    data?.forEach(t => {
      counts[t.tag] = (counts[t.tag] || 0) + 1;
    });

    return counts as Record<TagType, number>;
  }
}

export const tagsService = TagsService;

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

interface BadgeImageRequest {
  badge_tipo: string;
  badge_nivel?: string | null;
  titulo: string;
  descripcion: string;
}

// Prompts optimizados por tipo de badge
const BADGE_PROMPTS: Record<string, string> = {
  // Badges de diamantes
  diamante_50k: "A premium badge design with a glowing blue diamond gem in the center, surrounded by elegant rays of light. Modern, sleek design with '50K' text prominently displayed. Professional award style with metallic blue and silver gradients. Ultra high resolution.",
  
  diamante_100k: "A silver-tier achievement badge featuring a radiant crystal diamond with prismatic reflections. '100K' displayed in elegant typography. Silver metallic frame with subtle shine effects. Ultra high resolution.",
  
  diamante_300k: "A gold-tier prestige badge with a brilliant golden diamond surrounded by sparkles and light particles. '300K' in bold gold lettering. Luxurious gold and white color scheme with warm glow. Ultra high resolution.",
  
  diamante_500k: "A platinum-tier elite badge featuring a massive, luminous diamond with galaxy-like energy swirls. '500K' in prestigious platinum text. Supreme luxury design with cosmic purple and platinum accents. Ultra high resolution.",
  
  // Badges de consistencia
  racha_7dias: "A fiery achievement badge with stylized flames in vibrant orange and red. '7 Day Streak' text prominently displayed. Dynamic, energetic design conveying consistency and determination. Ultra high resolution.",
  
  racha_14dias: "A silver-flame badge with intensified fire effects, showing two weeks of dedication. '14 Day Streak' in bold silver text. Stronger flame intensity with silver-blue fire colors. Ultra high resolution.",
  
  racha_30dias: "A gold-flame prestige badge with epic, roaring flames. '30 Day Streak' in golden letters. Maximum intensity flames with gold, orange, and white color palette. Legendary achievement aesthetic. Ultra high resolution.",
  
  // Badges de ranking
  top1_semanal: "A champion's golden trophy badge with #1 displayed prominently. Ornate gold design with laurel wreaths and a radiant crown. Premium winner's badge with royal gold and emerald green accents. Ultra high resolution.",
  
  top3_semanal: "A silver podium badge showing a 3-star ranking achievement. Elegant silver medal design with '3' prominently featured. Professional athletic award style with silver and blue tones. Ultra high resolution.",
  
  top10_semanal: "A bronze achievement badge with a '10' inside a shield emblem. Honorable bronze medal design with warm copper tones. Classic award style conveying accomplishment. Ultra high resolution.",
  
  // Badges de horas
  maratonista: "A time-themed badge with stylized clock hands and energy lines. '80+ Hours' displayed clearly. Dynamic design suggesting endurance and dedication with blue and silver time motifs. Ultra high resolution.",
  
  super_maratonista: "A golden time-master badge with dual clocks and epic energy aura. '120+ Hours' in prestigious gold text. Elite endurance achievement with gold, white, and electric blue colors. Ultra high resolution."
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verificar autenticación
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar rol (admin o manager)
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || !['admin', 'manager'].includes(roleData.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Admin or Manager role required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const body = await req.json() as BadgeImageRequest;
    
    console.log(`[generate-badge-image] Generating image for badge: ${body.badge_tipo}`);

    // Obtener prompt específico o usar uno genérico
    const prompt = BADGE_PROMPTS[body.badge_tipo] || 
      `A professional achievement badge design. ${body.titulo}. ${body.descripcion}. Modern, sleek design with vibrant colors. Ultra high resolution.`;

    console.log(`[generate-badge-image] Using prompt: ${prompt.substring(0, 100)}...`);

    // Llamar a Lovable AI para generar la imagen
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        modalities: ['image', 'text']
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`[generate-badge-image] AI API error: ${aiResponse.status} - ${errorText}`);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const imageBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageBase64) {
      console.error('[generate-badge-image] No image returned from AI API');
      throw new Error('No image generated by AI');
    }

    console.log(`[generate-badge-image] Image generated successfully, uploading to storage...`);

    // Convertir base64 a blob
    const base64Data = imageBase64.split(',')[1];
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Crear nombre único para el archivo
    const fileName = `${body.badge_tipo}_${body.badge_nivel || 'default'}_${Date.now()}.png`;
    const filePath = `badges/${fileName}`;

    // Subir a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('badge-images')
      .upload(filePath, binaryData, {
        contentType: 'image/png',
        cacheControl: '31536000', // 1 año
        upsert: false
      });

    if (uploadError) {
      console.error(`[generate-badge-image] Storage upload error:`, uploadError);
      throw uploadError;
    }

    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from('badge-images')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    console.log(`[generate-badge-image] Image uploaded successfully: ${publicUrl}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        image_url: publicUrl,
        badge_tipo: body.badge_tipo
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[generate-badge-image] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

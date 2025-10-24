import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Palette, Save } from 'lucide-react';

export default function BrandingSettings() {
  const [config, setConfig] = useState({
    product_name: 'Soullatino Analytics',
    logo_url: '',
    primary_color: '211 75% 59%',
    accent_color: '211 80% 64%',
    secondary_color: '119 38% 66%',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const { data, error } = await supabase
      .from('tenant_branding')
      .select('*')
      .maybeSingle();

    if (data) setConfig(data);
  };

  const handleSave = async () => {
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('tenant_branding')
      .upsert({
        ...config,
        tenant_id: '00000000-0000-0000-0000-000000000000'
      }, { onConflict: 'tenant_id' });

    if (error) {
      toast({ title: 'Error guardando configuración', variant: 'destructive' });
    } else {
      toast({ title: '✅ Branding actualizado. Recarga la página para ver cambios.' });
      applyBrandingToCSS(config);
    }
    setLoading(false);
  };

  const applyBrandingToCSS = (cfg: any) => {
    document.documentElement.style.setProperty('--primary', cfg.primary_color);
    document.documentElement.style.setProperty('--accent', cfg.accent_color);
    document.documentElement.style.setProperty('--secondary', cfg.secondary_color);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Configuración de Branding</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Personalización de Marca
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Nombre del Producto */}
          <div>
            <Label htmlFor="product-name">Nombre del Producto</Label>
            <Input
              id="product-name"
              value={config.product_name}
              onChange={(e) => setConfig({ ...config, product_name: e.target.value })}
              placeholder="Mi Analytics Pro"
            />
          </div>

          {/* Logo URL */}
          <div>
            <Label htmlFor="logo">URL del Logo</Label>
            <Input
              id="logo"
              value={config.logo_url}
              onChange={(e) => setConfig({ ...config, logo_url: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
            {config.logo_url && (
              <img src={config.logo_url} alt="Logo" className="mt-2 h-16 w-16 object-contain rounded border" />
            )}
          </div>

          {/* Paleta de Colores */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Color Primario (HSL)</Label>
              <Input
                type="text"
                value={config.primary_color}
                onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                placeholder="211 75% 59%"
              />
              <div
                className="mt-2 h-10 rounded border"
                style={{ backgroundColor: `hsl(${config.primary_color})` }}
              />
            </div>
            <div>
              <Label>Color Acento (HSL)</Label>
              <Input
                type="text"
                value={config.accent_color}
                onChange={(e) => setConfig({ ...config, accent_color: e.target.value })}
              />
              <div
                className="mt-2 h-10 rounded border"
                style={{ backgroundColor: `hsl(${config.accent_color})` }}
              />
            </div>
            <div>
              <Label>Color Secundario (HSL)</Label>
              <Input
                type="text"
                value={config.secondary_color}
                onChange={(e) => setConfig({ ...config, secondary_color: e.target.value })}
              />
              <div
                className="mt-2 h-10 rounded border"
                style={{ backgroundColor: `hsl(${config.secondary_color})` }}
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">Vista Previa</h3>
          <div className="p-4 rounded-lg neo-card">
            <div className="flex items-center gap-3">
              {config.logo_url && (
                <img src={config.logo_url} alt="Logo" className="h-10 w-10 object-contain" />
              )}
              <h2
                className="text-2xl font-bold"
                style={{ color: `hsl(${config.primary_color})` }}
              >
                {config.product_name}
              </h2>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

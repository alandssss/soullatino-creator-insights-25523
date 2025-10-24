import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings, Save, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ScoringConfig() {
  const [config, setConfig] = useState({
    peso_dias_en_agencia: 1.5,
    umbral_dias_nuevos: 90,
    umbral_verde_multiplicador: 1.15,
    umbral_amarillo_multiplicador: 0.85,
    bono_por_dia_extra: 3,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const { data } = await supabase
      .from('scoring_weights')
      .select('*')
      .maybeSingle();

    if (data) setConfig(data);
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('scoring_weights')
      .upsert({
        ...config,
        tenant_id: '00000000-0000-0000-0000-000000000000'
      }, { onConflict: 'tenant_id' });

    if (error) {
      toast({ title: 'Error guardando configuración', variant: 'destructive' });
    } else {
      toast({ title: '✅ Configuración de scoring actualizada' });
    }
    setLoading(false);
  };

  const handleReset = () => {
    setConfig({
      peso_dias_en_agencia: 1.5,
      umbral_dias_nuevos: 90,
      umbral_verde_multiplicador: 1.15,
      umbral_amarillo_multiplicador: 0.85,
      bono_por_dia_extra: 3,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Configuración de Scoring Predictivo</h1>
      <p className="text-muted-foreground">
        Ajusta los parámetros del algoritmo de priorización y semáforo según las necesidades de tu negocio.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Parámetros del Algoritmo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Peso Días en Agencia */}
          <div>
            <Label htmlFor="peso-dias">
              Peso para creadores nuevos (&lt;{config.umbral_dias_nuevos} días)
            </Label>
            <div className="flex items-center gap-4 mt-2">
              <Slider
                id="peso-dias"
                min={1}
                max={3}
                step={0.1}
                value={[config.peso_dias_en_agencia]}
                onValueChange={([v]) => setConfig({ ...config, peso_dias_en_agencia: v })}
                className="flex-1"
              />
              <Input
                type="number"
                value={config.peso_dias_en_agencia}
                onChange={(e) => setConfig({ ...config, peso_dias_en_agencia: parseFloat(e.target.value) })}
                className="w-20"
                step={0.1}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Factor de urgencia aplicado a creadores con menos de {config.umbral_dias_nuevos} días en la agencia.
            </p>
          </div>

          {/* Umbral Días Nuevos */}
          <div>
            <Label htmlFor="umbral-dias">Umbral de "creador nuevo" (días en agencia)</Label>
            <Input
              id="umbral-dias"
              type="number"
              value={config.umbral_dias_nuevos}
              onChange={(e) => setConfig({ ...config, umbral_dias_nuevos: parseInt(e.target.value) })}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Creadores con menos de estos días son considerados "nuevos" y reciben prioridad.
            </p>
          </div>

          {/* Semáforo Verde */}
          <div>
            <Label htmlFor="verde">Umbral Verde (ritmo sobresaliente)</Label>
            <div className="flex items-center gap-4 mt-2">
              <Slider
                id="verde"
                min={1}
                max={1.5}
                step={0.05}
                value={[config.umbral_verde_multiplicador]}
                onValueChange={([v]) => setConfig({ ...config, umbral_verde_multiplicador: v })}
                className="flex-1"
              />
              <Input
                type="number"
                value={config.umbral_verde_multiplicador}
                onChange={(e) => setConfig({ ...config, umbral_verde_multiplicador: parseFloat(e.target.value) })}
                className="w-20"
                step={0.05}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Si ritmo_actual ≥ requerido × {config.umbral_verde_multiplicador} → 🟢 Verde
            </p>
          </div>

          {/* Semáforo Amarillo */}
          <div>
            <Label htmlFor="amarillo">Umbral Amarillo (ritmo aceptable)</Label>
            <div className="flex items-center gap-4 mt-2">
              <Slider
                id="amarillo"
                min={0.5}
                max={1}
                step={0.05}
                value={[config.umbral_amarillo_multiplicador]}
                onValueChange={([v]) => setConfig({ ...config, umbral_amarillo_multiplicador: v })}
                className="flex-1"
              />
              <Input
                type="number"
                value={config.umbral_amarillo_multiplicador}
                onChange={(e) => setConfig({ ...config, umbral_amarillo_multiplicador: parseFloat(e.target.value) })}
                className="w-20"
                step={0.05}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Si ritmo_actual ≥ requerido × {config.umbral_amarillo_multiplicador} → 🟡 Amarillo. Por debajo → 🔴 Rojo
            </p>
          </div>

          {/* Bono Extra */}
          <div>
            <Label htmlFor="bono">Bono por día extra (USD)</Label>
            <Input
              id="bono"
              type="number"
              value={config.bono_por_dia_extra}
              onChange={(e) => setConfig({ ...config, bono_por_dia_extra: parseFloat(e.target.value) })}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Cantidad en USD por cada día transmitido por encima de 22 días.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar Valores por Defecto
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ejemplo de Aplicación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Caso 1:</strong> Creador con 50 días en agencia (nuevo), ritmo actual = 12,000 diam/día, requerido = 10,000 diam/día</p>
            <p className="ml-4">
              • Prioridad: <Badge>Alta (× {config.peso_dias_en_agencia})</Badge><br />
              • Semáforo: 12,000 ≥ 10,000 × {config.umbral_verde_multiplicador} = 11,500 → <Badge className="bg-green-500">🟢 Verde</Badge>
            </p>

            <p className="mt-4"><strong>Caso 2:</strong> Creador con 200 días, ritmo actual = 9,500 diam/día, requerido = 10,000 diam/día</p>
            <p className="ml-4">
              • Prioridad: <Badge variant="outline">Normal</Badge><br />
              • Semáforo: 9,500 ≥ 10,000 × {config.umbral_amarillo_multiplicador} = 8,500 → <Badge className="bg-yellow-500">🟡 Amarillo</Badge>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, Loader2, Database, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import { z } from "zod";

// Schema de validación para datos del Excel
const ExcelPayloadSchema = z.array(z.object({
  creator_username: z.string().trim().min(1, "Username requerido").max(100),
  phone_e164: z.string().trim().regex(/^\+?[1-9]\d{1,14}$/, "Teléfono inválido (formato E.164)").max(20).optional().nullable(),
  dias_actuales: z.number().int().min(0).max(31),
  horas_actuales: z.number().min(0).max(744), // Max horas en un mes
  diamantes_actuales: z.number().int().min(0).max(100000000),
  estado_graduacion: z.string().max(100).optional().nullable(),
  manager: z.string().max(100).optional().nullable(),
  grupo: z.string().max(100).optional().nullable(),
}));

export const AdminUploadPanel = () => {
  const [uploading, setUploading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importingPhones, setImportingPhones] = useState(false);
  const [phoneText, setPhoneText] = useState("");
  const [showPhoneImport, setShowPhoneImport] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || 
          selectedFile.type === "application/vnd.ms-excel") {
        setFile(selectedFile);
      } else {
        toast({
          title: "Archivo inválido",
          description: "Por favor selecciona un archivo Excel (.xlsx o .xls)",
          variant: "destructive",
        });
      }
    }
  };

  const processExcelFile = async (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsBinaryString(file);
    });
  };

  const normalizeHeader = (s: string): string => {
    return s
      .normalize('NFKC')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/á/g, 'a')
      .replace(/é/g, 'e')
      .replace(/í/g, 'i')
      .replace(/ó/g, 'o')
      .replace(/ú/g, 'u')
      .replace(/ñ/g, 'n');
  };

  const mapColumnAliases = (headers: string[]): string[] => {
    const alias: Record<string, string> = {
      'nombre': 'Nombre',
      'name': 'Nombre',
      'creador': 'Nombre',
      "creator's username": 'Nombre',
      'nombre de usuario del creador': 'Nombre',
      'id del creador': 'CreatorID',
      'usuario': 'Username',
      'username': 'Username',
      'handle': 'Username',
      '@': 'Username',
      'telefono': 'Teléfono',
      'tel': 'Teléfono',
      'phone': 'Teléfono',
      'grupo': 'Group',
      'agente': 'Manager',
      'dias desde la incorporacion': 'DaysJoined',
      'diamantes': 'Diamonds',
      'duracion de live': 'LiveDuration',
      'dias validos de emisiones live': 'ValidLiveDays',
      'nuevos seguidores': 'NewFollowers',
      'diamantes en el ultimo mes': 'DiamondsLastMonth',
      'duracion de emisiones live (en horas) durante el ultimo mes': 'LiveDurationLastMonth',
      'dias validos de emisiones live del mes pasado': 'ValidLiveDaysLastMonth',
      'nuevos seguidores en el ultimo mes': 'FollowersLastMonth',
      'diamantes - frente al ultimo mes': 'DiamondsVsLastMonth',
      'duracion de live - frente al ultimo mes': 'LiveDurationVsLastMonth',
      'dias validos de emisiones live - frente al ultimo mes': 'ValidDaysVsLastMonth',
      'nuevos seguidores - frente al ultimo mes': 'FollowersVsLastMonth',
      'partidas': 'PKOBattles',
      'estado de graduacion': 'Graduation',
    };

    return headers.map(h => {
      const normalized = normalizeHeader(h);
      return alias[normalized] || h.trim();
    });
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Validar el archivo antes de enviarlo
      const jsonData = await processExcelFile(file);
      
      // Validar con Zod
      try {
        ExcelPayloadSchema.parse(jsonData);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          const firstError = validationError.errors[0];
          toast({
            title: "Datos inválidos en Excel",
            description: `${firstError.path.join('.')}: ${firstError.message}`,
            variant: "destructive",
          });
          return;
        }
      }

      // Enviar el archivo directamente a la función del backend
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const formData = new FormData();
      formData.append('file', file);

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-excel-recommendations`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const payload = await resp.json();
      if (!resp.ok) {
        throw new Error(payload?.error || 'Error al subir el archivo');
      }

      // Verificar cuántas filas se insertaron hoy
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('creator_daily_stats')
        .select('*', { count: 'exact', head: true })
        .eq('fecha', today);

      toast({
        title: "✅ Archivo procesado exitosamente",
        description: `${payload.records_processed || 0} filas procesadas. ${count || 0} registros disponibles para hoy. Recalculando bonificaciones...`,
        duration: 5000,
      });

      // Recalcular bonificaciones del mes actual
      try {
        const mesRef = new Date().toISOString().slice(0, 7) + '-01';
        const { data: bonifData, error: bonifError } = await supabase.functions.invoke('calculate-bonificaciones-unified', {
          body: { mode: 'predictive', mes_referencia: mesRef }
        });

        if (bonifError) {
          console.error('Error recalculando bonificaciones:', bonifError);
          toast({
            title: "⚠️ Advertencia",
            description: "Datos cargados pero error al recalcular bonificaciones",
            variant: "destructive",
          });
        } else {
          console.log('Bonificaciones recalculadas:', bonifData);
          toast({
            title: "✅ Todo listo",
            description: `${bonifData?.total_creadores || 0} bonificaciones actualizadas`,
            duration: 3000,
          });
        }
      } catch (error) {
        console.error('Error en recálculo de bonificaciones:', error);
      }

      setFile(null);
      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // Recargar para ver cambios
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: error?.message || "No se pudo procesar el archivo.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const importarTelefonos = async () => {
    if (!phoneText.trim()) {
      toast({
        title: "Error",
        description: "Pega la lista de teléfonos",
        variant: "destructive",
      });
      return;
    }

    setImportingPhones(true);
    try {
      const lineas = phoneText.trim().split('\n');
      let exitosos = 0;
      let errores = 0;
      let noEncontrados = 0;

      for (const linea of lineas) {
        const partes = linea.split('\t');
        if (partes.length !== 2) continue;

        const [username, telefono] = partes.map(p => p.trim());
        
        // Saltar si es [No Data]
        if (telefono === '[No Data]' || !telefono) {
          noEncontrados++;
          continue;
        }

        try {
          const updatePayload: any = { telefono };
          const { error } = await supabase
            .from('creators')
            .update(updatePayload)
            .eq('tiktok_username', username);

          if (error) throw error;
          exitosos++;
        } catch (err) {
          console.error(`Error actualizando ${username}:`, err);
          errores++;
        }
      }

      toast({
        title: "✅ Teléfonos importados",
        description: `Exitosos: ${exitosos} | Sin datos: ${noEncontrados} | Errores: ${errores}`,
      });

      setPhoneText("");
      setShowPhoneImport(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setImportingPhones(false);
    }
  };

  const seedDemoData = async () => {
    setSeeding(true);
    try {
      // Crear datos demo para octubre 2025 usando la edge function
      const { data, error } = await supabase.functions.invoke('generate-demo-live-data', {
        body: {
          mes_inicio: '2025-10-01',
          cantidad_creadores: 15
        }
      });
      
      if (error) throw error;
      
      const resultado = data?.resultado?.[0];
      toast({
        title: "✅ Datos demo creados",
        description: `${resultado?.registros_creados || 0} registros creados para ${resultado?.creadores_procesados || 0} creadores`,
      });

      // Recalcular bonificaciones automáticamente
      const { error: calcError } = await supabase.functions.invoke('calculate-bonificaciones-predictivo', {
        body: { mes_referencia: '2025-10-01' }
      });

      if (calcError) {
        console.error('Error recalculando bonificaciones:', calcError);
        toast({
          title: "⚠️ Advertencia",
          description: "Datos creados pero no se pudieron calcular bonificaciones. Usa el botón de recalcular en el Panel Predictivo.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "🎯 Bonificaciones calculadas",
          description: "Panel predictivo actualizado con los nuevos datos",
        });
      }
    } catch (error: any) {
      console.error('Error creando datos demo:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron crear los datos demo",
        variant: "destructive",
      });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          Panel de Carga - Solo Admin
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            id="file-upload"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            disabled={uploading}
            className="cursor-pointer"
          />
          {file && (
            <p className="text-sm text-muted-foreground mt-2">
              Archivo seleccionado: {file.name}
            </p>
          )}
        </div>
        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Cargar Datos de Creadores
            </>
          )}
        </Button>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• El archivo debe ser Excel (.xlsx o .xls)</p>
          <p>• Columnas reconocidas: Nombre, Diamantes, Horas, Días en Live, Estado de Graduación, Manager, Grupo</p>
          <p>• Los creadores existentes se actualizarán automáticamente</p>
          <p>• Se actualizarán los campos: estado_graduacion, manager y grupo si están presentes</p>
        </div>

        {/* Panel eliminado - datos demo no necesarios */}

        {/* Importar teléfonos */}
        <div className="pt-4 border-t border-border/50">
          <p className="text-sm font-medium mb-2">📱 Importar Teléfonos</p>
          {!showPhoneImport ? (
            <Button
              onClick={() => setShowPhoneImport(true)}
              variant="outline"
              className="w-full"
            >
              <Phone className="h-4 w-4 mr-2" />
              Cargar Teléfonos de Creadores
            </Button>
          ) : (
            <div className="space-y-2">
              <Textarea
                placeholder="Pega aquí la lista (username[TAB]telefono)&#10;nicolminda	+5216147531946&#10;acharromztm	+5216692609693"
                value={phoneText}
                onChange={(e) => setPhoneText(e.target.value)}
                rows={6}
                className="text-xs font-mono"
              />
              <div className="flex gap-2">
                <Button
                  onClick={importarTelefonos}
                  disabled={importingPhones}
                  className="flex-1"
                  size="sm"
                >
                  {importingPhones ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Phone className="h-4 w-4 mr-2" />
                      Importar
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowPhoneImport(false);
                    setPhoneText("");
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancelar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Formato: username TAB teléfono (uno por línea)
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
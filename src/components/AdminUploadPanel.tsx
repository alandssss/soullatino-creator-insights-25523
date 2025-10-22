import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, Loader2, Database, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";

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
      const excelData = await processExcelFile(file) as any[];
      
      console.log("Datos del Excel - Primeras 2 filas:", excelData.slice(0, 2));
      console.log("Columnas disponibles:", excelData.length > 0 ? Object.keys(excelData[0]) : []);
      
      // Normalizar headers del primer objeto para validación
      if (excelData.length > 0) {
        const originalHeaders = Object.keys(excelData[0]);
        const mappedHeaders = mapColumnAliases(originalHeaders);
        console.log("Headers mapeados:", mappedHeaders);
        
        if (!mappedHeaders.includes('Nombre') && !originalHeaders.includes("Creator's username")) {
          toast({
            title: "❌ Formato inválido",
            description: "Falta la columna 'Nombre' o \"Creator's username\". Revisa tu archivo.",
            variant: "destructive",
          });
          setUploading(false);
          return;
        }
      }
      
      // Mapear los datos del Excel a la estructura de la base de datos
      // Ser más flexible con los nombres de columnas - buscar cualquier variación
      const creatorsData = excelData.map((row: any) => {
        // Función para parsear duración en formato "40h 3m 43s" a horas decimales
        const parseDuration = (duration: string): number => {
          if (!duration) return 0;
          const hourMatch = duration.match(/(\d+)h/);
          const minMatch = duration.match(/(\d+)m/);
          const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
          const minutes = minMatch ? parseInt(minMatch[1]) : 0;
          return hours + (minutes / 60);
        };

        // Función para parsear porcentajes (ej: "42.88%" -> 42.88)
        const parsePercentage = (percent: string): number => {
          if (!percent) return 0;
          const match = percent.toString().match(/-?\d+\.?\d*/);
          return match ? parseFloat(match[0]) : 0;
        };

        // Mapear usando nombres normalizados y originales
        const tiktokUsername = row["Nombre de usuario del creador"] || row["Creator's username"] || row["Nombre"] || "";
        
        // ============================================
        // COLUMNAS CRÍTICAS
        // ============================================
        const diamantes = row["Diamantes"] || row["Diamonds"] || 0;
        const horasLive = parseDuration(row["Duración de LIVE"] || row["LIVE duration"] || "");
        const diasLive = row["Días válidos de emisiones LIVE"] || row["Valid go LIVE days"] || 0;
        const batallasPKO = row["Partidas"] || row["PKO battles"] || row["PKO Battles"] || row["Batallas PKO"] || 0;
        
        // OTRAS COLUMNAS IMPORTANTES
        const diasDesdeInicio = row["Días desde la incorporación"] || row["Days since joining"] || 0;
        
        // DATOS DEL MES PASADO
        const diamantesLastMonth = row["Diamantes en el último mes"] || row["Diamonds last month"] || 0;
        const horasLiveLastMonth = parseDuration(row["Duración de emisiones LIVE (en horas) durante el último mes"] || row["LIVE duration (hours) last month"] || "");
        const diasLiveLastMonth = row["Días válidos de emisiones LIVE del mes pasado"] || row["Valid go LIVE days last month"] || 0;
        const followersLastMonth = row["Nuevos seguidores en el último mes"] || row["New followers last month"] || 0;
        
        // PORCENTAJES DE CRECIMIENTO/DECRECIMIENTO
        const diamondsVsLastMonth = parsePercentage(row["Diamantes - Frente al último mes"] || row["Diamonds - Vs. last month"] || "0");
        const liveDurationVsLastMonth = parsePercentage(row["Duración de LIVE - Frente al último mes"] || row["LIVE duration - Vs. last month"] || "0");
        const validDaysVsLastMonth = parsePercentage(row["Días válidos de emisiones LIVE - Frente al último mes"] || row["Valid go LIVE days - Vs. last month"] || "0");
        const followersVsLastMonth = parsePercentage(row["Nuevos seguidores - Frente al último mes"] || row["New followers - Vs. last month"] || "0");
        
        const followers = row["Nuevos seguidores"] || row["New followers"] || 0;
        const manager = row["Agente"] || row["Creator Network manager"] || null;
        const graduacion = row["Estado de graduación"] || row["Graduation status"] || null;
        
        const grupo = row["Grupo"] || row["Group"] || null;
        
        return {
          nombre: tiktokUsername,
          tiktok_username: tiktokUsername,
          categoria: (grupo && grupo !== "Not in a group" && grupo !== "Sin grupo") ? grupo : null,
          manager: manager,
          status: "activo",
          graduacion: graduacion,
          // COLUMNAS CRÍTICAS H, I, J, AB
          diamantes: diamantes,                    // H
          horas_live: horasLive,                   // I
          dias_live: diasLive,                     // J
          engagement_rate: batallasPKO,            // AB - Batallas PKO (motor de monetización)
          // OTRAS MÉTRICAS
          followers: followers,
          views: 0,
          dias_desde_inicio: diasDesdeInicio,
          last_month_diamantes: diamantesLastMonth,
          last_month_views: 0,
          last_month_engagement: 0,
          horasLiveLastMonth: horasLiveLastMonth,
          diasLiveLastMonth: diasLiveLastMonth,
          followersLastMonth: followersLastMonth,
          // Porcentajes de cambio
          diamondsVsLastMonth: diamondsVsLastMonth,
          liveDurationVsLastMonth: liveDurationVsLastMonth,
          validDaysVsLastMonth: validDaysVsLastMonth,
          followersVsLastMonth: followersVsLastMonth,
        };
      }).filter(creator => creator.nombre && creator.nombre.toString().trim().length > 0);

      console.log("Datos mapeados - Primeros 2:", creatorsData.slice(0, 2));
      console.log("Total de filas con nombre válido:", creatorsData.length);

      if (creatorsData.length === 0) {
        toast({
          title: "❌ Sin datos válidos",
          description: "No se encontraron creadores con nombre válido. Verifica que la columna 'Nombre' o \"Creator's username\" tenga datos.",
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      // Estrategia: UPSERT en creators + INSERT diario en creator_daily_stats
      let successCount = 0;
      let errorCount = 0;

      for (const creatorData of creatorsData) {
        try {
          // 1. UPSERT en tabla creators usando tiktok_username como clave única
          // IMPORTANTE: NO actualizar telefono, email, instagram (son datos de registro permanentes)
          const { data: upsertedCreator, error: upsertError } = await supabase
            .from("creators")
            .upsert({
              tiktok_username: creatorData.tiktok_username,
              nombre: creatorData.nombre,
              // NO incluir: telefono, email, instagram (se preservan los valores existentes)
              categoria: creatorData.categoria,
              manager: creatorData.manager,
              status: creatorData.status,
              graduacion: creatorData.graduacion,
              diamantes: creatorData.diamantes,
              followers: creatorData.followers,
              views: creatorData.views,
              engagement_rate: creatorData.engagement_rate,
              dias_live: creatorData.dias_live,
              horas_live: creatorData.horas_live,
              dias_desde_inicio: creatorData.dias_desde_inicio,
            }, { onConflict: 'tiktok_username' })
            .select()
            .single();

          if (upsertError) throw upsertError;

          // 2. INSERT snapshot diario en creator_daily_stats
          const { error: snapshotError } = await supabase
            .from("creator_daily_stats")
            .insert({
              creator_id: upsertedCreator.id,
              snapshot_date: new Date().toISOString().split('T')[0],
              days_since_joining: creatorData.dias_desde_inicio || 0,
              live_duration_l30d: creatorData.horasLiveLastMonth || 0,
              diamonds_l30d: creatorData.last_month_diamantes || 0,
              diamond_baseline: 0,
              ingreso_estimado: creatorData.last_month_diamantes ? (creatorData.last_month_diamantes * 0.005) : 0,
              followers: creatorData.followers || 0,
              engagement_rate: 0,
            });

          // Si ya existe un snapshot para hoy, ignorar el error de UNIQUE constraint
          if (snapshotError && !snapshotError.message?.includes('duplicate key')) {
            console.warn("Error creando snapshot:", snapshotError);
          }

          // 3. UPSERT en creator_live_daily (datos diarios para bonificaciones)
          const { error: liveError } = await supabase
            .from("creator_live_daily")
            .upsert({
              creator_id: upsertedCreator.id,
              fecha: new Date().toISOString().split('T')[0], // Fecha de hoy
              horas: creatorData.horas_live,                 // Columna I del Excel
              diamantes: creatorData.diamantes,              // Columna H del Excel
            }, { onConflict: 'creator_id,fecha' });

          if (liveError && !liveError.message?.includes('duplicate key')) {
            console.warn("Error guardando datos live:", liveError);
          }

          successCount++;
        } catch (err) {
          console.error("Error con creador:", creatorData.nombre, err);
          errorCount++;
        }
      }

      // Registrar el archivo cargado
      await supabase
        .from("uploaded_reports")
        .insert({
          filename: file.name,
          records_count: successCount,
          processed: true,
        });

      // Calcular bonificaciones automáticamente después de la carga
      console.log("Calculando bonificaciones para el mes actual...");
      const mesActual = new Date().toISOString().slice(0, 7) + '-01'; // '2025-10-01'

      const { error: calcError } = await supabase.functions.invoke('calculate-bonificaciones-predictivo', {
        body: { mes_referencia: mesActual }
      });

      if (calcError) {
        console.error('Error calculando bonificaciones:', calcError);
        toast({
          title: "⚠️ Datos guardados, pero...",
          description: "No se pudieron calcular bonificaciones. Usa el botón Recalcular en el Panel.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "✅ Carga Completa",
          description: `${successCount} creadores actualizados | Datos diarios guardados | Bonificaciones recalculadas`,
        });
      }

      setFile(null);
      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      window.location.reload();
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: "No se pudo procesar el archivo. Revisa la consola para más detalles.",
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
          const { error } = await supabase
            .from('creators')
            .update({ telefono })
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
          <p>• Columnas críticas: H (Diamantes), I (Duración LIVE), J (Días en LIVE), AB (Batallas PKO)</p>
          <p>• Los creadores existentes se actualizarán automáticamente</p>
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
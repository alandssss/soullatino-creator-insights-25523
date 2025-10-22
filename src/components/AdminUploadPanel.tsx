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
        const creatorId = row["ID del creador"] || row["Creator's user ID"] || "";
        const telefono = row["Teléfono"] || row["Phone"] || null;
        
        // ============================================
        // COLUMNAS CRÍTICAS
        // ============================================
        const diamantes = row["Diamantes"] || row["Diamonds"] || 0;
        const horasLive = parseDuration(row["Duración de LIVE"] || row["LIVE duration"] || "");
        const diasLive = row["Días válidos de emisiones LIVE"] || row["Valid go LIVE days"] || 0;
        const batallasPKO = row["Partidas"] || row["PKO battles"] || row["PKO Battles"] || row["Batallas PKO"] || 0;
        
        // OTRAS COLUMNAS IMPORTANTES
        const diasDesdeInicio = row["Días desde la incorporación"] || row["Days since joining"] || 0;
        const fechaIncorporacion = row["Hora de incorporación"] || row["Joining time"] || null;
        
        // DATOS DEL MES PASADO
        const diamantesLastMonth = row["Diamantes en el último mes"] || row["Diamonds last month"] || 0;
        const horasLiveLastMonth = parseDuration(row["Duración de emisiones LIVE (en horas) durante el último mes"] || row["LIVE duration (hours) last month"] || "");
        const diasLiveLastMonth = row["Días válidos de emisiones LIVE del mes pasado"] || row["Valid go LIVE days last month"] || 0;
        const followersLastMonth = row["Nuevos seguidores en el último mes"] || row["New followers last month"] || 0;
        const emisionesLastMonth = row["Emisiones LIVE en el último mes"] || row["LIVE sessions last month"] || 0;
        
        // PORCENTAJES DE LOGRO
        const porcentajeDiamantes = parsePercentage(row["Diamantes - Porcentaje logrado"] || row["Diamonds - Achievement %"] || "0");
        const porcentajeDuracion = parsePercentage(row["Duración de LIVE - Porcentaje logrado"] || row["LIVE duration - Achievement %"] || "0");
        const porcentajeDias = parsePercentage(row["Días válidos de emisiones LIVE - Porcentaje logrado"] || row["Valid go LIVE days - Achievement %"] || "0");
        const porcentajeSeguidores = parsePercentage(row["Nuevos seguidores - Porcentaje logrado"] || row["New followers - Achievement %"] || "0");
        const porcentajeEmisiones = parsePercentage(row["Emisiones LIVE - Porcentaje logrado"] || row["LIVE sessions - Achievement %"] || "0");
        
        // DATOS ADICIONALES
        const ingresosSuscripciones = row["Ingresos por suscripciones"] || row["Subscription earnings"] || 0;
        const suscripcionesCompradas = row["Suscripciones compradas"] || row["Subscriptions purchased"] || 0;
        const suscriptores = row["Suscriptores"] || row["Subscribers"] || 0;
        const diamantesPartidas = row["Diamantes de partidas"] || row["PKO battle diamonds"] || 0;
        const diamantesModoVarios = row["Diamantes del modo de varios invitados"] || row["Multi-guest mode diamonds"] || 0;
        const diamantesAnfitrion = row["Diamantes de varios invitados (como anfitrión)"] || row["Multi-guest diamonds (as host)"] || 0;
        const diamantesInvitado = row["Diamantes del modo de varios invitados (como invitado)"] || row["Multi-guest mode diamonds (as guest)"] || 0;
        const baseDiamantes = row["Base de Diamantes antes de unirse"] || row["Diamond base before joining"] || 0;
        
        const followers = row["Nuevos seguidores"] || row["New followers"] || 0;
        const emisiones = row["Emisiones LIVE"] || row["LIVE sessions"] || 0;
        const manager = row["Agente"] || row["Creator Network manager"] || null;
        const graduacion = row["Estado de graduación"] || row["Graduation status"] || null;
        
        const grupo = row["Grupo"] || row["Group"] || null;
        
        return {
          creator_id: creatorId,
          nombre: tiktokUsername,
          telefono: telefono,
          grupo: grupo,
          agente: manager,
          fecha_incorporacion: fechaIncorporacion,
          dias_desde_incorporacion: diasDesdeInicio,
          estado_graduacion: graduacion,
          base_diamantes_antes_union: baseDiamantes,
          // Métricas actuales
          diamantes: diamantes,
          duracion_live_horas: horasLive,
          dias_validos_live: diasLive,
          nuevos_seguidores: followers,
          emisiones_live: emisiones,
          partidas: batallasPKO,
          diamantes_partidas: diamantesPartidas,
          ingresos_suscripciones: ingresosSuscripciones,
          suscripciones_compradas: suscripcionesCompradas,
          suscriptores: suscriptores,
          diamantes_modo_varios: diamantesModoVarios,
          diamantes_varios_anfitrion: diamantesAnfitrion,
          diamantes_varios_invitado: diamantesInvitado,
          // Métricas del mes pasado
          diamantes_mes: diamantesLastMonth,
          duracion_live_horas_mes: horasLiveLastMonth,
          dias_validos_live_mes: diasLiveLastMonth,
          nuevos_seguidores_mes: followersLastMonth,
          emisiones_live_mes: emisionesLastMonth,
          // Porcentajes de logro
          porcentaje_diamantes: porcentajeDiamantes,
          porcentaje_duracion_live: porcentajeDuracion,
          porcentaje_dias_validos: porcentajeDias,
          porcentaje_seguidores: porcentajeSeguidores,
          porcentaje_emisiones: porcentajeEmisiones,
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

      const fechaHoy = new Date().toISOString().split('T')[0];
      const mesReferencia = new Date().toISOString().slice(0, 7) + '-01';

      for (const creatorData of creatorsData) {
        try {
          // 1. UPSERT en tabla creators usando creator_id como clave única
          const creatorPayload: any = {
            creator_id: creatorData.creator_id,
            nombre: creatorData.nombre,
            tiktok_username: creatorData.nombre,
            telefono: creatorData.telefono,
            grupo: creatorData.grupo,
            agente: creatorData.agente,
            fecha_incorporacion: creatorData.fecha_incorporacion,
            dias_desde_incorporacion: creatorData.dias_desde_incorporacion,
            estado_graduacion: creatorData.estado_graduacion,
            base_diamantes_antes_union: creatorData.base_diamantes_antes_union,
            // Actualizamos métricas visibles en el perfil para que no aparezcan en 0
            diamantes: creatorData.diamantes,
            horas_live: creatorData.duracion_live_horas,
            dias_live: creatorData.dias_validos_live,
          };

          // Intentar UPSERT por creator_id; si la tabla no tiene constraint único, hacer fallback a select/update
          let upsertedCreator: any = null;
          const upsertResp = await supabase
            .from("creators")
            .upsert(creatorPayload, { onConflict: 'creator_id' })
            .select()
            .maybeSingle();

          if (upsertResp.error && upsertResp.error.message?.toLowerCase().includes('no unique')) {
            // Fallback: buscar por creator_id y actualizar o insertar
            const existing = await supabase
              .from("creators")
              .select("*")
              .eq("creator_id", creatorPayload.creator_id)
              .maybeSingle();

            if (existing.data) {
              const updateRes = await supabase
                .from("creators")
                .update(creatorPayload)
                .eq("id", existing.data.id)
                .select()
                .single();
              if (updateRes.error) throw updateRes.error;
              upsertedCreator = updateRes.data;
            } else {
              const insertRes = await supabase
                .from("creators")
                .insert(creatorPayload)
                .select()
                .single();
              if (insertRes.error) throw insertRes.error;
              upsertedCreator = insertRes.data;
            }
          } else if (upsertResp.error) {
            throw upsertResp.error;
          } else {
            upsertedCreator = upsertResp.data;
          }

          // 2. INSERT/UPDATE estadísticas diarias
          const dailyPayload: any = {
            creator_id: upsertedCreator!.id,
            fecha: fechaHoy,
            diamantes: creatorData.diamantes,
            duracion_live_horas: creatorData.duracion_live_horas,
            dias_validos_live: creatorData.dias_validos_live,
            nuevos_seguidores: creatorData.nuevos_seguidores,
            emisiones_live: creatorData.emisiones_live,
            partidas: creatorData.partidas,
            diamantes_partidas: creatorData.diamantes_partidas,
            ingresos_suscripciones: creatorData.ingresos_suscripciones,
            suscripciones_compradas: creatorData.suscripciones_compradas,
            suscriptores: creatorData.suscriptores,
            diamantes_modo_varios: creatorData.diamantes_modo_varios,
            diamantes_varios_anfitrion: creatorData.diamantes_varios_anfitrion,
            diamantes_varios_invitado: creatorData.diamantes_varios_invitado,
          };

          let dailyError = null as any;
          try {
            const resp = await supabase
              .from("creator_daily_stats")
              .upsert(dailyPayload, { onConflict: 'creator_id,fecha' });
            dailyError = resp.error;
            if (dailyError && dailyError.message?.toLowerCase().includes('no unique')) {
              // Fallback: insertar directo
              const insertResp = await supabase.from("creator_daily_stats").insert(dailyPayload);
              dailyError = insertResp.error;
            }
          } catch (e: any) {
            dailyError = e;
          }

          if (dailyError && !dailyError.message?.includes('duplicate key')) {
            console.warn("Error guardando estadísticas diarias:", dailyError);
          }

          // 3. INSERT/UPDATE estadísticas mensuales
          const monthlyPayload: any = {
            creator_id: upsertedCreator!.id,
            mes_referencia: mesReferencia,
            diamantes_mes: creatorData.diamantes_mes,
            duracion_live_horas_mes: creatorData.duracion_live_horas_mes,
            dias_validos_live_mes: creatorData.dias_validos_live_mes,
            nuevos_seguidores_mes: creatorData.nuevos_seguidores_mes,
            emisiones_live_mes: creatorData.emisiones_live_mes,
            porcentaje_diamantes: creatorData.porcentaje_diamantes,
            porcentaje_duracion_live: creatorData.porcentaje_duracion_live,
            porcentaje_dias_validos: creatorData.porcentaje_dias_validos,
            porcentaje_seguidores: creatorData.porcentaje_seguidores,
            porcentaje_emisiones: creatorData.porcentaje_emisiones,
          };

          const { error: monthlyError } = await supabase
            .from("creator_monthly_stats")
            .upsert(monthlyPayload, { onConflict: 'creator_id,mes_referencia' });

          

          successCount++;
        } catch (err) {
          console.error("Error con creador:", creatorData.nombre, err);
          errorCount++;
        }
      }

      // Refrescar vista materializada de recomendaciones
      try {
        const { error: refreshError } = await supabase.rpc('refresh_recommendations_today');
        if (refreshError) {
          console.warn('No se pudo refrescar recomendaciones:', refreshError);
        } else {
          console.log('✅ Vista de recomendaciones refrescada exitosamente');
        }
      } catch (refreshErr) {
        console.warn('Error al refrescar recomendaciones:', refreshErr);
      }

      toast({
        title: "✅ Carga Completa",
        description: `${successCount} creadores guardados con todos sus datos incluyendo teléfonos. ${errorCount > 0 ? `Errores: ${errorCount}` : ''}`,
      });

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

      // Refrescar vista materializada de recomendaciones
      try {
        const { error: refreshError } = await supabase.rpc('refresh_recommendations_today');
        if (refreshError) {
          console.warn('No se pudo refrescar recomendaciones:', refreshError);
        } else {
          console.log('✅ Vista de recomendaciones refrescada exitosamente');
        }
      } catch (refreshErr) {
        console.warn('Error al refrescar recomendaciones:', refreshErr);
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
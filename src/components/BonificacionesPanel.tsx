import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Award, Calendar, Target, Zap, Loader2, Gem, Clock, MessageSquare, Clipboard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { creatorAnalytics } from "@/services/creatorAnalytics";
import { MilestoneCard } from "@/components/shared/MilestoneCard";
import { RootCausePanel } from "@/components/bonificaciones/RootCausePanel";
import WhatsappButton from "@/components/WhatsappButton";
import { supabase } from "@/integrations/supabase/client";
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardContent } from "@/components/neo/NeoCard";
import { NeoKPICard } from "@/components/neo/NeoKPICard";
import { cn } from "@/lib/utils";
import { formatMetrics } from "@/utils/formatMetrics";

interface BonificacionesPanelProps {
  creatorId: string;
  creatorName: string;
  tiktok_username?: string;
  creatorPhone?: string | null;
}

export const BonificacionesPanel = ({ creatorId, creatorName, tiktok_username, creatorPhone }: BonificacionesPanelProps) => {
  const [bonificacion, setBonificacion] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    setUserRole(rolesData?.role || null);
  };

  useEffect(() => {
    loadBonificacion();
  }, [creatorId]);

  const loadBonificacion = async () => {
    setLoading(true);
    try {
      const mesActual = new Date();
      const mesReferencia = `${mesActual.getFullYear()}-${String(mesActual.getMonth() + 1).padStart(2, '0')}-01`;

      const bonificaciones: any[] = await creatorAnalytics.getBonificaciones(mesReferencia);
      const bonifCreator: any = bonificaciones.find((b: any) => b.creator_id === creatorId);

      // Obtener días reales desde Supabase (si está disponible)
      if (bonifCreator) {
        const diasRealesData: any = await creatorAnalytics.getDiasRealesMes(creatorId);
        if (diasRealesData) {
          bonifCreator.dias_live_mes = diasRealesData.dias_reales_hasta_hoy || bonifCreator.dias_live_mes;
          bonifCreator.horas_live_mes = diasRealesData.horas_totales_mes || bonifCreator.horas_live_mes;
        }
      }

      setBonificacion(bonifCreator || null);
    } catch (error) {
      console.error('Error cargando bonificación:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo cargar la bonificación",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calcularBonificacion = async () => {
    setCalculating(true);
    try {
      await creatorAnalytics.calcularBonificaciones();

      toast({
        title: "✅ Bonificación calculada",
        description: "Las bonificaciones han sido actualizadas",
      });

      await loadBonificacion();
    } catch (error) {
      console.error('Error calculando bonificación:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo calcular la bonificación",
        variant: "destructive",
      });
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-accent" />
            Bonificaciones del Mes
          </CardTitle>
          <Button
            onClick={calcularBonificacion}
            disabled={calculating}
            size="sm"
            variant="outline"
          >
            {calculating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Calculando...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Calcular
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {bonificacion && creatorPhone && (
          <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
            <p className="text-xs text-muted-foreground mb-2">
              💬 Enviar resumen de bonificaciones
            </p>
            <WhatsappButton
              phone={creatorPhone}
              country="MX"
              message={`Hola ${creatorName}! 📊\n\nResumen del mes:\n• Días: ${bonificacion.dias_live_mes || 0}\n• Horas: ${bonificacion.horas_live_mes?.toFixed(1) || 0}h\n• Diamantes: ${(bonificacion.diam_live_mes || 0).toLocaleString()} 💎\n\nMeta: ${bonificacion.meta_recomendada || bonificacion.proximo_objetivo_valor || 'Sin meta'}\n\n${bonificacion.texto_creador || ''}`}
              className="w-full"
            />
          </div>
        )}

        {!bonificacion ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No hay datos calculados para este mes</p>
            <Button onClick={calcularBonificacion} disabled={calculating}>
              <Zap className="h-4 w-4 mr-2" />
              Calcular Bonificaciones
            </Button>
          </div>
        ) : (
          <>
            {/* Métricas del Mes */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                LIVE del Mes (hasta ayer)
              </h3>
              <div className="grid grid-cols-3 gap-6">
                <NeoKPICard
                  label="Días Live"
                  value={formatMetrics.days(bonificacion.dias_live_mes)}
                  insight="Meta: 22 días para bono completo"
                  icon={Calendar}
                  variant="default"
                />
                <NeoKPICard
                  label="Horas Live"
                  value={formatMetrics.hours(bonificacion.horas_live_mes)}
                  insight={bonificacion.dias_live_mes > 0
                    ? `Promedio ${formatMetrics.hours(bonificacion.horas_live_mes / bonificacion.dias_live_mes)}/día`
                    : 'Sin actividad aún'}
                  icon={Clock}
                  variant="default"
                />
                <NeoKPICard
                  label="Diamantes"
                  value={formatMetrics.diamonds(bonificacion.diam_live_mes)}
                  insight={bonificacion.proximo_objetivo_valor
                    ? `Meta: ${bonificacion.proximo_objetivo_valor}`
                    : 'Trabaja hacia tu primera meta'}
                  icon={Gem}
                  variant="primary"
                />
              </div>
            </div>

            {/* Meta y Progreso */}
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5" />
                  Meta Recomendada
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-xl sm:text-2xl">{bonificacion?.meta_recomendada || bonificacion?.proximo_objetivo_valor || "Sin meta"}</p>
                  {bonificacion?.cerca_de_objetivo && (
                    <Badge variant="default" className="shrink-0">
                      ¡Cerca de {bonificacion?.proximo_objetivo_valor}!
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Mensaje para el Creador - SIEMPRE visible */}
            <NeoCard variant="elevated" padding="md">
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1 space-y-3">
                  <h4 className="font-semibold text-sm">💬 Mensaje Personalizado</h4>
                  <p className="text-sm text-muted-foreground">
                    {bonificacion?.texto_creador ||
                      `¡Hola @${tiktok_username || creatorName}! 🌟 Sigue trabajando para alcanzar tus metas este mes. Revisa tus estadísticas y mantente en contacto con tu manager para estrategias personalizadas. ¡Tú puedes lograrlo! 💪`}
                  </p>
                  {creatorPhone && (
                    <WhatsappButton
                      phone={creatorPhone}
                      country="MX"
                      message={bonificacion?.texto_creador ||
                        `Hola @${tiktok_username || creatorName}! Quiero revisar tu progreso del mes contigo y apoyarte para alcanzar tus metas. ¿Cuándo podemos conversar?`}
                      className="w-full"
                    />
                  )}
                </div>
              </div>
            </NeoCard>

            {/* Notas para el Manager */}
            {bonificacion?.texto_manager && (userRole === 'admin' || userRole === 'manager') && (
              <NeoCard variant="elevated" padding="md">
                <div className="flex items-start gap-3">
                  <Clipboard className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-2">📋 Notas de Manager</h4>
                    <p className="text-sm text-muted-foreground">{bonificacion.texto_manager}</p>
                  </div>
                </div>
              </NeoCard>
            )}

            {/* Semáforos de Metas */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                Estado de Metas Diamantes
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {[
                  { key: 'semaforo_100k', label: '100K', faltan: bonificacion?.faltan_100k, req: bonificacion?.req_diam_por_dia_100k },
                  { key: 'semaforo_300k', label: '300K', faltan: bonificacion?.faltan_300k, req: bonificacion?.req_diam_por_dia_300k },
                  { key: 'semaforo_500k', label: '500K', faltan: bonificacion?.faltan_500k, req: bonificacion?.req_diam_por_dia_500k },
                  { key: 'semaforo_1m', label: '1M', faltan: bonificacion?.faltan_1m, req: bonificacion?.req_diam_por_dia_1m },
                ].map((meta) => {
                  const semaforo = bonificacion?.[meta.key] || 'rojo';
                  const icon = semaforo === 'verde' ? '🟢' : semaforo === 'amarillo' ? '🟡' : '🔴';
                  const faltan = meta.faltan ?? 0;
                  return (
                    <NeoCard
                      key={meta.key}
                      variant="flat"
                      padding="sm"
                      className={cn(
                        "text-center transition-all",
                        semaforo === 'verde' && "ring-1 ring-green-500/30",
                        semaforo === 'amarillo' && "ring-1 ring-yellow-500/30",
                        semaforo === 'rojo' && "ring-1 ring-red-500/30"
                      )}
                      title={`Faltan: ${faltan.toLocaleString()} | Req/día: ${(meta.req ?? 0).toLocaleString()}`}
                    >
                      <p className="text-xs font-medium flex items-center justify-center gap-1">
                        {icon} {meta.label}
                      </p>
                      {faltan > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          -{(faltan / 1000).toFixed(0)}k
                        </p>
                      )}
                    </NeoCard>
                  );
                })}
              </div>
            </div>

            {/* Hitos con progreso */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                Hitos Días/Horas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MilestoneCard
                  label="12d/40h"
                  daysRequired={12}
                  hoursRequired={40}
                  currentDays={bonificacion.dias_live_mes || 0}
                  currentHours={bonificacion.horas_live_mes || 0}
                  onOpenPlan={() => {
                    toast({
                      title: "Plan del Día",
                      description: "Funcionalidad en desarrollo",
                    });
                  }}
                />
                <MilestoneCard
                  label="20d/60h"
                  daysRequired={20}
                  hoursRequired={60}
                  currentDays={bonificacion.dias_live_mes || 0}
                  currentHours={bonificacion.horas_live_mes || 0}
                  onOpenPlan={() => {
                    toast({
                      title: "Plan del Día",
                      description: "Funcionalidad en desarrollo",
                    });
                  }}
                />
                <MilestoneCard
                  label="22d/80h"
                  daysRequired={22}
                  hoursRequired={80}
                  currentDays={bonificacion.dias_live_mes || 0}
                  currentHours={bonificacion.horas_live_mes || 0}
                  onOpenPlan={() => {
                    toast({
                      title: "Plan del Día",
                      description: "Funcionalidad en desarrollo",
                    });
                  }}
                />
              </div>
            </div>

            {/* Bono Extra */}
            {((bonificacion?.bono_dias_extra_usd ?? 0) > 0 || (bonificacion?.bono_extra_usd ?? 0) > 0) && (
              <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      🎁 Bono por Constancia
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Días por encima de 22
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${(bonificacion.bono_dias_extra_usd || bonificacion.bono_extra_usd || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">USD</p>
                  </div>
                </div>
              </div>
            )}

            {/* Indicador de creador nuevo */}
            {(bonificacion?.es_nuevo_menos_90_dias || bonificacion?.es_prioridad_300k) && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  🌟 Creador Nuevo (menos de 90 días)
                </p>
              </div>
            )}

            {/* Root Cause Analysis */}
            <RootCausePanel bonificacion={bonificacion} />

            {/* Última actualización */}
            <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border/50">
              Última actualización: {bonificacion?.fecha_calculo ? new Date(bonificacion.fecha_calculo).toLocaleDateString('es-MX') : 'Hoy'}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

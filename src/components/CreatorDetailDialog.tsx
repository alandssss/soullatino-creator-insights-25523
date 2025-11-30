import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import WhatsappButton from "@/components/WhatsappButton";
import { buildWaMessage } from "@/utils/whatsapp";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { NeoButton } from "@/components/neo/NeoButton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, TrendingUp, Target, Sparkles, Loader2, Award, ArrowUp, ArrowDown, Minus, Eye, MessageSquare } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { BonificacionesPanel } from "./BonificacionesPanel";
import { interactionService } from "@/services/interactionService";
import { AsignarMetaDialog } from "./AsignarMetaDialog";
import { CreatorBasicInfo } from "./creator-detail/CreatorBasicInfo";
import { CreatorInteractions } from "./creator-detail/CreatorInteractions";
import { FeedbackGuide } from "./FeedbackGuide";
import { AlertCircle, Lightbulb, Swords } from "lucide-react";
import { CreatorRiskPanel } from "./creator-detail/CreatorRiskPanel";
import { CreatorBattlesPanel } from "./creator-detail/CreatorBattlesPanel";
import { CreatorSupervisionHistory } from "./creator-detail/CreatorSupervisionHistory";
import { CreatorMetricsPanel } from "./creator-detail/CreatorMetricsPanel";
import { WhatsAppPreviewModal } from "./creator-detail/WhatsAppPreviewModal";
import { DebugStats } from "./creator-detail/DebugStats";
import { creatorMetricsService } from "@/services/creatorMetricsService";
import { getCreatorDisplayName } from "@/utils/creator-display";

type Creator = Tables<"creators">;
type Interaction = Tables<"creator_interactions">;

interface CreatorDetailDialogProps {
  creator: Creator | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreatorDetailDialog = ({ creator, open, onOpenChange }: CreatorDetailDialogProps) => {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [aiAdvice, setAiAdvice] = useState<string>("");
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [milestone, setMilestone] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [metaDialogOpen, setMetaDialogOpen] = useState(false);
  const [whatsappPreview, setWhatsappPreview] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [dailyStats, setDailyStats] = useState<any>(null);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [dailyMessage, setDailyMessage] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Lectura robusta de rol
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("role, created_at")
      .eq("user_id", user.id);

    // Priorizar roles: admin > manager > supervisor > viewer
    const priority: Record<string, number> = { admin: 4, manager: 3, supervisor: 2, viewer: 1 };
    const sortedRoles = (rolesData || []).sort((a, b) => (priority[b.role] || 0) - (priority[a.role] || 0));

    setUserRole(sortedRoles[0]?.role || null);
  };

  // Cargar recomendación al abrir modal y suscribirse a cambios en tiempo real
  useEffect(() => {
    if (open && creator) {
      fetchInteractions();
      loadLatestRecommendation();
      loadDailyStats();

      // Suscribirse a cambios en tiempo real de interacciones
      const channel = supabase
        .channel('creator-interactions-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'creator_interactions',
            filter: `creator_id=eq.${creator.id}`
          },
          () => {
            fetchInteractions(); // Recargar cuando haya cambios
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      // Limpiar al cerrar
      setAiAdvice("");
      setMilestone("");
    }
  }, [open, creator]);

  const [dailyStatsLoading, setDailyStatsLoading] = useState(false);
  const [dailyStatsError, setDailyStatsError] = useState<string | null>(null);
  const loadDailyStats = async () => {
    if (!creator) return;
    setDailyStatsLoading(true);
    setDailyStatsError(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('creator_daily_stats')
        .select('*')
        .eq('creator_id', creator.id)
        .eq('fecha', today)
        .maybeSingle();

      if (error) {
        console.error('Error cargando stats diarias:', error);
        setDailyStatsError(error.message || 'Error al cargar estadísticas');
        toast({
          title: 'Error',
          description: error.message || 'Error al cargar estadísticas diarias',
          variant: 'destructive'
        });
      } else {
        setDailyStats(data);
      }
    } catch (error: any) {
      console.error('Error:', error);
      setDailyStatsError(error.message || 'Error inesperado');
      toast({
        title: 'Error',
        description: error.message || 'Error inesperado al cargar estadísticas',
        variant: 'destructive'
      });
    } finally {
      setDailyStatsLoading(false);
    }
  };

  const fetchInteractions = async () => {
    if (!creator) return;

    try {
      const data = await interactionService.getInteractions(creator.id);
      setInteractions(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar las interacciones",
        variant: "destructive",
      });
    }
  };

  // Cargar la recomendación más reciente de la base de datos
  const loadLatestRecommendation = async () => {
    if (!creator) return;

    setLoadingAdvice(true);
    try {
      const data = await interactionService.getLatestRecommendation(creator.id);

      if (data) {
        setAiAdvice(data.advice);
        setMilestone(data.milestone);
      }
    } catch (error: any) {
      console.error('Error cargando recomendación:', error);
    } finally {
      setLoadingAdvice(false);
    }
  };

  // Generar NUEVA recomendación inteligente
  const generateAIAdvice = async () => {
    if (!creator) return;

    console.log('[CreatorDetailDialog] Generando consejo para creator:', creator.id, creator.nombre);
    setLoadingAdvice(true);
    try {
      const response = await interactionService.generateAdvice(creator.id);

      console.log('[CreatorDetailDialog] Consejo recibido:', response);
      setAiAdvice(response.advice);
      setMilestone(response.milestone || '');

      toast({
        title: "✨ Recomendación generada",
        description: response.milestoneDescription
          ? `Hito: ${response.milestoneDescription}`
          : "Recomendación creada exitosamente",
      });
    } catch (error: any) {
      console.error('[CreatorDetailDialog] Error completo al generar consejo:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo generar la recomendación. Verifica que existan datos históricos.",
        variant: "destructive",
      });
    } finally {
      setLoadingAdvice(false);
    }
  };


  const handleOpenWhatsApp = async () => {
    if (!creator) return;

    // Validar número de teléfono en formato E.164
    const phone = creator?.telefono;
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phone || !phoneRegex.test(phone)) {
      toast({
        title: 'Error',
        description: 'Número de teléfono no válido o no registrado. No se puede abrir WhatsApp.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userName = user?.email?.split('@')[0] || "el equipo";
      const message = await interactionService.generateWhatsAppMessage(creator, userName);

      await interactionService.sendWhatsAppMessage(creator, message, 'seguimiento');

      toast({
        title: "✅ WhatsApp abierto",
        description: "Mensaje listo para enviar"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const generateWhatsAppSummary = async (userName: string = "el equipo") => {
    if (!creator) return "";
    return await interactionService.generateWhatsAppMessage(creator, userName);
  };

  const loadWhatsAppPreview = async () => {
    if (!creator || loadingPreview) return;

    setLoadingPreview(true);
    try {
      const userName = user?.email?.split('@')[0] || "el equipo";
      const preview = await generateWhatsAppSummary(userName);
      setWhatsappPreview(preview);
    } catch (error) {
      console.error('[CreatorDetailDialog] Error generando preview:', error);
      setWhatsappPreview("Error generando vista previa");
    } finally {
      setLoadingPreview(false);
    }
  };

  const generateDailyMessage = async () => {
    if (!creator) return;

    try {
      const userName = user?.email?.split('@')[0] || 'el equipo';
      const message = await creatorMetricsService.generateDailyMessage(
        creator.id,
        creator.nombre,
        userName
      );
      setDailyMessage(message);
      setWhatsappModalOpen(true);
    } catch (error) {
      console.error('Error generando mensaje diario:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el mensaje diario",
        variant: "destructive"
      });
    }
  };

  const getMonthlyGrowth = () => {
    if (!creator) return { diamantes: 0, views: 0, engagement: 0 };

    const currentDiamantes = creator.diamantes || 0;
    const lastMonthDiamantes = creator.last_month_diamantes || 0;
    const currentViews = creator.views || 0;
    const lastMonthViews = creator.last_month_views || 0;
    const currentEngagement = creator.engagement_rate || 0;
    const lastMonthEngagement = creator.last_month_engagement || 0;

    const diamantesGrowth = lastMonthDiamantes > 0
      ? ((currentDiamantes - lastMonthDiamantes) / lastMonthDiamantes) * 100
      : 0;
    const viewsGrowth = lastMonthViews > 0
      ? ((currentViews - lastMonthViews) / lastMonthViews) * 100
      : 0;
    const engagementGrowth = lastMonthEngagement > 0
      ? ((currentEngagement - lastMonthEngagement) / lastMonthEngagement) * 100
      : 0;

    return {
      diamantes: diamantesGrowth,
      views: viewsGrowth,
      engagement: engagementGrowth,
    };
  };

  const getMilestones = () => {
    if (!creator) return [];

    const diamantes = creator.diamantes || 0;
    const diasLive = creator.dias_live || 0;
    const horasLive = creator.horas_live || 0;

    const diamantesMilestones = [
      { value: 10000, label: "10K Diamantes", type: "diamantes" },
      { value: 50000, label: "50K Diamantes", type: "diamantes" },
      { value: 100000, label: "100K Diamantes", type: "diamantes" },
      { value: 500000, label: "500K Diamantes", type: "diamantes" },
      { value: 1000000, label: "1M Diamantes", type: "diamantes" },
    ];

    const diasMilestones = [
      { value: 30, label: "30 Días en Live", type: "dias" },
      { value: 60, label: "60 Días en Live", type: "dias" },
      { value: 90, label: "90 Días en Live", type: "dias" },
      { value: 180, label: "180 Días en Live", type: "dias" },
      { value: 365, label: "1 Año en Live", type: "dias" },
    ];

    const horasMilestones = [
      { value: 50, label: "50 Horas en Live", type: "horas" },
      { value: 100, label: "100 Horas en Live", type: "horas" },
      { value: 250, label: "250 Horas en Live", type: "horas" },
      { value: 500, label: "500 Horas en Live", type: "horas" },
      { value: 1000, label: "1000 Horas en Live", type: "horas" },
    ];

    const nextDiamantesMilestones = diamantesMilestones
      .filter(m => m.value > diamantes)
      .map(m => ({
        ...m,
        remaining: m.value - diamantes,
        progress: (diamantes / m.value) * 100,
        icon: "💎",
      }));

    const nextDiasMilestones = diasMilestones
      .filter(m => m.value > diasLive)
      .map(m => ({
        ...m,
        remaining: m.value - diasLive,
        progress: (diasLive / m.value) * 100,
        icon: "📅",
      }));

    const nextHorasMilestones = horasMilestones
      .filter(m => m.value > horasLive)
      .map(m => ({
        ...m,
        remaining: m.value - horasLive,
        progress: (horasLive / m.value) * 100,
        icon: "⏰",
      }));

    return [...nextDiamantesMilestones.slice(0, 2), ...nextDiasMilestones.slice(0, 1), ...nextHorasMilestones.slice(0, 1)];
  };

  const getInitials = (name: string) => {
    return name
      .replace('@', '')
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!creator) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[95vh] flex flex-col">
        <DrawerHeader className="pb-4 border-b border-border/50 space-y-3 flex-shrink-0 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 sm:h-16 sm:w-16 border-2 border-primary/20">
                <AvatarImage src={creator.profile_image_url || undefined} alt={creator.nombre} />
                <AvatarFallback className="text-lg font-bold bg-primary/10">
                  {getInitials(creator.nombre)}
                </AvatarFallback>
              </Avatar>
              <DrawerTitle className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent flex flex-wrap items-center gap-2 sm:gap-3">
                {getCreatorDisplayName(creator)}
              </DrawerTitle>
            </div>

            {/* Botón de IA prominente en header */}
            <Button
              onClick={generateAIAdvice}
              disabled={loadingAdvice}
              variant="default"
              size="sm"
              className="gap-2 w-full sm:w-auto shrink-0"
            >
              <Sparkles className="h-4 w-4" />
              {loadingAdvice ? "Generando..." : "Generar Consejos IA"}
            </Button>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 space-y-6 pt-4">
          <CreatorBasicInfo creator={creator} dailyStats={dailyStats} />

          <Card className="neo-card-sm">
            <CardContent className="pt-6 space-y-4">
              <div className="p-4 rounded-lg neo-card-sm">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1 font-medium">Engagement</p>
                <p className="font-bold text-xl">{(creator.engagement_rate || 0).toFixed(1)}%</p>
              </div>

              {/* Sección de Acciones - Grid de 3 columnas */}
              <div className="col-span-2 pt-2 grid grid-cols-3 gap-3">
                {/* Botón WhatsApp nuevo */}
                <WhatsappButton
                  phone={creator?.telefono}
                  country={(creator as any)?.country || "MX"}
                  message={buildWaMessage(creator)}
                  className="col-span-3"
                />

                {/* Botón Vista Previa del Mensaje existente */}
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        disabled={!creator.telefono}
                        size="sm"
                        className="w-full"
                        onClick={loadWhatsAppPreview}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Vista Previa del Mensaje
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-96">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold">Mensaje que se enviará</h4>
                          <div className="p-4 neo-card-sm rounded-lg border border-border max-h-60 overflow-y-auto">
                            {loadingPreview ? (
                              <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                <span className="ml-2 text-sm text-muted-foreground">Cargando preview...</span>
                              </div>
                            ) : (
                              <p className="text-sm whitespace-pre-wrap font-display">
                                {whatsappPreview || "Haz clic en 'Vista Previa' para cargar el mensaje"}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          className="w-full"
                          variant="success"
                          onClick={handleOpenWhatsApp}
                          disabled={loadingPreview}
                        >
                          <MessageSquare className="h-5 w-5 mr-2" />
                          Enviar por WhatsApp
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                  {!creator.telefono && (
                    <p className="text-sm text-muted-foreground text-center mt-3">
                      No hay número de teléfono registrado
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="bonificaciones" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-2">
              <TabsTrigger value="bonificaciones" className="gap-2">
                <Award className="h-4 w-4" />
                <span className="hidden sm:inline">Bonificaciones</span>
                <span className="sm:hidden">💎</span>
              </TabsTrigger>
              <TabsTrigger value="metricas" className="gap-2">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Métricas</span>
                <span className="sm:hidden">📈</span>
              </TabsTrigger>
              <TabsTrigger value="alertas" className="gap-2">
                <AlertCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Alertas</span>
                <span className="sm:hidden">⚠️</span>
              </TabsTrigger>
              <TabsTrigger value="agenda" className="gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Agenda</span>
                <span className="sm:hidden">📅</span>
              </TabsTrigger>
              <TabsTrigger value="analisis" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Análisis</span>
                <span className="sm:hidden">📊</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bonificaciones" className="space-y-4 mt-6">
              <BonificacionesPanel
                creatorId={creator.id}
                creatorName={creator.nombre}
                tiktok_username={creator.tiktok_username || undefined}
                creatorPhone={creator.telefono}
              />
            </TabsContent>

            <TabsContent value="metricas" className="space-y-4 mt-6">
              <CreatorMetricsPanel
                creatorId={creator.id}
                creatorName={creator.nombre}
              />

              {/* Botón para mensaje diario */}
              <div className="mt-4">
                <NeoButton
                  variant="primary"
                  onClick={generateDailyMessage}
                  className="w-full"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Generar Mensaje Diario para WhatsApp
                </NeoButton>
              </div>
            </TabsContent>

            <TabsContent value="alertas" className="space-y-4 mt-6">
              <CreatorRiskPanel creatorId={creator.id} />
              <CreatorSupervisionHistory creatorId={creator.id} />
            </TabsContent>

            <TabsContent value="agenda" className="space-y-4 mt-6">
              <CreatorBattlesPanel
                creatorId={creator.id}
                creatorName={creator.nombre}
              />
              <CreatorInteractions
                creatorId={creator.id}
                interactions={interactions}
                onInteractionAdded={fetchInteractions}
              />
            </TabsContent>

            <TabsContent value="analisis" className="space-y-4 mt-6">
              {/* Comparación Mensual */}
              <Card className="neo-card-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 backdrop-blur-sm">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    Comparación Mensual
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {(() => {
                    const growth = getMonthlyGrowth();
                    const metrics = [
                      { label: "Diamantes", value: growth.diamantes, current: creator.diamantes || 0, last: creator.last_month_diamantes || 0 },
                      { label: "Vistas", value: growth.views, current: creator.views || 0, last: creator.last_month_views || 0 },
                      { label: "Engagement", value: growth.engagement, current: creator.engagement_rate || 0, last: creator.last_month_engagement || 0, isPercentage: true },
                    ];

                    return metrics.map((metric, idx) => (
                      <div key={idx} className="p-5 rounded-lg neo-card-sm">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-semibold text-base">{metric.label}</span>
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/50 backdrop-blur-sm">
                            {metric.value > 0 ? (
                              <ArrowUp className="h-4 w-4 text-green-500" />
                            ) : metric.value < 0 ? (
                              <ArrowDown className="h-4 w-4 text-red-500" />
                            ) : (
                              <Minus className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className={`font-bold ${metric.value > 0 ? "text-green-500" : metric.value < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                              {metric.value > 0 ? "+" : ""}{metric.value.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span className="font-medium">Actual: <span className="text-foreground">{metric.isPercentage ? `${metric.current.toFixed(1)}%` : metric.current.toLocaleString()}</span></span>
                          <span className="font-medium">Mes pasado: <span className="text-foreground/70">{metric.isPercentage ? `${metric.last.toFixed(1)}%` : metric.last.toLocaleString()}</span></span>
                        </div>
                      </div>
                    ));
                  })()}
                </CardContent>
              </Card>

              {/* Próximos Hitos */}
              <Card className="neo-card-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10 backdrop-blur-sm">
                      <Target className="h-5 w-5 text-accent" />
                    </div>
                    Próximos Hitos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {getMilestones().map((milestone, idx) => (
                    <div key={idx} className="p-4 rounded-lg neo-card-sm space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-base flex items-center gap-2">
                          <span className="text-xl">{milestone.icon}</span>
                          {milestone.label}
                        </span>
                        <span className="text-sm font-medium text-muted-foreground neo-card-sm px-3 py-1 rounded-full">
                          Faltan {milestone.remaining.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-3 neo-input rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary via-primary to-accent transition-all duration-500"
                          style={{ width: `${milestone.progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        {milestone.progress.toFixed(1)}% completado
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Guía de Feedback */}
              <FeedbackGuide />
              {/* DEBUG SECTION */}
              <div className="p-4 rounded-lg bg-black/50 text-xs font-mono space-y-2">
                <p className="font-bold text-red-400">DEBUG INFO (Solo visible temporalmente)</p>
                <p>Creator ID: {creator.id}</p>
                <p>Diamantes en tabla creators: {creator.diamantes}</p>
                <DebugStats creatorId={creator.id} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DrawerContent>

      {/* Dialog para asignar meta */}
      <AsignarMetaDialog
        open={metaDialogOpen}
        onOpenChange={setMetaDialogOpen}
        creatorId={creator.id}
        creatorName={creator.nombre}
        onMetaAsignada={() => {
          toast({
            title: "Meta asignada correctamente",
            description: `Se ha asignado una nueva meta a ${creator.nombre}`,
          });
        }}
      />

      <WhatsAppPreviewModal
        open={whatsappModalOpen}
        onOpenChange={setWhatsappModalOpen}
        defaultMessage={dailyMessage}
        defaultPhone={creator?.telefono}
        creatorName={creator?.nombre || ''}
      />
    </Drawer>
  );
};

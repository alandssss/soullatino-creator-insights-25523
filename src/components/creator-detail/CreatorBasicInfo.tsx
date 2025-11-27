import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { InfoBox, infoBoxActions } from "@/components/shared/InfoBox";
import { formatMetrics } from "@/utils/formatMetrics";

type Creator = Tables<"creators">;

interface CreatorBasicInfoProps {
  creator: Creator;
  dailyStats: any;
}

export const CreatorBasicInfo = ({ creator, dailyStats }: CreatorBasicInfoProps) => {
  return (
    <Card className="neo-card-sm border-2 border-red-500">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl font-semibold">
          <div className="p-2 rounded-lg bg-primary/10 backdrop-blur-sm">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          Información del Creador
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoBox
          label="Usuario TikTok"
          value={creator.tiktok_username ? `@${creator.tiktok_username}` : "No especificado"}
        />
        <InfoBox
          label="Teléfono"
          value={creator.telefono || "No especificado"}
          actions={creator.telefono ? [
            infoBoxActions.phone(creator.telefono),
            infoBoxActions.whatsapp(creator.telefono)
          ] : []}
        />
        <InfoBox
          label="Categoría"
          value={creator.categoria || "No especificada"}
        />
        <InfoBox
          label="Manager"
          value={creator.manager || "No asignado"}
          mono
          actions={creator.manager && creator.manager.includes('@') ? [
            infoBoxActions.email(creator.manager),
            infoBoxActions.copy(creator.manager)
          ] : []}
        />

        {dailyStats ? (
          <div className="col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-green-500/10 backdrop-blur-sm border border-green-500/20 overflow-hidden">
              <p className="text-xs uppercase tracking-wider text-green-600 mb-1 font-medium truncate">Días Live Hoy</p>
              <p className="font-bold text-xl text-green-600 truncate" title={dailyStats.dias_validos_live?.toString()}>{dailyStats.dias_validos_live || 0}</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 overflow-hidden">
              <p className="text-xs uppercase tracking-wider text-blue-600 mb-1 font-medium truncate">Horas Hoy</p>
              <p className="font-bold text-xl text-blue-600 truncate" title={formatMetrics.hours(dailyStats.duracion_live_horas)}>{formatMetrics.hours(dailyStats.duracion_live_horas)}</p>
            </div>
            <div className="p-4 rounded-lg bg-accent/10 backdrop-blur-sm border border-accent/20 overflow-hidden">
              <p className="text-xs uppercase tracking-wider text-accent mb-1 font-medium truncate">Diamantes Hoy</p>
              <p className="font-bold text-2xl text-accent truncate" title={formatMetrics.diamonds(dailyStats.diamantes)}>{formatMetrics.diamonds(dailyStats.diamantes)} 💎</p>
            </div>
          </div>
        ) : (
          <div className="col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-primary/10 backdrop-blur-sm border border-primary/20 overflow-hidden">
              <p className="text-xs uppercase tracking-wider text-primary mb-1 font-medium truncate">Días Live (MTD)</p>
              <p className="font-bold text-xl text-primary truncate" title={`${formatMetrics.days(creator.dias_live)} días este mes`}>{formatMetrics.days(creator.dias_live)} días</p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10 backdrop-blur-sm border border-primary/20 overflow-hidden">
              <p className="text-xs uppercase tracking-wider text-primary mb-1 font-medium truncate">Horas Live (MTD)</p>
              <p className="font-bold text-xl text-primary truncate" title={`${formatMetrics.hours(creator.horas_live)} este mes`}>{formatMetrics.hours(creator.horas_live)}</p>
            </div>
            <div className="p-4 rounded-lg bg-accent/10 backdrop-blur-sm border border-accent/20 overflow-hidden">
              <p className="text-xs uppercase tracking-wider text-accent mb-1 font-medium truncate">Diamantes (MTD)</p>
              <p className="font-bold text-2xl text-accent truncate" title={`${formatMetrics.diamonds(creator.diamantes)} 💎 este mes`}>{formatMetrics.diamonds(creator.diamantes)} 💎</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

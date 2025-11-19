import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { InfoBox, infoBoxActions } from "@/components/shared/InfoBox";

type Creator = Tables<"creators">;

interface CreatorBasicInfoProps {
  creator: Creator;
  dailyStats: any;
}

export const CreatorBasicInfo = ({ creator, dailyStats }: CreatorBasicInfoProps) => {
  return (
    <Card className="neo-card-sm">
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
          <>
            <div className="p-4 rounded-lg bg-green-500/10 backdrop-blur-sm border border-green-500/20">
              <p className="text-xs uppercase tracking-wider text-green-600 mb-1 font-medium">Días Live Hoy</p>
              <p className="font-bold text-xl text-green-600">{dailyStats.dias_validos_live || 0}</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/10 backdrop-blur-sm border border-blue-500/20">
              <p className="text-xs uppercase tracking-wider text-blue-600 mb-1 font-medium">Horas Hoy</p>
              <p className="font-bold text-xl text-blue-600">{dailyStats.duracion_live_horas?.toFixed(1) || 0}h</p>
            </div>
            <div className="p-4 rounded-lg bg-accent/10 backdrop-blur-sm border border-accent/20">
              <p className="text-xs uppercase tracking-wider text-accent mb-1 font-medium">Diamantes Hoy</p>
              <p className="font-bold text-2xl text-accent">{(dailyStats.diamantes || 0).toLocaleString()} 💎</p>
            </div>
          </>
        ) : (
          <>
            <div className="p-4 rounded-lg bg-primary/10 backdrop-blur-sm border border-primary/20">
              <p className="text-xs uppercase tracking-wider text-primary mb-1 font-medium">Días en Live</p>
              <p className="font-bold text-xl text-primary">{creator.dias_live || 0} días</p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10 backdrop-blur-sm border border-primary/20">
              <p className="text-xs uppercase tracking-wider text-primary mb-1 font-medium">Horas en Live</p>
              <p className="font-bold text-xl text-primary">{creator.horas_live || 0} horas</p>
            </div>
            <div className="p-4 rounded-lg bg-accent/10 backdrop-blur-sm border border-accent/20">
              <p className="text-xs uppercase tracking-wider text-accent mb-1 font-medium">Diamantes</p>
              <p className="font-bold text-2xl text-accent">{(creator.diamantes || 0).toLocaleString()} 💎</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

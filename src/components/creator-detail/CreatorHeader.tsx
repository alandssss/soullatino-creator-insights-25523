import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles, MessageCircle, Target } from "lucide-react";
import { getCreatorDisplayName } from "@/utils/creator-display";

interface CreatorHeaderProps {
  creator: {
    id: string;
    nombre: string;
    tiktok_username?: string;
    engagement_rate?: number;
    profile_image_url?: string | null;
  };
  onWhatsApp: () => void;
  onGenerateAI: () => void;
  onAssignGoal: () => void;
  loadingAI: boolean;
  userRole: string | null;
}

export function CreatorHeader({
  creator,
  onWhatsApp,
  onGenerateAI,
  onAssignGoal,
  loadingAI,
  userRole,
}: CreatorHeaderProps) {
  const displayName = getCreatorDisplayName(creator);
  const initials = displayName
    .replace('@', '')
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Fallback URL using UI Avatars if no profile image is available
  const fallbackAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff&size=128`;

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 border-b gap-4 bg-card/50 backdrop-blur-sm rounded-t-xl">
      <div className="flex items-center gap-6">
        <div className="relative group">
          <Avatar className="h-24 w-24 border-4 border-background shadow-xl ring-2 ring-primary/20 transition-transform group-hover:scale-105">
            <AvatarImage
              src={creator.profile_image_url || fallbackAvatarUrl}
              alt={displayName}
              className="object-cover"
            />
            <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-4 border-background rounded-full" title="Activo" />
        </div>

        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {displayName}
          </h2>

          <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
            {creator.tiktok_username && (
              <span className="flex items-center gap-1 bg-secondary/50 px-2 py-0.5 rounded-md">
                <span className="text-xs">🎵</span> @{creator.tiktok_username}
              </span>
            )}
            {creator.engagement_rate !== undefined && (
              <span className="flex items-center gap-1 bg-secondary/50 px-2 py-0.5 rounded-md">
                <span className="text-xs">📈</span> {creator.engagement_rate.toFixed(2)}% Eng.
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 w-full md:w-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={onWhatsApp}
          className="gap-2 flex-1 md:flex-none shadow-sm hover:shadow-md transition-all"
        >
          <MessageCircle className="h-4 w-4 text-green-600" />
          WhatsApp
        </Button>

        {(userRole === "admin" || userRole === "manager") && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onGenerateAI}
              disabled={loadingAI}
              className="gap-2 flex-1 md:flex-none shadow-sm hover:shadow-md transition-all border-primary/20 hover:bg-primary/5"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              {loadingAI ? "Generando..." : "IA Consejos"}
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={onAssignGoal}
              className="gap-2 flex-1 md:flex-none shadow-md hover:shadow-lg transition-all bg-gradient-to-r from-primary to-primary/90"
            >
              <Target className="h-4 w-4" />
              Asignar Meta
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

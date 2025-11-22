import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sparkles, MessageCircle, Target } from "lucide-react";
import { getCreatorDisplayName } from "@/utils/creator-display";

interface CreatorHeaderProps {
  creator: {
    id: string;
    nombre: string;
    tiktok_username?: string;
    engagement_rate?: number;
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

  return (
    <div className="flex items-start justify-between p-6 border-b">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="text-lg font-bold bg-primary/10">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold break-words">{displayName}</h2>
          {creator.nombre && !creator.nombre.match(/^\d+$/) && (
            <p className="text-sm text-muted-foreground break-words">{creator.nombre}</p>
          )}
          {creator.engagement_rate !== undefined && (
            <p className="text-sm text-muted-foreground">
              Engagement: {creator.engagement_rate.toFixed(2)}%
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onWhatsApp}
          className="gap-2"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </Button>

        {(userRole === "admin" || userRole === "manager") && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onGenerateAI}
              disabled={loadingAI}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {loadingAI ? "Generando..." : "IA Consejos"}
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={onAssignGoal}
              className="gap-2"
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

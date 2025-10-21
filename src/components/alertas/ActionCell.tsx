import { Button } from "@/components/ui/button";
import { MessageSquare, PhoneCall } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ActionCellProps {
  hasPhone: boolean;
  onWhatsApp: () => void;
  onCall: () => void;
  isLoading?: boolean;
}

export function ActionCell({ hasPhone, onWhatsApp, onCall, isLoading }: ActionCellProps) {
  if (!hasPhone) {
    return (
      <div className="flex gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled
                className="gap-2 rounded-xl"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Sin teléfono</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Este creador no tiene teléfono registrado</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onWhatsApp}
              disabled={isLoading}
              size="sm"
              className="gap-2 rounded-xl bg-green-600 hover:bg-green-700 min-h-[40px]"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Enviar mensaje de WhatsApp</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onCall}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl min-h-[40px]"
            >
              <PhoneCall className="h-4 w-4" />
              <span className="hidden sm:inline">Llamar</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Llamar por teléfono</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

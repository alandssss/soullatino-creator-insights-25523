import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "./ProgressBar";
import { cn } from "@/lib/utils";

interface MilestoneCardProps {
  label: string;
  daysRequired: number;
  hoursRequired: number;
  currentDays: number;
  currentHours: number;
  onOpenPlan?: () => void;
}

type MilestoneStatus = "ALCANZADO" | "EN PROCESO" | "LEJOS";

export function MilestoneCard({ 
  label, 
  daysRequired, 
  hoursRequired, 
  currentDays, 
  currentHours,
  onOpenPlan 
}: MilestoneCardProps) {
  const daysPct = Math.min(100, Math.round((currentDays / daysRequired) * 100));
  const hoursPct = Math.min(100, Math.round((currentHours / hoursRequired) * 100));
  
  const getStatus = (): MilestoneStatus => {
    if (daysPct >= 100 && hoursPct >= 100) return "ALCANZADO";
    if (daysPct >= 60 || hoursPct >= 60) return "EN PROCESO";
    return "LEJOS";
  };

  const status = getStatus();

  const statusStyles = {
    ALCANZADO: "bg-green-500/10 text-green-700 border-green-500/30",
    "EN PROCESO": "bg-yellow-500/10 text-yellow-700 border-yellow-500/30",
    LEJOS: "bg-destructive/10 text-destructive border-destructive/30",
  };

  const cardStyles = {
    ALCANZADO: "border-green-500/50 bg-green-500/5",
    "EN PROCESO": "border-yellow-500/50 bg-yellow-500/5",
    LEJOS: "border-destructive/50 bg-destructive/5",
  };

  return (
    <div className={cn(
      "rounded-2xl border-2 p-4 space-y-3 transition-all",
      "shadow-[inset_2px_2px_6px_rgba(255,255,255,0.04),_0_0_10px_rgba(0,0,0,0.15)]",
      cardStyles[status]
    )}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-foreground">{label}</div>
        <Badge className={cn("text-xs px-2.5 py-1 rounded-full border-2", statusStyles[status])}>
          {status}
        </Badge>
      </div>

      <div className="space-y-3">
        <ProgressBar
          label={`Días ${currentDays}/${daysRequired}`}
          current={currentDays}
          total={daysRequired}
        />
        <ProgressBar
          label={`Horas ${currentHours.toFixed(1)}/${hoursRequired}`}
          current={currentHours}
          total={hoursRequired}
          decimals={1}
        />
      </div>

      {onOpenPlan && (
        <Button
          onClick={onOpenPlan}
          className="w-full mt-2 rounded-xl"
          variant={status === "ALCANZADO" ? "secondary" : "default"}
          size="sm"
        >
          Abrir Plan del Día
        </Button>
      )}
    </div>
  );
}

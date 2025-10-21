import { Button } from "@/components/ui/button";
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

function ProgressBar({ label, pct, current, total, tipo }: { label: string; pct: number; current: number; total: number; tipo: 'dias' | 'horas' }) {
  const barColor = pct >= 100 ? "bg-emerald-400" : pct >= 60 ? "bg-amber-400" : "bg-rose-400";
  
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className="font-semibold text-white">{pct}%</span>
      </div>
      <div className="h-2 bg-zinc-800/60 rounded-full overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-500", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

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

  const statusColors = {
    ALCANZADO: "bg-emerald-400/20 border-emerald-400/40 text-emerald-300",
    "EN PROCESO": "bg-amber-400/20 border-amber-400/40 text-amber-300",
    LEJOS: "bg-rose-400/20 border-rose-400/40 text-rose-300",
  };

  return (
    <div className={cn(
      "rounded-2xl border-2 p-5 space-y-3 transition-all",
      "shadow-[inset_2px_2px_6px_rgba(255,255,255,0.04),_0_0_10px_rgba(0,0,0,0.7)]",
      statusColors[status]
    )}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">{label}</h4>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-black/30 text-foreground">
          {status}
        </span>
      </div>

      <div className="space-y-4 pt-1">
        <ProgressBar
          label={`Días ${currentDays}/${daysRequired}`}
          current={currentDays}
          total={daysRequired}
          pct={daysPct}
          tipo="dias"
        />
        <ProgressBar
          label={`Horas ${currentHours.toFixed(1)}/${hoursRequired}`}
          current={currentHours}
          total={hoursRequired}
          pct={hoursPct}
          tipo="horas"
        />
      </div>

      {onOpenPlan && (
        <Button
          onClick={onOpenPlan}
          className="w-full mt-2 rounded-xl bg-gradient-to-br from-lime-300 to-emerald-400 text-zinc-900 font-semibold hover:brightness-110 transition-all"
          size="sm"
        >
          Plan sugerido
        </Button>
      )}
    </div>
  );
}

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
  const displayPct = Math.min(100, pct);
  const barColor = pct >= 100 ? "bg-emerald-400" : pct >= 60 ? "bg-amber-400" : "bg-rose-400";
  const extra = current - total;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className="font-semibold text-white">{displayPct}%</span>
      </div>
      <div className="h-2 bg-zinc-800/60 rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-500", barColor)}
          style={{ width: `${displayPct}%` }}
        />
      </div>
      {pct > 100 && (
        <div className="text-[10px] text-emerald-400 font-semibold">
          ¡{pct.toFixed(0)}% logrado! (+{extra} {tipo === 'dias' ? 'días' : 'h'} extra)
        </div>
      )}
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
      "rounded-xl border p-4 space-y-3 transition-all h-full flex flex-col justify-between",
      "shadow-sm",
      statusColors[status]
    )}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-bold text-foreground whitespace-nowrap">{label}</h4>
        <span className={cn(
          "text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/20 text-foreground whitespace-nowrap",
          status === "EN PROCESO" && "animate-pulse"
        )}>
          {status}
        </span>
      </div>

      <div className="space-y-3 pt-1 flex-1">
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
          className="w-full mt-3 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all text-xs h-8"
          size="sm"
        >
          Ver Plan
        </Button>
      )}
    </div>
  );
}

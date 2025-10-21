import { cn } from "@/lib/utils";

interface ProgressBarProps {
  label: string;
  current: number;
  total: number;
  decimals?: number;
  className?: string;
}

export function ProgressBar({ label, current, total, decimals = 0, className }: ProgressBarProps) {
  const percentage = Math.min(100, Math.round((current / total) * 100));
  
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="font-medium">{percentage}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all duration-500",
            percentage >= 100 ? "bg-green-500" :
            percentage >= 60 ? "bg-yellow-500" :
            "bg-destructive"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-muted-foreground">
        {current.toFixed(decimals)} / {total}
      </div>
    </div>
  );
}

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'muted';
  className?: string;
}

export function EmptyStateCard({ 
  icon: Icon, 
  title, 
  description, 
  action,
  variant = 'default',
  className 
}: EmptyStateProps) {
  return (
    <Card className={cn(
      "rounded-2xl p-12",
      variant === 'muted' && "bg-muted/30",
      className
    )}>
      <div className="flex flex-col items-center justify-center text-center space-y-6">
        <div className={cn(
          "rounded-full p-6",
          variant === 'default' ? "bg-muted" : "bg-background"
        )}>
          <Icon className="h-12 w-12 text-muted-foreground" />
        </div>
        
        <div className="space-y-2 max-w-md">
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        {action && (
          <Button 
            onClick={action.onClick}
            size="lg"
            className="rounded-xl gap-2 min-h-[44px]"
          >
            {action.label}
          </Button>
        )}
      </div>
    </Card>
  );
}

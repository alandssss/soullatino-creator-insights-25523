import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  sticky?: boolean;
  className?: string;
}

export function PageHeader({ 
  title, 
  description, 
  actions, 
  sticky = true,
  className 
}: PageHeaderProps) {
  return (
    <div className={cn(
      "mb-8",
      sticky && "sticky top-0 z-10 -mx-6 -mt-6 bg-background/95 px-6 py-6 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:-mx-8 lg:-mt-8 lg:px-8",
      className
    )}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold leading-none tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex flex-wrap gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

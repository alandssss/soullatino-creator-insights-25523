import * as React from "react";
import { cn } from "@/lib/utils";

// Lightweight tooltip implementation without Radix to avoid duplicate React issues

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

export const Tooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative inline-flex group">{children}</div>
);

export const TooltipTrigger: React.FC<{ asChild?: boolean; children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

type TooltipContentProps = React.HTMLAttributes<HTMLDivElement> & {
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
};

export const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, side = 'top', align = 'center', ...props }, ref) => {
    const positionClass =
      side === 'right'
        ? 'left-full ml-2 top-1/2 -translate-y-1/2'
        : side === 'left'
        ? 'right-full mr-2 top-1/2 -translate-y-1/2'
        : side === 'bottom'
        ? 'top-full mt-2 left-1/2 -translate-x-1/2'
        : '-top-10 left-1/2 -translate-x-1/2';

    return (
      <div
        ref={ref}
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 hidden whitespace-nowrap rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md group-hover:block",
          positionClass,
          className
        )}
        {...props}
      />
    );
  }
);
TooltipContent.displayName = "TooltipContent";

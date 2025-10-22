import * as React from "react";
import { cn } from "@/lib/utils";

// Stub for @radix-ui/react-tooltip to avoid pulling the package (dup React issues)
export const Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
export const Root: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative inline-flex group">{children}</div>
);
export const Trigger: React.FC<{ asChild?: boolean; children: React.ReactNode }> = ({ children }) => <>{children}</>;
export const Content = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & {
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}>(
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
Content.displayName = "TooltipContentStub";

// Default export shape to mimic the real package API
export default { Provider, Root, Trigger, Content };

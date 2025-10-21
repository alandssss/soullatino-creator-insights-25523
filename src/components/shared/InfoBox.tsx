import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Copy, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

interface InfoAction {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

interface InfoBoxProps {
  label: string;
  value: string;
  mono?: boolean;
  actions?: InfoAction[];
  className?: string;
}

export function InfoBox({ label, value, mono = false, actions = [], className }: InfoBoxProps) {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  return (
    <div className={cn(
      "rounded-2xl border-2 border-border/50 bg-card p-4",
      "shadow-[inset_2px_2px_6px_rgba(255,255,255,0.04),_0_0_10px_rgba(0,0,0,0.15)]",
      className
    )}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
        {label}
      </div>
      <div
        className={cn(
          "text-base font-semibold text-foreground",
          mono ? "font-mono break-all" : "truncate"
        )}
        title={value}
      >
        {value}
      </div>

      {actions.length > 0 && (
        <div className="mt-3 flex gap-2">
          {actions.map((action, i) =>
            action.href ? (
              <Button
                key={i}
                asChild
                size="sm"
                variant="outline"
                className="gap-1.5 rounded-xl text-xs h-8"
              >
                <a href={action.href} target={action.href.startsWith("mailto:") ? undefined : "_blank"}>
                  {action.icon}
                  {action.label}
                </a>
              </Button>
            ) : (
              <Button
                key={i}
                onClick={action.onClick}
                size="sm"
                variant="outline"
                className="gap-1.5 rounded-xl text-xs h-8"
              >
                {action.icon}
                {action.label}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// Helper para crear acciones comunes
export const infoBoxActions = {
  copy: (text: string): InfoAction => ({
    label: "Copiar",
    icon: <Copy className="h-3 w-3" />,
    onClick: () => {
      navigator.clipboard.writeText(text);
      toast.success("Copiado al portapapeles");
    },
  }),
  email: (email: string): InfoAction => ({
    label: "Email",
    icon: <Mail className="h-3 w-3" />,
    href: `mailto:${email}`,
  }),
  phone: (phone: string): InfoAction => ({
    label: "Llamar",
    icon: <Phone className="h-3 w-3" />,
    href: `tel:${phone}`,
  }),
  whatsapp: (phone: string): InfoAction => ({
    label: "WhatsApp",
    icon: <Phone className="h-3 w-3" />,
    href: `https://wa.me/${phone.replace(/[^0-9]/g, "")}`,
  }),
};

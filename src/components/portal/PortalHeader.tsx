import { Badge } from "@/components/ui/badge";

interface Creator {
  nombre: string;
  tiktok_username: string;
  status: string;
}

interface PortalHeaderProps {
  creator: Creator;
}

export default function PortalHeader({ creator }: PortalHeaderProps) {
  return (
    <header className="mb-8 neo-card p-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Portal de Batallas
          </h1>
          <p className="text-lg mt-2">
            👋 Hola, <span className="font-semibold text-foreground">{creator.nombre}</span>
          </p>
          <p className="text-sm text-muted-foreground">@{creator.tiktok_username}</p>
        </div>
        <Badge 
          variant={creator.status === 'activo' ? 'default' : 'secondary'}
          className="px-4 py-2 text-sm"
        >
          {creator.status === 'activo' ? '✓ Activo' : creator.status}
        </Badge>
      </div>
    </header>
  );
}

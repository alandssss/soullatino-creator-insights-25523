import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Search } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Creator = Tables<"creators">;

const CreatorsCRM = () => {
  const navigate = useNavigate();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [filteredCreators, setFilteredCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [managerFilter, setManagerFilter] = useState<string>("all");
  const [estadoFilter, setEstadoFilter] = useState<string>("all");
  const [managers, setManagers] = useState<string[]>([]);

  useEffect(() => {
    fetchCreators();
  }, []);

  useEffect(() => {
    filterCreators();
  }, [searchTerm, managerFilter, estadoFilter, creators]);

  const fetchCreators = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("creators")
        .select("*")
        .eq("status", "activo")
        .order("diamantes", { ascending: false });

      if (error) throw error;

      setCreators(data || []);

      // Extraer managers únicos
      const uniqueManagers = Array.from(
        new Set((data || []).map((c) => c.manager).filter((m) => m))
      ) as string[];
      setManagers(uniqueManagers);
    } catch (error) {
      console.error("Error cargando creadores:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterCreators = () => {
    let filtered = [...creators];

    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.tiktok_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de manager
    if (managerFilter !== "all") {
      filtered = filtered.filter((c) => c.manager === managerFilter);
    }

    // Filtro de estado
    if (estadoFilter !== "all") {
      if (estadoFilter === "nuevo") {
        filtered = filtered.filter((c) => (c.dias_en_agencia || 0) <= 90);
      } else if (estadoFilter === "activo") {
        filtered = filtered.filter((c) => (c.diamantes || 0) > 0);
      } else if (estadoFilter === "en_riesgo") {
        filtered = filtered.filter((c) => (c.dias_live || 0) < 10);
      }
    }

    setFilteredCreators(filtered);
  };

  const getStatusBadge = (creator: Creator) => {
    if ((creator.dias_en_agencia || 0) <= 90) {
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500">
          NUEVO
        </Badge>
      );
    }
    if ((creator.dias_live || 0) < 10) {
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500">
          EN RIESGO
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500">
        ACTIVO
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(211,100%,50%)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Creadores" description="Base de datos de talento" />

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por username o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)]"
          />
        </div>

        <Select value={managerFilter} onValueChange={setManagerFilter}>
          <SelectTrigger className="w-full md:w-[200px] bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)]">
            <SelectValue placeholder="Todos los managers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los managers</SelectItem>
            {managers.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={estadoFilter} onValueChange={setEstadoFilter}>
          <SelectTrigger className="w-full md:w-[200px] bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)]">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="activo">Activo</SelectItem>
            <SelectItem value="nuevo">Nuevo (&lt;90d)</SelectItem>
            <SelectItem value="en_riesgo">En Riesgo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <div className="bg-[hsl(220,15%,16%)] border border-[hsl(220,15%,22%)] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[hsl(220,15%,11%)] border-b border-[hsl(220,15%,22%)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Creador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Manager
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Días en Agencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Diamantes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Horas
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(220,15%,22%)]">
              {filteredCreators.map((creator) => (
                <tr
                  key={creator.id}
                  onClick={() => navigate(`/creadores/${creator.id}`)}
                  className="hover:bg-[hsl(220,15%,19%)] cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-[hsl(211,100%,50%)]/10 text-[hsl(211,100%,50%)]">
                          {creator.tiktok_username?.[0]?.toUpperCase() || "C"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-white">@{creator.tiktok_username}</div>
                        <div className="text-sm text-muted-foreground">{creator.nombre}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-white">{creator.manager || "—"}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-white">
                      {creator.dias_en_agencia || 0} días
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(creator)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-[hsl(45,100%,51%)]">
                      {((creator.diamantes || 0) / 1000).toFixed(0)}k
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-white">
                      {(creator.horas_live || 0).toFixed(1)}h
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCreators.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No se encontraron creadores con los filtros aplicados
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorsCRM;

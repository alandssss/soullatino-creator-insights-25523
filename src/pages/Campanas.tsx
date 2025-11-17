import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { BatallasPanel } from "@/components/batallas/BatallasPanel";
import Rankings from "./Rankings";
import { CompetitionsPanel } from "@/components/rankings/CompetitionsPanel";

const Campanas = () => {
  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Campañas"
        description="Gestiona batallas, rankings y competencias de equipo"
      />

      <Tabs defaultValue="batallas" className="w-full">
        <TabsList className="bg-[hsl(220,15%,16%)] border border-[hsl(220,15%,22%)]">
          <TabsTrigger
            value="batallas"
            className="data-[state=active]:bg-[hsl(211,100%,50%)] data-[state=active]:text-white"
          >
            ⚔️ Batallas
          </TabsTrigger>
          <TabsTrigger
            value="rankings"
            className="data-[state=active]:bg-[hsl(211,100%,50%)] data-[state=active]:text-white"
          >
            🏆 Rankings
          </TabsTrigger>
          <TabsTrigger
            value="competencias"
            className="data-[state=active]:bg-[hsl(211,100%,50%)] data-[state=active]:text-white"
          >
            👥 Competencias
          </TabsTrigger>
        </TabsList>

        <TabsContent value="batallas" className="mt-6">
          <BatallasPanel />
        </TabsContent>

        <TabsContent value="rankings" className="mt-6">
          <Rankings />
        </TabsContent>

        <TabsContent value="competencias" className="mt-6">
          <CompetitionsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Campanas;

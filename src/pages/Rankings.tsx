import { LeaderboardPanel } from "@/components/rankings/LeaderboardPanel";
import { BadgesPanel } from "@/components/rankings/BadgesPanel";
import { CompetitionsPanel } from "@/components/rankings/CompetitionsPanel";
import { NotificationsPanel } from "@/components/rankings/NotificationsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Award, Users, Bell } from "lucide-react";

export default function Rankings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">🏆 Sistema de Rankings y Gamificación</h1>
        <p className="text-muted-foreground">
          Leaderboards, logros, competencias y notificaciones para motivar a tus creadores
        </p>
      </div>

      <Tabs defaultValue="leaderboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="leaderboard" className="gap-2">
            <Trophy className="h-4 w-4" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="badges" className="gap-2">
            <Award className="h-4 w-4" />
            Logros
          </TabsTrigger>
          <TabsTrigger value="competitions" className="gap-2">
            <Users className="h-4 w-4" />
            Competencias
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notificaciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="mt-6">
          <LeaderboardPanel />
        </TabsContent>

        <TabsContent value="badges" className="mt-6">
          <BadgesPanel showAll={true} />
        </TabsContent>

        <TabsContent value="competitions" className="mt-6">
          <CompetitionsPanel />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

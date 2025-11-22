import { Routes, Route } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import Admin from "@/pages/Admin";
import Reclutamiento from "@/pages/Reclutamiento";
import SupervisionLive from "@/pages/SupervisionLive";
import CreatorProfile from "@/pages/CreatorProfile";
import AlertasSugerenciasPage from "@/pages/AlertasSugerencias";
import DebugTools from "@/pages/DebugTools";
import NotFound from "@/pages/NotFound";
import BrandingSettings from "@/pages/BrandingSettings";
import ScoringConfig from "@/pages/ScoringConfig";
import IAEffectiveness from "@/pages/IAEffectiveness";
import Rankings from "@/pages/Rankings";
import { BatallasPanel } from "@/components/batallas/BatallasPanel";

export function AppLayoutRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/alertas" element={<AlertasSugerenciasPage />} />
      <Route path="/batallas" element={<BatallasPanel />} />
      <Route path="/rankings" element={<Rankings />} />
      <Route path="/reclutamiento" element={<Reclutamiento />} />
      <Route path="/supervision" element={<SupervisionLive />} />
      <Route path="/supervision/:id" element={<CreatorProfile />} />
      <Route path="/branding" element={<BrandingSettings />} />
      <Route path="/scoring" element={<ScoringConfig />} />
      <Route path="/ia-effectiveness" element={<IAEffectiveness />} />
      <Route path="/debug" element={<DebugTools />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

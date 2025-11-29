import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import AppLayout from "./layouts/AppLayout";
import Login from "./pages/Login";
import CreatorPortal from "./pages/CreatorPortal";
import HomePage from "./pages/HomePage";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Reclutamiento from "./pages/Reclutamiento";
import SupervisionLive from "./pages/SupervisionLive";
import CreatorProfile from "./pages/CreatorProfile";
import AlertasSugerenciasPage from "./pages/AlertasSugerencias";
import DebugTools from "./pages/DebugTools";
import NotFound from "./pages/NotFound";
import BrandingSettings from "./pages/BrandingSettings";
import ScoringConfig from "./pages/ScoringConfig";
import IAEffectiveness from "./pages/IAEffectiveness";
import Rankings from "./pages/Rankings";
import { BatallasPanel } from "@/components/batallas/BatallasPanel";
import DashboardGlobal from "@/components/DashboardGlobal";
import DashboardSegmento from "@/components/DashboardSegmento";
import CreatorProfileDashboard from "@/components/CreatorProfileDashboard";
import HitosPanel from "@/components/HitosPanel";
import AlertasOperativas from "@/components/AlertasOperativas";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const [mounted, setMounted] = useState(false);

  // Detectar si estamos en el dominio del portal de creadores
  const isCreatorPortal = typeof window !== 'undefined' &&
    window.location.hostname === 'pkosoullatino.neuron.lat';

  useEffect(() => { setMounted(true); }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        {mounted && (
          <BrowserRouter>
            <Routes>
              {isCreatorPortal ? (
                // SOLO rutas del portal de creadores
                <>
                  <Route path="/portal/:username" element={<CreatorPortal />} />
                  <Route path="/portal" element={
                    <div className="flex items-center justify-center min-h-screen">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold mb-4">Portal de Creadores</h1>
                        <p className="text-muted-foreground">
                          Accede con tu username: /portal/tu-username
                        </p>
                      </div>
                    </div>
                  } />
                  <Route path="/" element={
                    <div className="flex items-center justify-center min-h-screen">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold mb-4">Portal de Creadores</h1>
                        <p className="text-muted-foreground">
                          Accede con tu username: /portal/tu-username
                        </p>
                      </div>
                    </div>
                  } />
                  <Route path="*" element={
                    <div className="flex items-center justify-center min-h-screen">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold mb-4">Portal de Creadores</h1>
                        <p className="text-muted-foreground">
                          Accede con tu username: /portal/tu-username
                        </p>
                      </div>
                    </div>
                  } />
                </>
              ) : (
                // Rutas completas del panel administrativo
                <>
                  <Route path="/login" element={<Login />} />
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/portal/:username" element={<CreatorPortal />} />
                  <Route path="/portal" element={<CreatorPortal />} />

                  {/* Rutas protegidas con layout */}
                  <Route element={<AppLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="dashboard-global" element={<DashboardGlobal />} />
                    <Route path="dashboard-segmentos" element={<DashboardSegmento />} />
                    <Route path="dashboard-creador/:id" element={<CreatorProfileDashboard />} />
                    <Route path="dashboard-hitos" element={<HitosPanel />} />
                    <Route path="alertas-operativas" element={<AlertasOperativas />} />
                    <Route path="admin" element={<Admin />} />
                    <Route path="alertas" element={<AlertasSugerenciasPage />} />
                    <Route path="batallas" element={<BatallasPanel />} />
                    <Route path="rankings" element={<Rankings />} />
                    <Route path="reclutamiento" element={<Reclutamiento />} />
                    <Route path="supervision" element={<SupervisionLive />} />
                    <Route path="supervision/:id" element={<CreatorProfile />} />
                    <Route path="branding" element={<BrandingSettings />} />
                    <Route path="scoring" element={<ScoringConfig />} />
                    <Route path="ia-effectiveness" element={<IAEffectiveness />} />
                    <Route path="debug" element={<DebugTools />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </>
              )}
            </Routes>
            {mounted && <Toaster />}
            {mounted && <Sonner />}
          </BrowserRouter>
        )}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

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
                  <Route path="/*" element={<AppLayout />} />
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

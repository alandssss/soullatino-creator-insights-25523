import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingUp } from "lucide-react";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(100),
});

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log('🔐 Iniciando autenticación...', { email, isSignUp });

    try {
      const validated = authSchema.parse({ email, password });

      if (isSignUp) {
        console.log('📝 Intentando registro...');
        const { error } = await supabase.auth.signUp({
          email: validated.email,
          password: validated.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        toast({
          title: "¡Cuenta creada!",
          description: "Revisa tu email para confirmar tu cuenta.",
        });
      } else {
        console.log('🔑 Intentando login con Supabase...');
        
        // Verificar conectividad antes de intentar login
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: validated.email,
            password: validated.password,
          });
          
          if (error) {
            console.error('❌ Error de Supabase auth:', error);
            throw error;
          }

          console.log('✅ Login exitoso, usuario:', data.user.id);

          // Asegurar que el usuario tenga un rol asignado
          console.log('👤 Asignando rol de usuario...');
          const { error: roleError } = await supabase.functions.invoke('ensure-user-role');
          if (roleError) {
            console.warn('⚠️ Error asegurando rol del usuario:', roleError);
          }

          // Verificar rol del usuario
          console.log('🔍 Verificando rol del usuario...');
          const { data: roleData, error: roleQueryError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', data.user.id)
            .single();

          if (roleQueryError) {
            console.warn('⚠️ Error consultando rol:', roleQueryError);
          }

          console.log('✅ Rol del usuario:', roleData?.role || 'viewer');

          toast({
            title: "¡Bienvenido!",
            description: "Has iniciado sesión correctamente.",
          });

          // Redirigir según rol
          if (roleData?.role === 'admin') {
            navigate("/admin");
          } else {
            navigate("/dashboard");
          }
        } catch (authError: any) {
          // Errores específicos de red o conectividad
          if (authError.message?.includes('fetch') || authError.message?.includes('network')) {
            console.error('🌐 Error de conexión:', authError);
            throw new Error('Error de conexión: No se pudo contactar con el servidor. Verifica tu conexión a internet o intenta más tarde.');
          }
          throw authError;
        }
      }
    } catch (error: any) {
      console.error('💥 Error en handleAuth:', error);
      
      if (error instanceof z.ZodError) {
        toast({
          title: "Error de validación",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else if (error.message?.includes('Invalid login credentials')) {
        toast({
          title: "Credenciales incorrectas",
          description: "El email o la contraseña son incorrectos. Verifica tus datos e intenta de nuevo.",
          variant: "destructive",
        });
      } else if (error.message?.includes('conexión') || error.message?.includes('fetch') || error.message?.includes('network')) {
        toast({
          title: "Error de conexión",
          description: error.message || "No se pudo conectar con el servidor. Verifica tu conexión a internet.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error de autenticación",
          description: error.message || "Ocurrió un error inesperado. Intenta de nuevo.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
      console.log('🏁 Proceso de autenticación finalizado');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      
      <Card className="w-full max-w-md relative z-10 backdrop-blur-sm bg-card/80 border-border/50 shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-glow">
              <TrendingUp className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent">
            Soullatino Analytics
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isSignUp ? "Crea tu cuenta para comenzar" : "Accede a tus métricas de creadores"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/50 border-border/50 focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background/50 border-border/50 focus:border-primary transition-colors"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg hover:shadow-glow transition-all duration-300"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : isSignUp ? (
                "Crear cuenta"
              ) : (
                "Iniciar sesión"
              )}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm space-y-2">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:text-primary/80 font-medium transition-colors block w-full"
            >
              {isSignUp ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
            </button>
            <a
              href="/debug"
              className="text-muted-foreground hover:text-foreground text-xs transition-colors block"
            >
              ¿Problemas de carga en Android? → Herramientas de depuración
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;

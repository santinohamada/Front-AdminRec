"use client";

// 1. Importar Suspense y Skeleton
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogInIcon, AlertCircleIcon } from "lucide-react";

// 2. Importar el store de autenticación
import { useAuthStore } from "@/store/authStore";
// 3. --- CAMBIO --- Importar el NUEVO authService
import { authService } from "@/services/apiService"

// 4. Importar componentes de UI
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Componente hijo que maneja la lógica de login.
 * Se aísla para poder usar useSearchParams() de forma segura.
 */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore(); // Asume que authStore.login() acepta un TeamMember

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setError("");

    try {
      // --- CAMBIO ---
      // 5. Llamar al authService en lugar de la lógica local
      const user = await authService.login(email, password);

      // 6. Si tiene éxito, guardar el usuario en el store
      login(user);

      // 7. Redirigir
      const fromPath = searchParams.get("from") || "/";
      router.push(fromPath);
      
    } catch (err) {
      // 8. El servicio lanzará un error que podemos mostrar
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocurrió un error inesperado.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Correo Electrónico</Label>
        <Input
          id="email"
          type="email"
          placeholder="ana.garcia@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
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
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || !email || !password}
      >
        {isLoading ? (
          "Ingresando..."
        ) : (
          <>
            <LogInIcon className="mr-2 h-4 w-4" />
            Ingresar
          </>
        )}
      </Button>
    </form>
  );
}

/**
 * Fallback de carga para Suspense.
 */
function LoginFormFallback() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

/**
 * Página de Login principal (export default).
 * Envuelve el formulario en Suspense para evitar el error de build.
 */
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
          <CardDescription>
            Ingresa tu correo y contraseña para acceder al sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<LoginFormFallback />}>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
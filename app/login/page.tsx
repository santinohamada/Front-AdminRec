"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // Importar useSearchParams
import { LogInIcon, AlertCircleIcon } from "lucide-react"; // Para el error

// 1. Importar el store de autenticación
import { useAuthStore } from "@/store/authStore";
// 2. Importar los datos mock para la lista de usuarios
import { INITIAL_TEAM } from "@/services/mocks"; // Asegúrate que esta ruta es correcta

// 3. Importar componentes de UI
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input"; // Importar Input
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert"; // Para el error

export default function LoginPage() {
  const router = useRouter();

  const { login } = useAuthStore();

  // --- CAMBIO: Nuevos estados para email, password y error ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setError(""); // Limpiar errores previos

    // Simular una pequeña demora (como si fuera una llamada API)
    await new Promise((resolve) => setTimeout(resolve, 500));

    // --- CAMBIO: Lógica de validación ---
    
    // 1. Buscar al usuario por email
    const user = INITIAL_TEAM.find(
      (member) => member.email.toLowerCase() === email.toLowerCase()
    );

    // 2. Validar si el usuario existe
    if (!user) {
      setError("No se encontró ningún usuario con ese correo electrónico.");
      setIsLoading(false);
      return;
    }

    // 3. Validar la contraseña (asumiendo que añadiste `password` a tus mocks)
    // @ts-ignore - Asumiendo que el tipo TeamMember no tiene password aún
    if (user.password !== password) {
      setError("Contraseña incorrecta. Por favor, inténtalo de nuevo.");
      setIsLoading(false);
      return;
    }

    // 4. Éxito: Llamar a la función 'login' del store
    login(user.id);

   
    router.push("/");
  };

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
          <form onSubmit={handleLogin} className="space-y-4">
            {/* --- CAMBIO: Campo de Email --- */}
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

            {/* --- CAMBIO: Campo de Contraseña --- */}
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

            {/* --- CAMBIO: Muestra de Error --- */}
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
        </CardContent>
      </Card>
    </div>
  );
}
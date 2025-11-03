"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FolderKanban,
  Users,
  Package,
  ArrowRight,
  BarChartHorizontal,
  Terminal,
} from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// --- CAMBIO: Importar el store de autenticación ---
import { useAuthStore } from "@/store/authStore";

export default function HomePage() {
  // --- CAMBIO: Obtener el usuario actual del store ---
  const { currentUser } = useAuthStore();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Cartel de Bienvenida (Actualizado) */}
          <Alert className="border-primary">
            <Terminal className="h-4 w-4" />
            
            {/* --- CAMBIO: Mostrar el nombre del usuario --- */}
            {/* Usamos 'currentUser?.name' por si acaso, aunque el AuthGuard ya lo protege */}
            <AlertTitle className="font-semibold">
              ¡Bienvenido, {currentUser?.name}!
            </AlertTitle>

            <AlertDescription>
              Te encuentras en el panel central de gestión. Desde aquí puedes
              navegar a las secciones principales de la aplicación.
            </AlertDescription>
          </Alert>

          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold tracking-tight text-balance">
              Sistema de Gestión de Recursos
            </h1>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              Plataforma centralizada para la administración de proyectos,
              recursos y miembros del equipo.
            </p>
          </div>

          {/* Tarjetas de Navegación */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-border hover:border-primary transition-colors flex flex-col justify-between">
              <CardHeader>
                <FolderKanban className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Proyectos</CardTitle>
                <CardDescription>
                  Administra los proyectos de tu empresa mediante la asignación
                  de equipos y recursos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/projects">
                  <Button
                    variant="ghost"
                    className="w-full justify-between group"
                  >
                    Ver proyectos
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-border hover:border-primary transition-colors flex flex-col justify-between">
              <CardHeader>
                <Users className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Equipos</CardTitle>
                <CardDescription>
                  Administra los miembros del equipo, sus roles y proyectos
                  asignados.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/team">
                  <Button
                    variant="ghost"
                    className="w-full justify-between group"
                  >
                    Ver equipo
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-border hover:border-primary transition-colors flex flex-col justify-between">
              <CardHeader>
                <Package className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Recursos</CardTitle>
                <CardDescription>
                  Realizar el seguimiento y la gestión de los recursos de la
                  empresa y su asignación.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/resources">
                  <Button
                    variant="ghost"
                    className="w-full justify-between group"
                  >
                    Ver recursos
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-border hover:border-primary transition-colors flex flex-col justify-between">
              <CardHeader>
                <BarChartHorizontal className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Informe General</CardTitle>
                <CardDescription>
                  Genera un informe de estado de todos los proyectos, recursos
                  sobreasignados y proyectos cerrados.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* --- CAMBIO: Ruta de informe actualizada --- */}
                <Link href="/report">
                  <Button
                    variant="ghost"
                    className="w-full justify-between group"
                  >
                    Generar informe
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
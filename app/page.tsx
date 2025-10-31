"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FolderKanban, Users, Package, ArrowRight } from "lucide-react"
import { useEffect } from "react";
import { useProjectStore } from "@/store/projectStore";

export default function HomePage() {
  const {init} = useProjectStore();
  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold tracking-tight text-balance">Sistema de gestión de recursos</h1>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              Plataforma centralizada para la administracion de proyectos, recursos y miembros del equipo.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-border hover:border-primary transition-colors flex justify-between">
              <CardHeader>
                <FolderKanban className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Proyectos</CardTitle>
                <CardDescription>Administra los proyectos de tu empresa  mediante la asignacion de equipos y recursos</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/projects">
                  <Button variant="ghost" className="w-full justify-between group">
                    Ver proyectos
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-border hover:border-primary transition-colors flex justify-between">
              <CardHeader>
                <Users className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Equipos</CardTitle>
                <CardDescription>Administra los miembros del equipo, sus roles y proyectos asignados</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/team">
                  <Button variant="ghost" className="w-full justify-between group">
                    Ver equipo
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-border hover:border-primary transition-colors flex justify-between">
              <CardHeader>
                <Package className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Recursos</CardTitle>
                <CardDescription>Realizar el seguimiento y la gestión de los recursos de la empresa y su asignación.</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/resources">
                  <Button variant="ghost" className="w-full justify-between group">
                    Ver recursos
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          
        </div>
      </div>
    </div>
  )
}

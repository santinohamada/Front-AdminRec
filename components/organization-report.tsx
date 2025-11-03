"use client";

import { useMemo } from "react";
import type {
  Project,
  Task,
  Resource,
  ResourceAssignment,
  TeamMember,
} from "@/lib/project-types";
import { DateRange } from "react-day-picker";
import { formatCurrency, formatDate } from "@/lib/project-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { es } from "date-fns/locale";
import { format } from "date-fns";

interface OrganizationReportProps {
  projects: Project[];
  tasks: Task[];
  resources: Resource[];
  assignments: ResourceAssignment[];
  teamMembers: TeamMember[];
  dateRange: DateRange;
  reportDate: Date;
  isPdfMode: boolean; // Para ajustar estilos si es necesario
}

export function OrganizationReport({
  projects,
  tasks,
  teamMembers,
  dateRange,
  reportDate,
  isPdfMode,
}: OrganizationReportProps) {
  // --- Filtrado y Cálculos ---
  const filteredData = useMemo(() => {
    if (!dateRange.from || !dateRange.to) {
      return {
        filteredTasks: [],
        activeProjects: [],
        totalBudget: 0,
        totalProgressSum: 0,
      };
    }

    const from = dateRange.from;
    const to = dateRange.to;

    // Filtramos tareas que están activas (o terminan) dentro del rango
    const filteredTasks = tasks.filter((task) => {
      const endDate = new Date(task.end_date);
      return endDate >= from && endDate <= to;
    });

    // Obtenemos los IDs de los proyectos que tienen tareas en este rango
    const activeProjectIds = new Set(filteredTasks.map((t) => t.project_id));
    const activeProjects = projects.filter((p) => activeProjectIds.has(p.id));

    // Cálculos de Stats
    const totalBudget = activeProjects.reduce(
      (sum, p) => sum + (p.total_budget ?? 0),
      0
    );

    const totalProgressSum = activeProjects.reduce((sum, project) => {
      const projectTasks = filteredTasks.filter(
        (t) => t.project_id === project.id
      );
      if (projectTasks.length === 0) return sum;
      const projectProgress =
        projectTasks.reduce((s, t) => s + (t.progress ?? 0), 0) /
        projectTasks.length;
      return sum + projectProgress;
    }, 0);

    return {
      filteredTasks,
      activeProjects,
      totalBudget,
      totalProgressSum,
    };
  }, [projects, tasks, dateRange]);

  const { filteredTasks, activeProjects, totalBudget, totalProgressSum } =
    filteredData;

  const avgProgress =
    activeProjects.length > 0 ? totalProgressSum / activeProjects.length : 0;

  const getProjectManager = (managerId?: string) => {
    return teamMembers.find((m) => m.id === managerId)?.name || "N/A";
  };

  const getProjectStats = (projectId: string) => {
    const projectTasks = filteredTasks.filter(
      (t) => t.project_id === projectId
    );
    const completedTasks = projectTasks.filter(
      (t) => t.status === "completed"
    ).length;
    const progress =
      projectTasks.length > 0
        ? projectTasks.reduce((s, t) => s + (t.progress ?? 0), 0) /
          projectTasks.length
        : 0;
    return {
      taskCount: projectTasks.length,
      completedTasks,
      progress,
    };
  };

  return (
    <div className="space-y-8">
      {/* --- Cabecera del Reporte --- */}
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Reporte General de la Organización</h1>
        <div className="text-muted-foreground text-lg">
          <p>
            Período del Informe:{" "}
            <span className="font-semibold text-foreground">
              {dateRange.from?.toISOString().split("T")[0]} -{" "}
              {dateRange.to?.toISOString().split("T")[0]!}
            </span>
          </p>
          <p>
            Fecha de Generación:{" "}
            <span className="font-semibold text-foreground">
              {format(reportDate, "PPPpp", { locale: es })}
            </span>
          </p>
        </div>
      </header>

      {/* --- Stats Generales --- */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Proyectos Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeProjects.length}</div>
            <p className="text-xs text-muted-foreground">
              Proyectos con tareas en el período
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Presupuesto Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(totalBudget)}
            </div>
            <p className="text-xs text-muted-foreground">
              Suma de proyectos activos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Progreso Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgProgress.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Promedio de proyectos activos
            </p>
          </CardContent>
        </Card>
      </section>

      {/* --- Tabla de Proyectos --- */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">
          Resumen de Proyectos Activos
        </h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proyecto</TableHead>
                <TableHead>Gerente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Tareas (en período)</TableHead>
                <TableHead>Progreso (en período)</TableHead>
                <TableHead>Presupuesto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeProjects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    No se encontraron proyectos con actividad en este período.
                  </TableCell>
                </TableRow>
              )}
              {activeProjects.map((project) => {
                const stats = getProjectStats(project.id);
                return (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>
                      {getProjectManager(project.manager_id)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          project.status === "active" ? "default" : "secondary"
                        }
                      >
                        {project.status === "active" ? "Activo" : "Cerrado"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {stats.taskCount} (Completadas: {stats.completedTasks})
                    </TableCell>
                    <TableCell>{stats.progress.toFixed(1)}%</TableCell>
                    <TableCell>{formatCurrency(project.total_budget)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </section>
    </div>
  );
}
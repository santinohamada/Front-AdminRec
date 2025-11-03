"use client";

import { motion } from "framer-motion";
import type {
  Project,
  Task,
  Resource,
  ResourceAssignment,
  TeamMember, // Importar TeamMember
} from "@/lib/project-types";
import {
  formatCurrency,
  formatDate,
  calculateActualCost, // Usaremos esta función
  getTaskStatusInfo,
} from "@/lib/project-utils";
import {
  CheckCircle2Icon,
  ClockIcon,
  AlertCircleIcon,
  XCircleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
} from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useTeam } from "@/hooks/useTeam"; // Importar useTeam para los nombres
import { useMemo } from "react";

interface ProjectReportProps {
  project: Project;
  tasks: Task[]; // Tareas *totales* del proyecto
  resources: Resource[]; // Recursos *totales* del proyecto
  assignments: ResourceAssignment[]; // Asignaciones *totales* del proyecto
  isPdfMode?: boolean;
  // --- CAMBIO: Nuevas props ---
  currentUser: TeamMember | null;
  startDate: Date | undefined;
  endDate: Date | undefined;
}

export function ProjectReport({
  project,
  tasks,
  resources,
  assignments,
  isPdfMode = false,
  currentUser,
  startDate,
  endDate,
}: ProjectReportProps) {
  
  // Obtener todos los miembros del equipo para buscar nombres
  const { data: teamMembers = [] } = useTeam();

  // --- CAMBIO: Filtrar tareas basado en el rango de fechas ---
  const tasksToReport = useMemo(() => {
    if (!startDate || !endDate) {
      return tasks; // Si no hay rango, incluir todas las tareas
    }
    // Incluir tareas que *se solapan* con el rango de fechas
    return tasks.filter((t) => {
      const start = new Date(t.start_date);
      const end = new Date(t.end_date);
      // (Inicio Tarea <= Fin Rango) Y (Fin Tarea >= Inicio Rango)
      return start <= endDate && end >= startDate;
    });
  }, [tasks, startDate, endDate]);

  // --- Recalcular todo basado en 'tasksToReport' ---
  const totalTasks = tasksToReport.length;
  const completedTasks = tasksToReport.filter(
    (t) => t.status === "completed"
  ).length;
  const inProgressTasks = tasksToReport.filter(
    (t) => t.status === "in_progress"
  ).length;
  const blockedTasks = tasksToReport.filter(
    (t) => t.status === "blocked"
  ).length;
  const notStartedTasks = tasksToReport.filter(
    (t) => t.status === "not_started"
  ).length;

  const avgProgress =
    totalTasks > 0
      ? tasksToReport.reduce((sum, t) => sum + t.progress, 0) / totalTasks
      : 0;

  // Filtrar asignaciones y recursos que pertenecen a las tareas del reporte
  const assignmentsToReport = assignments.filter((a) =>
    tasksToReport.some((t) => t.id === a.task_id)
  );
  const resourceIdsToReport = new Set(
    assignmentsToReport.map((a) => a.resource_id)
  );
  const resourcesToReport = resources.filter((r) =>
    resourceIdsToReport.has(r.id)
  );
  
  // Costo *solo* de las tareas/asignaciones en el rango
  const actualCost = calculateActualCost(
    tasksToReport,
    assignmentsToReport,
    resourcesToReport
  );
  const budgetUsedPercentage = (actualCost / project.total_budget) * 100;
  
  // Horas *solo* de las tareas en el rango
  const totalHoursInPeriod = assignmentsToReport.reduce((sum, a) => sum + a.hours_assigned, 0);


  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* --- CAMBIO: Header actualizado --- */}
      <div
        className={`border-b pb-4 ${
          isPdfMode ? "border-gray-200" : "border-border"
        }`}
      >
        <h2
          className={`text-2xl font-bold mb-2 ${
            isPdfMode ? "text-black" : "text-foreground"
          }`}
        >
          Reporte de Proyecto
        </h2>
        <p
          className={`text-sm ${
            isPdfMode ? "text-gray-600" : "text-muted-foreground"
          }`}
        >
          Proyecto:{" "}
          <span
            className={`font-medium ${
              isPdfMode ? "text-black" : "text-foreground"
            }`}
          >
            {project.name}
          </span>
        </p>
        <p
          className={`text-xs ${
            isPdfMode ? "text-gray-500" : "text-muted-foreground"
          }`}
        >
          Rango del informe:{" "}
          {startDate ? formatDate(startDate.toISOString()) : "Inicio"} -{" "}
          {endDate ? formatDate(endDate.toISOString()) : "Fin"}
        </p>
        <p
          className={`text-xs ${
            isPdfMode ? "text-gray-500" : "text-muted-foreground"
          }`}
        >
          Generado por: {currentUser?.name ?? "N/A"}
        </p>
        <p
          className={`text-xs ${
            isPdfMode ? "text-gray-500" : "text-muted-foreground"
          }`}
        >
          Fecha de generación:{" "}
          {new Date().toLocaleString("es-AR", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </p>
      </div>

      {/* Resumen de Tareas (en rango) */}
      <div>
        <h3
          className={`text-lg font-semibold mb-3 ${
            isPdfMode ? "text-black" : "text-foreground"
          }`}
        >
          Resumen de Tareas (en rango)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className={isPdfMode ? "bg-white border border-gray-200" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-600">
                Completadas
              </CardTitle>
              <CheckCircle2Icon className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {completedTasks}
              </div>
            </CardContent>
          </Card>

          <Card className={isPdfMode ? "bg-white border border-gray-200" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-600">
                En Progreso
              </CardTitle>
              <ClockIcon className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {inProgressTasks}
              </div>
            </CardContent>
          </Card>

          <Card className={isPdfMode ? "bg-white border border-gray-200" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-600">
                Bloqueadas
              </CardTitle>
              <AlertCircleIcon className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {blockedTasks}
              </div>
            </CardContent>
          </Card>

          <Card className={isPdfMode ? "bg-white border border-gray-200" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle
                className={`text-sm font-medium ${
                  isPdfMode ? "text-gray-700" : "text-foreground"
                }`}
              >
                Sin Iniciar
              </CardTitle>
              <XCircleIcon
                className={`h-5 w-5 ${
                  isPdfMode ? "text-gray-500" : "text-muted-foreground"
                }`}
              />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  isPdfMode ? "text-gray-700" : "text-foreground"
                }`}
              >
                {notStartedTasks}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Avance y Presupuesto */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className={isPdfMode ? "bg-white border border-gray-200" : ""}>
          <CardHeader className="pb-4">
            <CardTitle
              className={`text-lg ${
                isPdfMode ? "text-black" : "text-foreground"
              }`}
            >
              Avance General (en rango)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-sm ${
                  isPdfMode ? "text-gray-600" : "text-muted-foreground"
                }`}
              >
                Progreso Promedio
              </span>
              <span
                className={`text-2xl font-bold ${
                  isPdfMode ? "text-black" : "text-foreground"
                }`}
              >
                {avgProgress.toFixed(1)}%
              </span>
            </div>
            <Progress value={avgProgress} className="h-3" />
          </CardContent>
        </Card>

        <Card className={isPdfMode ? "bg-white border border-gray-200" : ""}>
          <CardHeader className="pb-4">
            <CardTitle
              className={`text-lg ${
                isPdfMode ? "text-black" : "text-foreground"
              }`}
            >
              Presupuesto (en rango)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span
                className={`text-sm ${
                  isPdfMode ? "text-gray-600" : "text-muted-foreground"
                }`}
              >
                Presupuesto Total (Proyecto)
              </span>
              <span
                className={`font-semibold ${
                  isPdfMode ? "text-black" : "text-foreground"
                }`}
              >
                {formatCurrency(project.total_budget)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span
                className={`text-sm ${
                  isPdfMode ? "text-gray-600" : "text-muted-foreground"
                }`}
              >
                Gasto en el Período
              </span>
              <span
                className={`font-semibold ${
                  isPdfMode ? "text-black" : "text-foreground"
                }`}
              >
                {formatCurrency(actualCost)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span
                className={`text-sm ${
                  isPdfMode ? "text-gray-600" : "text-muted-foreground"
                }`}
              >
                Horas en el Período
              </span>
              <span
                className={`font-semibold ${
                  isPdfMode ? "text-black" : "text-foreground"
                }`}
              >
                {totalHoursInPeriod.toFixed(1)}h
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- CAMBIO: Detalle de Tareas --- */}
      <Card className={isPdfMode ? "bg-white border border-gray-200" : ""}>
        <CardHeader>
          <CardTitle
            className={`text-lg ${
              isPdfMode ? "text-black" : "text-foreground"
            }`}
          >
            Detalle de Tareas ({tasksToReport.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarea</TableHead>
                <TableHead>Asignado a</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Progreso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasksToReport.length > 0 ? (
                tasksToReport.map((task) => {
                  const assignee = teamMembers.find(
                    (m) => m.id === task.assignee_id
                  );
                  const statusInfo = getTaskStatusInfo(task.status);
                  return (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.name}</TableCell>
                      <TableCell>{assignee?.name ?? "N/A"}</TableCell>
                      <TableCell>
                        <Badge
                          variant="default"
                          className={statusInfo.color}
                        >
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{task.progress}%</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No hay tareas en el rango seleccionado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* --- CAMBIO: Detalle de Recursos --- */}
      <Card className={isPdfMode ? "bg-white border border-gray-200" : ""}>
        <CardHeader>
          <CardTitle
            className={`text-lg ${
              isPdfMode ? "text-black" : "text-foreground"
            }`}
          >
            Detalle de Recursos (en rango)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recurso</TableHead>
                <TableHead>Horas Asignadas (en rango)</TableHead>
                <TableHead>Costo (en rango)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resourcesToReport.length > 0 ? (
                resourcesToReport.map((res) => {
                  const hours = assignmentsToReport
                    .filter((a) => a.resource_id === res.id)
                    .reduce((sum, a) => sum + a.hours_assigned, 0);
                  const cost = hours * (res.hourly_rate ?? 0);
                  return (
                    <TableRow key={res.id}>
                      <TableCell className="font-medium">{res.name}</TableCell>
                      <TableCell>{hours.toFixed(1)}h</TableCell>
                      <TableCell>{formatCurrency(cost)}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    No hay recursos asignados en el rango seleccionado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
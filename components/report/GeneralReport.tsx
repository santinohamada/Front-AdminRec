"use client";

import { motion } from "framer-motion";
import type {
  Project,
  Task,
  Resource,
  ResourceAssignment,
  TeamMember,
} from "@/lib/project-types";
import { formatCurrency, formatDate } from "@/lib/project-utils";
import {
  FolderKanban,
  AlertCircleIcon, // Lo mantendremos para "cerrado" ya que es un estado de alerta
  Users,
  TrendingUpIcon,
  TrendingDownIcon,
  Package,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
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

interface GeneralReportProps {
  projects: Project[];
  tasks: Task[];
  resources: Resource[];
  assignments: ResourceAssignment[];
  startDate: Date | undefined;
  endDate: Date | undefined;
  isPdfMode?: boolean;
  currentUser:TeamMember | null
}

export function GeneralReport({
  projects,
  tasks,
  resources,
  assignments,
  startDate,
  endDate,
  isPdfMode = false,
  currentUser
}: GeneralReportProps) {
  // --- 1. Filtrar Proyectos por Fecha ---
  const filteredProjects = projects.filter((p) => {
    if (!startDate || !endDate) return true; // Si no hay rango, incluir todos
    const start = new Date(p.start_date);
    const end = new Date(p.end_date);
    return start <= endDate && end >= startDate;
  });

  // --- 2. Proyectos Cerrados (basado en tu lógica, usa la lista completa) ---
  const closedProjects = projects.filter((p) => p.status === "closed");

  // --- 3. Encontrar Recursos Sobreasignados (NUEVA LÓGICA POR SOLAPAMIENTO) ---

  // Helper para chequear si dos rangos de fechas se solapan
  const checkOverlap = (a: ResourceAssignment, b: ResourceAssignment) => {
    const a_start = new Date(a.start_date);
    const a_end = new Date(a.end_date);
    const b_start = new Date(b.start_date);
    const b_end = new Date(b.end_date);
    // Se solapan si (InicioA <= FinB) Y (FinA >= InicioB)
    return a_start <= b_end && a_end >= b_start;
  };

  const overAssignedResources: Resource[] = []; // Lista de Recursos sobreasignados
  const resourceOverlapDetails = new Map<string, Task[]>(); // Mapa para guardar las tareas en conflicto

  for (const resource of resources) {
    // 1. Obtener todas las asignaciones para este recurso
    const resAssignments = assignments.filter(
      (a) => a.resource_id === resource.id
    );
    if (resAssignments.length < 2) continue; // No puede haber solapamiento

    let hasOverlap = false;
    const overlappingTasks = new Set<Task>(); // Usar un Set para evitar duplicados

    // 2. Comparar cada asignación con las demás (O(n^2))
    for (let i = 0; i < resAssignments.length; i++) {
      for (let j = i + 1; j < resAssignments.length; j++) {
        if (checkOverlap(resAssignments[i], resAssignments[j])) {
          hasOverlap = true;
          // 3. Si hay solapamiento, encontrar las tareas asociadas
          const taskA = tasks.find((t) => t.id === resAssignments[i].task_id);
          const taskB = tasks.find((t) => t.id === resAssignments[j].task_id);
          if (taskA) overlappingTasks.add(taskA);
          if (taskB) overlappingTasks.add(taskB);
        }
      }
    }

    // 4. Si se encontró solapamiento, guardar el recurso y los detalles
    if (hasOverlap) {
      overAssignedResources.push(resource);
      resourceOverlapDetails.set(resource.id, Array.from(overlappingTasks));
    }
  }

  // --- 4. Calcular Stats Generales ---
  const totalBudget = filteredProjects.reduce(
    (sum, p) => sum + p.total_budget,
    0
  );
  const totalActualCost = filteredProjects.reduce((sum, p) => {
    const projectTasks = tasks.filter((t) => t.project_id === p.id);
    const projectAssignments = assignments.filter((a) =>
      projectTasks.some((t) => t.id === a.task_id)
    );
    const projectResourceIds = new Set(
      projectAssignments.map((a) => a.resource_id)
    );
    const projectResources = resources.filter((r) =>
      projectResourceIds.has(r.id)
    );

    const cost = projectAssignments.reduce((acc, assign) => {
      const resource = projectResources.find(
        (r) => r.id === assign.resource_id
      );
      return acc + assign.hours_assigned * (resource?.hourly_rate ?? 0);
    }, 0);
    return sum + cost;
  }, 0);
  const budgetUsedPercentage =
    totalBudget > 0 ? (totalActualCost / totalBudget) * 100 : 0;

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

      {/* Stats Generales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={isPdfMode ? "bg-white border border-gray-200" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Proyectos (en rango)
            </CardTitle>
            <FolderKanban className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredProjects.length}</div>
          </CardContent>
        </Card>
        <Card className={isPdfMode ? "bg-white border border-gray-200" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            {/* --- CAMBIO --- */}
            <CardTitle className="text-sm font-medium text-red-600">
              Proyectos Cerrados
            </CardTitle>
            <AlertCircleIcon className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {closedProjects.length}
            </div>
          </CardContent>
        </Card>
        <Card className={isPdfMode ? "bg-white border border-gray-200" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">
              Recursos Sobreasignados
            </CardTitle>
            <Users className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {overAssignedResources.length}
            </div>
          </CardContent>
        </Card>
        <Card className={isPdfMode ? "bg-white border border-gray-200" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recursos Totales
            </CardTitle>
            <Package className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resources.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Presupuesto General */}
      <Card className={isPdfMode ? "bg-white border border-gray-200" : ""}>
        <CardHeader>
          <CardTitle
            className={`text-lg ${
              isPdfMode ? "text-black" : "text-foreground"
            }`}
          >
            Presupuesto General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span
                className={`text-sm ${
                  isPdfMode ? "text-gray-600" : "text-muted-foreground"
                }`}
              >
                Presupuesto Total (Proyectos en rango)
              </span>
              <span
                className={`font-semibold ${
                  isPdfMode ? "text-black" : "text-foreground"
                }`}
              >
                {formatCurrency(totalBudget)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span
                className={`text-sm ${
                  isPdfMode ? "text-gray-600" : "text-muted-foreground"
                }`}
              >
                Gasto Actual Total
              </span>
              <span
                className={`font-semibold ${
                  isPdfMode ? "text-black" : "text-foreground"
                }`}
              >
                {formatCurrency(totalActualCost)}
              </span>
            </div>
          </div>
          <div
            className={`pt-4 border-t ${
              isPdfMode ? "border-gray-200" : "border-border"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-sm ${
                  isPdfMode ? "text-gray-600" : "text-muted-foreground"
                }`}
              >
                Uso del Presupuesto Total
              </span>
              <div className="flex items-center gap-2">
                {budgetUsedPercentage > 90 ? (
                  <TrendingUpIcon className="h-4 w-4 text-red-600" />
                ) : (
                  <TrendingDownIcon className="h-4 w-4 text-green-500" />
                )}
                <span
                  className={`font-bold ${
                    budgetUsedPercentage > 90
                      ? "text-red-600"
                      : "text-green-500"
                  }`}
                >
                  {budgetUsedPercentage.toFixed(1)}%
                </span>
              </div>
            </div>
            <Progress value={budgetUsedPercentage} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Listados de Alertas */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* --- CAMBIO: Tarjeta de Proyectos Cerrados --- */}
        <Card className={isPdfMode ? "bg-white border border-gray-200" : ""}>
          <CardHeader>
            <CardTitle
              className={`text-lg ${
                isPdfMode ? "text-black" : "text-foreground"
              }`}
            >
              Proyectos Cerrados ({closedProjects.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {closedProjects.length > 0 ? (
                closedProjects.map((project) => { // 'task' renombrado a 'project'
                  return (
                    <div
                      key={project.id} // key es del proyecto
                      className={`p-2 rounded ${
                        isPdfMode ? "bg-gray-50 border" : "bg-secondary"
                      }`}
                    >
                      <p
                        className={`text-sm font-medium ${
                          isPdfMode ? "text-black" : "text-foreground"
                        }`}
                      >
                        {project.name} {/* Se muestra el nombre del proyecto */}
                      </p>
                      {/* Se eliminó la búsqueda anidada de 'project' */}
                    </div>
                  );
                })
              ) : (
                <p
                  className={`text-sm ${
                    isPdfMode ? "text-gray-600" : "text-muted-foreground"
                  }`}
                >
                  No hay proyectos cerrados. {/* Mensaje corregido */}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        {/* --- Fin del Cambio --- */}

        {/* --- CAMBIO: Tarjeta de Recursos Sobreasignados --- */}
        <Card className={isPdfMode ? "bg-white border border-gray-200" : ""}>
          <CardHeader>
            <CardTitle
              className={`text-lg ${
                isPdfMode ? "text-black" : "text-foreground"
              }`}
            >
              Recursos Sobreasignados ({overAssignedResources.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {overAssignedResources.length > 0 ? (
                overAssignedResources.map((res) => { // res es un Recurso
                  const conflictingTasks = resourceOverlapDetails.get(res.id) || [];
                  return (
                    <div key={res.id} className="pt-3 border-t first:pt-0 first:border-t-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${isPdfMode ? "text-black" : "text-foreground"}`}>
                          {res.name}
                        </span>
                        <Badge className="bg-amber-300 text-black">
                          Sobreasignado
                        </Badge>
                      </div>
                      <p className={`text-xs mb-1 ${isPdfMode ? "text-gray-600" : "text-muted-foreground"}`}>
                        Tareas con fechas solapadas:
                      </p>
                      <div className="pl-2 space-y-1">
                        {conflictingTasks.map((task) => (
                          <div key={task.id} className={`text-xs p-1 rounded ${isPdfMode ? "bg-gray-50 border" : "bg-secondary/50"}`}>
                            {task.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p
                  className={`text-sm ${
                    isPdfMode ? "text-gray-600" : "text-muted-foreground"
                  }`}
                >
                  No hay recursos sobreasignados.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
         {/* --- Fin del Cambio --- */}
      </div>

      {/* Resumen de Proyectos */}
      <Card className={isPdfMode ? "bg-white border border-gray-200" : ""}>
        <CardHeader>
          <CardTitle
            className={`text-lg ${
              isPdfMode ? "text-black" : "text-foreground"
            }`}
          >
            Resumen de Proyectos ({filteredProjects.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proyecto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Progreso</TableHead>
                <TableHead>Uso de Presupuesto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => {
                const projectTasks = tasks.filter(
                  (t) => t.project_id === project.id
                );
                const avgProgress =
                  projectTasks.length > 0
                    ? projectTasks.reduce((sum, t) => sum + t.progress, 0) /
                      projectTasks.length
                    : 0;

                // (Copiado de la lógica de costo de arriba)
                const projectAssignments = assignments.filter((a) =>
                  projectTasks.some((t) => t.id === a.task_id)
                );
                const projectResourceIds = new Set(
                  projectAssignments.map((a) => a.resource_id)
                );
                const projectResources = resources.filter((r) =>
                  projectResourceIds.has(r.id)
                );
                const actualCost = projectAssignments.reduce((acc, assign) => {
                  const resource = projectResources.find(
                    (r) => r.id === assign.resource_id
                  );
                  return (
                    acc + assign.hours_assigned * (resource?.hourly_rate ?? 0)
                  );
                }, 0);
                
                // Evitar división por cero si el presupuesto es 0
                const budgetUse =
                  project.total_budget > 0
                    ? (actualCost / project.total_budget) * 100
                    : 0;

                return (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                      {project.name}
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
                      <div className="flex items-center gap-2">
                        <Progress value={avgProgress} className="h-2 w-20" />
                        <span>{avgProgress.toFixed(0)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          budgetUse > 90 ? "text-red-600 font-medium" : ""
                        }
                      >
                        {budgetUse.toFixed(0)}%
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
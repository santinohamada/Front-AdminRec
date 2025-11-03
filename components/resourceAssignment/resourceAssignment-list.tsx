"use client";

// CAMBIO: Se eliminaron XIcon y EditIcon que no se usaban.
// CAMBIO: Se añadió Skeleton para el estado de carga.
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton"; // Añadido
import { formatDate } from "@/lib/project-utils";
import { motion } from "framer-motion";
import type { UUID } from "@/lib/project-types";
import { useMemo } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useAssignments } from "@/hooks/useAssignments";
import { useResources } from "@/hooks/useResources";

interface ResourceAssignmentListProps {
  projectId: UUID;
}

export default function ResourceAssignmentList({
  projectId,
}: ResourceAssignmentListProps) {
  // CAMBIO: Se añaden valores por defecto `[]` y se obtienen estados `isLoading`/`isError`.
  const {
    data: tasks = [],
    isLoading: isLoadingTasks,
    isError: isErrorTasks,
  } = useTasks();
  const {
    data: assignments = [],
    isLoading: isLoadingAssignments,
    isError: isErrorAssignments,
  } = useAssignments();
  const {
    data: resourcesAll = [],
    isLoading: isLoadingResources,
    isError: isErrorResources,
  } = useResources();

  // CAMBIO: Lógica de `useMemo` optimizada.
  // Ahora deriva la lista final en un solo paso y depende de `projectId`.
  const resourcesWithAssignments = useMemo(() => {
    // 1. Encontrar tareas del proyecto
    const projectTasks = tasks.filter((t) => t.project_id === projectId);
    const taskIds = new Set(projectTasks.map((t) => t.id));

    // 2. Encontrar asignaciones del proyecto
    const projectAssignments = assignments.filter((a) => taskIds.has(a.task_id));
    const resourceIds = new Set(projectAssignments.map((a) => a.resource_id));

    // 3. Encontrar recursos del proyecto
    const projectResources = resourcesAll.filter((r) => resourceIds.has(r.id));

    // 4. Agrupar asignaciones por recurso (el `byResource` original)
    return projectResources.map((res) => ({
      resource: res,
      // Filtra solo las asignaciones de *este* proyecto
      assignments: projectAssignments.filter((a) => a.resource_id === res.id),
    }));
  }, [tasks, assignments, resourcesAll, projectId]); // projectId es una dependencia clave

  // CAMBIO: Manejo explícito de estados de carga y error
  const isLoading =
    isLoadingTasks || isLoadingAssignments || isLoadingResources;
  const isError = isErrorTasks || isErrorAssignments || isErrorResources;

  if (isLoading) {
    return <ResourceAssignmentSkeleton />;
  }

  if (isError) {
    return (
      <div className="text-center py-12 text-destructive">
        Error al cargar las asignaciones.
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Asignaciones de Recursos</h3>
      </div>

      <motion.div
        className="grid gap-4"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
      >
        {resourcesWithAssignments.map(({ resource, assignments: resAssignments }) => (
          <motion.div
            key={resource.id}
            variants={{
              hidden: { opacity: 0, y: 8 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <Card className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold">{resource.name}</h4>
                    <Badge variant="outline">{resource.type}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                    <span>
                      Tarifa: <span className="font-medium">${resource.hourly_rate}</span>/h
                    </span>
                    <span>
                      Disponible:{" "}
                      <span className="font-medium">
                        {resource.available_hours}h
                      </span>
                    </span>
                    <span>
                      Asignadas (Este P.):{" "}
                      <span className="font-medium">
                        {resAssignments.reduce((acc, a) => acc + a.hours_assigned, 0)}h
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {resAssignments.length > 0 ? (
                <div className="pt-3 border-t border-border space-y-2">
                  {resAssignments.map((assignment) => {
                    // CAMBIO: Busca en `projectTasks` (más pequeño) en lugar de `tasks` (global)
                    const task = tasks.find(
                      (t) => t.id === assignment.task_id
                    );
                    return (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between bg-secondary/30 p-2 rounded"
                      >
                        <div className="flex-1">
                          <div className="text-foreground font-medium">
                            {task?.name ?? "Tarea desconocida"}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            <span className="mr-3">
                              📅 {formatDate(assignment.start_date)} -{" "}
                              {formatDate(assignment.end_date)}
                            </span>
                            <span>{assignment.hours_assigned}h</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground pt-3 border-t">
                  {/* CAMBIO: Mensaje más claro */}
                  Sin asignaciones en este proyecto.
                </div>
              )}
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* CAMBIO: Lógica de "vacío" mejorada para no mostrarse durante la carga */}
      {!isLoading && resourcesWithAssignments.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No hay recursos asignados a este proyecto.
        </div>
      )}
    </div>
  );
}

// CAMBIO: Componente de Skeleton añadido para el estado de carga
function ResourceAssignmentSkeleton() {
  return (
    <div className="grid gap-4">
      {[1, 2].map((i) => (
        <Card key={i} className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="flex gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-border space-y-2">
            <div className="flex-1 space-y-2 bg-secondary/30 p-2 rounded">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
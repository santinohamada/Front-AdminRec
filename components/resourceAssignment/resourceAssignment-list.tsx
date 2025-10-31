"use client";

import { XIcon, EditIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Resource, ResourceAssignment, Task } from "@/lib/project-types";
import { formatDate } from "@/lib/project-utils";
import { motion } from "framer-motion";

interface ResourceAssignmentListProps {
  resources: Resource[]; // recursos del proyecto (pueden venir filtrados por store)
  assignments: ResourceAssignment[]; // asignaciones ya filtradas para el proyecto
  tasks: Task[]; // tareas del proyecto
  

}

export default function ResourceAssignmentList({
  resources,
  assignments,
  tasks,

}: ResourceAssignmentListProps) {
  // Agrupamos asignaciones por recurso para mostrar por recurso
  const byResource = resources.map((res) => ({
    resource: res,
    assignments: assignments.filter((a) => a.resource_id === res.id),
  }));
  console.log(byResource);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Asignaciones</h3>
        
      </div>

      <motion.div
        className="grid gap-4"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
      >
        {byResource.map(({ resource, assignments: resAssignments }) => (
          <motion.div key={resource.id} variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
            <Card className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold">{resource.name}</h4>
                    <Badge variant="outline">{resource.type}</Badge>
                  </div>
                  <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                    <span>Tarifa: <span className="font-medium">{resource.hourly_rate}</span>/h</span>
                    <span>Disponible: <span className="font-medium">{resource.available_hours}h</span></span>
                  </div>
                </div>

                {/* no hay edición de recurso aquí; solo asignaciones */}
              </div>

              {resAssignments.length > 0 ? (
                <div className="pt-3 border-t border-border space-y-2">
                  {resAssignments.map((assignment) => {
                    const task = tasks.find((t) => t.id === assignment.task_id);
                    return (
                      <div key={assignment.id} className="flex items-center justify-between bg-secondary/30 p-2 rounded">
                        <div className="flex-1">
                          <div className="text-foreground font-medium">{task?.name ?? "Tarea desconocida"}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            <span className="mr-3">📅 {formatDate(assignment.start_date)} - {formatDate(assignment.end_date)}</span>
                            <span>{assignment.hours_assigned}h</span>
                          </div>
                        </div>

                       
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground pt-3">Sin asignaciones para este recurso.</div>
              )}
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Si no hay recursos listados */}
      {resources.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No hay recursos en este proyecto.</div>
      )}
    </div>
  );
}

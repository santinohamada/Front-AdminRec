"use client"

import { PlusIcon, XIcon, EditIcon, TrashIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Resource, ResourceAssignment, Task } from "@/lib/project-types"
import { calculateResourceHoursLeft, formatCurrency, formatDate } from "@/lib/project-utils"
import { motion } from "framer-motion"

interface ResourceListProps {
  resources: Resource[]
  assignments: ResourceAssignment[]
  tasks: Task[]
  onAssignResource: () => void
  onRemoveAssignment: (assignmentId: number) => void
  onAddResource: () => void
  onEditResource: (resource: Resource) => void
  onDeleteResource: (resourceId: number) => void
  onUpdateAssignment: (assignment: ResourceAssignment) => void
}

export function ResourceList({
  resources,
  assignments,
  tasks,
  onRemoveAssignment,
  onAddResource,
  onEditResource,
  onDeleteResource,
}: ResourceListProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-foreground">Gestión de Recursos</h3>
        <Button onClick={onAddResource} variant="outline">
          <PlusIcon className="h-4 w-4 mr-2" />
          Nuevo Recurso
        </Button>
      </div>

      <motion.div
        className="grid gap-4"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.05,
            },
          },
        }}
      >
        {resources.map((resource) => {
          const hoursLeft = calculateResourceHoursLeft(resource.id, resource, assignments)
          const hoursUsed = resource.availability_hours - hoursLeft
          const utilizationPercent = (hoursUsed / resource.availability_hours) * 100

          const resourceAssignments = assignments.filter((a) => a.resource_id === resource.id)

          return (
            <motion.div key={resource.id} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
              <Card className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-foreground">{resource.name}</h4>
                      <Badge variant="outline">{resource.type}</Badge>
                    </div>
                    <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                      <span>
                        Tarifa:{" "}
                        <span className="text-foreground font-medium">{formatCurrency(resource.hourly_rate)}/h</span>
                      </span>
                      <span>
                        Disponible:{" "}
                        <span className={`font-medium ${hoursLeft <= 0 ? "text-red-500" : "text-foreground"}`}>
                          {hoursLeft}h
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEditResource(resource)} title="Editar recurso">
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteResource(resource.id)}
                      title="Eliminar recurso"
                    >
                      <TrashIcon className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Utilización</span>
                    <span className="text-foreground">
                      {hoursUsed}h / {resource.availability_hours}h ({Math.round(utilizationPercent)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full transition-all duration-300 ${
                        utilizationPercent > 100
                          ? "bg-red-500"
                          : utilizationPercent > 90
                            ? "bg-yellow-500"
                            : "bg-primary"
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {resourceAssignments.length > 0 && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-sm font-medium text-foreground mb-2">Asignaciones:</p>
                    <div className="space-y-2">
                      {resourceAssignments.map((assignment) => {
                        const task = tasks.find((t) => t.id === assignment.task_id)

                        return (
                          <div
                            key={assignment.id}
                            className="flex items-center justify-between text-sm bg-secondary/30 p-2 rounded"
                          >
                            <div className="flex-1">
                              <div className="text-foreground font-medium">{task?.title}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                <span className="mr-3">
                                  📅 {formatDate(assignment.start_date)} - {formatDate(assignment.end_date)}
                                </span>
                                <span>{assignment.hours_assigned}h asignadas</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => onRemoveAssignment(assignment.id)}>
                              <XIcon className="h-3 w-3" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {resources.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No hay recursos disponibles. Crea uno para comenzar.
        </div>
      )}
    </div>
  )
}

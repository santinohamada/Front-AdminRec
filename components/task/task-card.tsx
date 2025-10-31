"use client"

import { EditIcon, TrashIcon, AlertCircleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Task, Resource, ResourceAssignment } from "@/lib/project-types"
import { formatCurrency, formatDate, getTaskStatusInfo } from "@/lib/project-utils"
import { motion } from "framer-motion"

interface TaskCardProps {
  task: Task
  resources: Resource[]
  assignments: ResourceAssignment[]
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  isProjectClosed?: boolean // Added prop to disable actions when project is closed
}

export function TaskCard({ task, resources, assignments, onEdit, onDelete, isProjectClosed = false }: TaskCardProps) {
  const taskAssignments = assignments.filter((a) => a.task_id === task.id)
  const statusInfo = getTaskStatusInfo(task.status)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      whileHover={{ scale: 1.01 }}
    >
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h3 className="font-semibold text-foreground text-lg">{task.name}</h3>
              <Badge variant="default" className={statusInfo.color}>
                {task.status === "blocked" && <AlertCircleIcon className="h-3 w-3 mr-1" />}
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{task.description}</p>

            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Progreso</span>
                <span className="text-foreground font-medium">{task.progress}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${
                    task.progress === 100 ? "bg-green-500" : task.progress >= 50 ? "bg-blue-500" : "bg-yellow-500"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${task.progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Asignado a</span>
                <span className="text-foreground font-medium">{task.assignee_id|| "Sin asignar"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Fecha de Vencimiento</span>
                <span className="text-foreground font-medium">{formatDate(task.end_date)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Horas</span>
                <span className="text-foreground font-medium">{task.estimated_hours}h</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Presupuesto</span>
                <span className="text-foreground font-medium">{formatCurrency(task.budget_allocated)}</span>
              </div>
            </div>

            {taskAssignments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {taskAssignments.map((assignment) => {
                  const resource = resources.find((r) => r.id === assignment.resource_id)
                  return (
                    <Badge key={assignment.id} variant="outline" className="text-xs">
                      {resource?.name} ({assignment.hours_assigned}h)
                    </Badge>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex gap-2 ml-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(task)}
              title="Editar tarea"
              disabled={isProjectClosed}
            >
              <EditIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(task.id)}
              title="Eliminar tarea"
              disabled={isProjectClosed}
            >
              <TrashIcon className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

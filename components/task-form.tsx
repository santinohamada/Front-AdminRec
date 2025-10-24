"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Task, TeamMember, Resource, ResourceAssignment, Project } from "@/lib/project-types"
import {
  deriveStatusFromProgress,
  checkResourceConflicts,
  validateTaskProgress,
  validateTaskDatesInProjectRange,
  validateProjectBudget,
  validateResourceHours,
} from "@/lib/project-utils"
import { motion } from "framer-motion"
import { AlertTriangleIcon, PlusIcon, XIcon } from "lucide-react"

interface TaskFormProps {
  task?: Task
  projectId: number
  project: Project
  teamMembers: TeamMember[]
  resources: Resource[]
  assignments: ResourceAssignment[]
  tasks: Task[]
  onSave: (task: Omit<Task, "id"> | Task, resourceAssignments?: Omit<ResourceAssignment, "id" | "task_id">[]) => void
  onCancel: () => void
}

interface ResourceAssignmentForm {
  resource_id: number
  hours_assigned: number
  start_date: string
  end_date: string
}

export function TaskForm({
  task,
  projectId,
  project,
  teamMembers,
  resources,
  assignments,
  tasks,
  onSave,
  onCancel,
}: TaskFormProps) {
  const [formData, setFormData] = useState<Omit<Task, "id">>({
    project_id: task?.project_id || projectId,
    title: task?.title || "",
    description: task?.description || "",
    assignee: task?.assignee || "",
    start_date: task?.start_date || "",
    due_date: task?.due_date || "",
    status: task?.status || "not_started",
    progress: task?.progress || 0,
    estimated_hours: task?.estimated_hours || 0,
    budget_allocated: task?.budget_allocated || 0,
  })

  const [isBlocked, setIsBlocked] = useState(task?.status === "blocked")
  const [resourceConflicts, setResourceConflicts] = useState<
    { resourceName: string; conflictingTasks: string[]; dates: string }[]
  >([])
  const [validationWarnings, setValidationWarnings] = useState<string[]>([])

  const [selectedResources, setSelectedResources] = useState<ResourceAssignmentForm[]>([])

  useEffect(() => {
    if (task) {
      const taskAssignments = assignments.filter((a) => a.task_id === task.id)
      setSelectedResources(
        taskAssignments.map((a) => ({
          resource_id: a.resource_id,
          hours_assigned: a.hours_assigned,
          start_date: a.start_date,
          end_date: a.end_date,
        })),
      )
    }
  }, [task, assignments])

  useEffect(() => {
    const conflicts: { resourceName: string; conflictingTasks: string[]; dates: string }[] = []
    const warnings: string[] = []

    for (const selected of selectedResources) {
      if (!selected.start_date || !selected.end_date || selected.resource_id === 0) continue

      const resource = resources.find((r) => r.id === selected.resource_id)
      if (!resource) continue

      const { hasConflict, conflictingAssignments } = checkResourceConflicts(
        selected.resource_id,
        selected.start_date,
        selected.end_date,
        task?.id,
        assignments,
      )

      if (hasConflict) {
        const conflictingTaskNames = conflictingAssignments
          .map((a) => {
            const conflictTask = tasks.find((t) => t.id === a.task_id)
            return conflictTask ? `${conflictTask.title} (${a.start_date} - ${a.end_date})` : ""
          })
          .filter(Boolean)

        conflicts.push({
          resourceName: resource.name,
          conflictingTasks: conflictingTaskNames,
          dates: `${selected.start_date} - ${selected.end_date}`,
        })
      }

      const hoursValidation = validateResourceHours(
        selected.resource_id,
        resource,
        assignments,
        selected.hours_assigned,
        undefined,
      )

      if (!hoursValidation.valid) {
        warnings.push(`${resource.name}: ${hoursValidation.error}`)
      }
    }

    setResourceConflicts(conflicts)
    setValidationWarnings(warnings)
  }, [selectedResources, task, assignments, resources, tasks])

  const handleAddResource = () => {
    setSelectedResources([
      ...selectedResources,
      {
        resource_id: 0,
        hours_assigned: 0,
        start_date: formData.start_date || "",
        end_date: formData.due_date || "",
      },
    ])
  }

  const handleRemoveResource = (index: number) => {
    setSelectedResources(selectedResources.filter((_, i) => i !== index))
  }

  const handleResourceChange = (
    index: number,
    field: "resource_id" | "hours_assigned" | "start_date" | "end_date",
    value: number | string,
  ) => {
    const updated = [...selectedResources]
    updated[index] = { ...updated[index], [field]: value }
    setSelectedResources(updated)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (project.status === "closed") {
      alert("No se pueden modificar tareas en un proyecto cerrado")
      return
    }

    if (!formData.title.trim()) {
      alert("El título de la tarea es requerido")
      return
    }

    if (!formData.start_date || !formData.due_date) {
      alert("Las fechas de inicio y fin son requeridas")
      return
    }

    if (new Date(formData.start_date) > new Date(formData.due_date)) {
      alert("La fecha de inicio debe ser anterior a la fecha de fin")
      return
    }

    const progressValidation = validateTaskProgress(formData.progress)
    if (!progressValidation.valid) {
      alert(progressValidation.error)
      return
    }

    const datesValidation = validateTaskDatesInProjectRange(
      formData.start_date,
      formData.due_date,
      project.start_date,
      project.end_date,
    )
    if (!datesValidation.valid) {
      alert(datesValidation.error)
      return
    }

    const budgetValidation = validateProjectBudget(
      project.total_budget,
      tasks.filter((t) => t.project_id === projectId),
      task?.id,
      formData.budget_allocated,
    )
    if (!budgetValidation.valid) {
      alert(budgetValidation.error)
      return
    }

    for (const resource of selectedResources) {
      if (resource.resource_id > 0 && resource.hours_assigned > 0) {
        if (!resource.start_date || !resource.end_date) {
          alert("Todas las asignaciones de recursos deben tener fechas de inicio y fin")
          return
        }
        if (new Date(resource.start_date) > new Date(resource.end_date)) {
          alert("La fecha de inicio de la asignación debe ser anterior a la fecha de fin")
          return
        }

        if (
          new Date(resource.start_date) < new Date(formData.start_date) ||
          new Date(resource.end_date) > new Date(formData.due_date)
        ) {
          alert("Las fechas de asignación de recursos deben estar dentro de las fechas de la tarea")
          return
        }
      }
    }

    const validResources = selectedResources.filter(
      (r) => r.resource_id > 0 && r.hours_assigned > 0 && r.start_date && r.end_date,
    )

    const derivedStatus = deriveStatusFromProgress(formData.progress, isBlocked)
    const taskData = { ...formData, status: derivedStatus }

    if (task) {
      onSave({ ...taskData, id: task.id }, validResources)
    } else {
      onSave(taskData, validResources)
    }
  }

  const derivedStatus = deriveStatusFromProgress(formData.progress, isBlocked)
  const statusLabels = {
    not_started: "Sin Iniciar",
    in_progress: "En Progreso",
    blocked: "Bloqueada",
    completed: "Completada",
  }

  const isDisabled = project.status === "closed"

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-4"
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
      {isDisabled && (
        <motion.div
          className="bg-red-500/10 border border-red-500/20 rounded-lg p-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-600">Proyecto Cerrado</h4>
              <p className="text-sm text-red-700 mt-1">
                Este proyecto está cerrado y no se pueden realizar modificaciones.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {resourceConflicts.length > 0 && (
        <motion.div
          className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-600 mb-2">Advertencia: Recursos Sobreasignados</h4>
              {resourceConflicts.map((conflict, idx) => (
                <div key={idx} className="text-sm text-yellow-700 mb-2">
                  <p className="font-medium">
                    {conflict.resourceName} ({conflict.dates})
                  </p>
                  <p className="text-xs">Ya está asignado a:</p>
                  <ul className="text-xs ml-4 list-disc">
                    {conflict.conflictingTasks.map((task, i) => (
                      <li key={i}>{task}</li>
                    ))}
                  </ul>
                </div>
              ))}
              <p className="text-xs text-yellow-600 mt-2">
                Puedes continuar con el registro, pero considera reasignar recursos o ajustar las fechas.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {validationWarnings.length > 0 && (
        <motion.div
          className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangleIcon className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-orange-600 mb-2">Advertencia: Límite de Horas Excedido</h4>
              {validationWarnings.map((warning, idx) => (
                <p key={idx} className="text-sm text-orange-700 mb-1">
                  {warning}
                </p>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}>
        <label className="block text-sm font-medium text-foreground mb-2">Título *</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Título de la tarea"
          required
          disabled={isDisabled}
        />
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}>
        <label className="block text-sm font-medium text-foreground mb-2">Descripción</label>
        <textarea
          className="w-full min-h-[80px] px-3 py-2 bg-background border border-input rounded-md text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descripción de la tarea"
          disabled={isDisabled}
        />
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}>
        <label className="block text-sm font-medium text-foreground mb-2">Asignado a</label>
        <select
          className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          value={formData.assignee}
          onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
          disabled={isDisabled}
        >
          <option value="">Sin asignar</option>
          {teamMembers.map((member) => (
            <option key={member.id} value={member.name}>
              {member.name}
            </option>
          ))}
        </select>
      </motion.div>

      <motion.div className="space-y-3" variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Progreso (%) *</label>
          <Input
            type="number"
            min="0"
            max="100"
            value={formData.progress}
            onChange={(e) => setFormData({ ...formData, progress: Math.min(100, Math.max(0, Number(e.target.value))) })}
            disabled={isDisabled}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="blocked"
            checked={isBlocked}
            onChange={(e) => setIsBlocked(e.target.checked)}
            className="w-4 h-4 rounded border-input bg-background disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isDisabled}
          />
          <label htmlFor="blocked" className="text-sm text-foreground cursor-pointer">
            Marcar como bloqueada
          </label>
        </div>

        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md border border-border">
          <span className="font-medium">Estado derivado:</span>{" "}
          <span className="text-foreground">{statusLabels[derivedStatus]}</span>
          <p className="text-xs mt-1">
            El estado se calcula automáticamente según el progreso (0% = Sin Iniciar, 1-99% = En Progreso, 100% =
            Completada)
          </p>
        </div>
      </motion.div>

      <motion.div
        className="grid grid-cols-2 gap-4"
        variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
      >
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Fecha de Inicio *</label>
          <Input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
            disabled={isDisabled}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Fecha de Vencimiento *</label>
          <Input
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            required
            disabled={isDisabled}
          />
        </div>
      </motion.div>

      <motion.div
        className="grid grid-cols-2 gap-4"
        variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
      >
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Horas Estimadas</label>
          <Input
            type="number"
            min="0"
            value={formData.estimated_hours}
            onChange={(e) => setFormData({ ...formData, estimated_hours: Number(e.target.value) })}
            disabled={isDisabled}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Presupuesto Asignado</label>
          <Input
            type="number"
            min="0"
            value={formData.budget_allocated}
            onChange={(e) => setFormData({ ...formData, budget_allocated: Number(e.target.value) })}
            disabled={isDisabled}
          />
        </div>
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }} className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-foreground">Asignar Recursos</label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAddResource}
            className="bg-transparent"
            disabled={isDisabled}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Agregar Recurso
          </Button>
        </div>

        {selectedResources.length > 0 && (
          <div className="space-y-3 border border-border rounded-lg p-3 bg-muted/30">
            {selectedResources.map((selected, index) => (
              <div key={index} className="space-y-2 p-3 bg-background rounded-md border border-border">
                <div className="flex gap-2 items-start">
                  <div className="flex-1">
                    <select
                      className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      value={selected.resource_id}
                      onChange={(e) => handleResourceChange(index, "resource_id", Number(e.target.value))}
                      disabled={isDisabled}
                    >
                      <option value={0}>Seleccionar recurso...</option>
                      {resources.map((resource) => (
                        <option key={resource.id} value={resource.id}>
                          {resource.name} ({resource.type})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      min="0"
                      placeholder="Horas"
                      value={selected.hours_assigned || ""}
                      onChange={(e) => handleResourceChange(index, "hours_assigned", Number(e.target.value))}
                      className="text-sm"
                      disabled={isDisabled}
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveResource(index)}
                    className="text-destructive hover:text-destructive"
                    disabled={isDisabled}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Fecha Inicio</label>
                    <Input
                      type="date"
                      value={selected.start_date}
                      onChange={(e) => handleResourceChange(index, "start_date", e.target.value)}
                      className="text-sm"
                      disabled={isDisabled}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Fecha Fin</label>
                    <Input
                      type="date"
                      value={selected.end_date}
                      onChange={(e) => handleResourceChange(index, "end_date", e.target.value)}
                      className="text-sm"
                      disabled={isDisabled}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedResources.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No hay recursos asignados. Haz clic en "Agregar Recurso" para asignar recursos a esta tarea.
          </p>
        )}
      </motion.div>

      <motion.div
        className="flex gap-3 pt-4"
        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
      >
        <Button type="submit" className="flex-1" disabled={isDisabled}>
          {task ? "Actualizar Tarea" : "Crear Tarea"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
          Cancelar
        </Button>
      </motion.div>
    </motion.form>
  )
}

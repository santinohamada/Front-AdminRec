"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { motion } from "framer-motion";
import { AlertTriangleIcon, PlusIcon, XIcon } from "lucide-react";

import type {
  Task,
  TeamMember,
  Resource,
  ResourceAssignment,
  Project,
  UUID,
  NewTask,
  NewResourceAssignment,
  TaskStatus,
} from "../../lib/project-types";

const deriveStatusFromProgress = (
  progress: number,
  isBlocked: boolean
): TaskStatus => {
  if (isBlocked) return "blocked";
  if (progress === 100) return "completed";
  if (progress > 0) return "in_progress";
  return "not_started";
};

import {
  checkResourceConflicts,
  validateTaskProgress,
  validateTaskDatesInProjectRange,
  validateProjectBudget,
} from "../../lib/project-utils";

interface TaskFormProps {
  task?: Task;
  projectId: UUID;
  project: Project;
  teamMembers: TeamMember[];
  resources: Resource[];
  assignments: ResourceAssignment[];
  tasks: Task[];
  onSave: (
    task: Omit<Task, "id"> | Task,
    resourceAssignments?: Omit<NewResourceAssignment, "task_id">[]
  ) => void;
  onCancel: () => void;
}

interface ResourceAssignmentForm {
  resource_id: UUID;
  hours_assigned: number;
  start_date: string;
  end_date: string;
}

type TaskFormData = Omit<NewTask, "status" | "completed">;

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
  const defaultAssigneeId =
    task?.assignee_id || (teamMembers.length > 0 ? teamMembers[0].id : "");

  const [formData, setFormData] = useState<TaskFormData>({
    project_id: task?.project_id || projectId,
    name: task?.name || "",
    description: task?.description || "",
    assignee_id: defaultAssigneeId,
    start_date: task?.start_date || "",
    end_date: task?.end_date || "",
    priority: task?.priority || "medium",
    progress: task?.progress || 0,
    estimated_hours: task?.estimated_hours || 0,
    budget_allocated: task?.budget_allocated || 0,
  });

  const [isBlocked, setIsBlocked] = useState(task?.status === "blocked");
  const [criticalError, setCriticalError] = useState<string | null>(null);
  const [resourceConflicts, setResourceConflicts] = useState<
    { resourceName: string; conflictingTasks: string[]; dates: string }[]
  >([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  const [selectedResources, setSelectedResources] = useState<
    ResourceAssignmentForm[]
  >([]);

  useEffect(() => {
    if (task) {
      const taskAssignments = assignments.filter((a) => a.task_id === task.id);
      setSelectedResources(
        taskAssignments.map((a) => ({
          resource_id: a.resource_id,
          hours_assigned: a.hours_assigned,
          start_date: a.start_date,
          end_date: a.end_date,
        }))
      );
    }
  }, [task, assignments]);

  useEffect(() => {
    setSelectedResources((prev) =>
      prev.map((res) => {
        let newStart = res.start_date;
        let newEnd = res.end_date;

        if (newStart && formData.start_date && newStart < formData.start_date) {
          newStart = formData.start_date;
        }

        if (newEnd && formData.end_date && newEnd > formData.end_date) {
          newEnd = formData.end_date;
        }

        if (newStart && newEnd && newStart > newEnd) {
          newEnd = newStart;
        }

        return { ...res, start_date: newStart, end_date: newEnd };
      })
    );
  }, [formData.start_date, formData.end_date]);

  useEffect(() => {
    setCriticalError(null);
  
    const conflicts: {
      resourceName: string;
      conflictingTasks: string[];
      dates: string;
    }[] = [];
    const warnings: string[] = [];
  
    // Map: resource_id -> total de horas que se están solicitando en el formulario (puede haber varias filas por recurso)
    const desiredByResource = selectedResources.reduce<Record<string, number>>((acc, s) => {
      if (!s.resource_id) return acc;
      acc[s.resource_id] = (acc[s.resource_id] || 0) + (Number(s.hours_assigned) || 0);
      return acc;
    }, {});
  
    // Recorremos cada recurso que se está intentando asignar
    for (const [resourceId, desiredTotal] of Object.entries(desiredByResource)) {
      const resource = resources.find((r) => r.id === resourceId);
      if (!resource) continue;
  
      // Horas que este recurso tiene actualmente asignadas a ESTA tarea (si estamos editando)
      const currentAssignedOnThisTask = assignments
        .filter((a) => a.resource_id === resourceId && a.task_id === task?.id)
        .reduce((sum, a) => sum + (a.hours_assigned || 0), 0);
  
      // available_hours en tus recursos ya refleja la capacidad restante *excluyendo* todas las asignaciones.
      // Para poder reutilizar las horas que ya estaban en esta tarea, las sumamos de vuelta.
      const availableForThisTask = (resource.available_hours || 0) + currentAssignedOnThisTask;
  
      // Si lo que el formulario intenta asignar excede la capacidad reutilizable, avisamos
      if (desiredTotal > availableForThisTask) {
        warnings.push(
          `${resource.name}: las horas solicitadas (${desiredTotal}h) exceden las horas disponibles (${availableForThisTask}h). Exceso: ${desiredTotal - availableForThisTask}h`
        );
      }
  
      // Además comprobamos conflictos por rango de fechas para cada fila que use este recurso
      const selectedEntriesForResource = selectedResources.filter((s) => s.resource_id === resourceId);
      for (const sel of selectedEntriesForResource) {
        if (!sel.start_date || !sel.end_date) continue;
  
        const { hasConflict, conflictingAssignments } = checkResourceConflicts(
          resourceId,
          sel.start_date,
          sel.end_date,
          task?.id, // importante: ignorar la misma tarea en la comprobación
          assignments
        );
  
        if (hasConflict) {
          const conflictingTaskNames = conflictingAssignments
            .map((a) => {
              const conflictTask = tasks.find((t) => t.id === a.task_id);
              return conflictTask ? `${conflictTask.name} (${a.start_date} - ${a.end_date})` : "";
            })
            .filter(Boolean);
  
          conflicts.push({
            resourceName: resource.name,
            conflictingTasks: conflictingTaskNames,
            dates: `${sel.start_date} - ${sel.end_date}`,
          });
        }
      }
    }
  
    setResourceConflicts(conflicts);
    setValidationWarnings(warnings);
  }, [selectedResources, task, assignments, resources, tasks]);
  
  const handleAddResource = () => {
    setSelectedResources([
      ...selectedResources,
      {
        resource_id: "",
        hours_assigned: 0,
        start_date: formData.start_date || "",
        end_date: formData.end_date || "",
      },
    ]);
  };

  const handleRemoveResource = (index: number) => {
    setSelectedResources(selectedResources.filter((_, i) => i !== index));
  };

  const handleResourceChange = (
    index: number,
    field: "resource_id" | "hours_assigned" | "start_date" | "end_date",
    value: string | number
  ) => {
    const updated = [...selectedResources];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedResources(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCriticalError(null);

    if (project.status === "closed") {
      setCriticalError("No se pueden modificar tareas en un proyecto cerrado.");
      return;
    }

    if (!formData.name.trim()) {
      setCriticalError("El título de la tarea es requerido.");
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      setCriticalError("Las fechas de inicio y fin son requeridas.");
      return;
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      setCriticalError(
        "La fecha de inicio debe ser anterior o igual a la fecha de fin."
      );
      return;
    }

    const progressValidation = validateTaskProgress(formData.progress);
    if (!progressValidation.valid) {
      setCriticalError(progressValidation.error!);
      return;
    }

    const datesValidation = validateTaskDatesInProjectRange(
      formData.start_date,
      formData.end_date,
      project.start_date,
      project.end_date
    );
    if (!datesValidation.valid) {
      setCriticalError(datesValidation.error!);
      return;
    }

    const budgetValidation = validateProjectBudget(
      project.total_budget,
      tasks.filter((t) => t.project_id === projectId),
      task?.id,
      formData.budget_allocated
    );
    if (!budgetValidation.valid) {
      setCriticalError(budgetValidation.error!);
      return;
    }

    if (
      !formData.assignee_id ||
      !teamMembers.some((m) => m.id === formData.assignee_id)
    ) {
      setCriticalError("Debe seleccionar un miembro del equipo válido.");
      return;
    }

    for (const resource of selectedResources) {
      if (
        (resource.resource_id !== "" || resource.hours_assigned > 0) &&
        (!resource.start_date || !resource.end_date)
      ) {
        setCriticalError(
          "Todas las asignaciones de recursos deben tener fechas de inicio y fin válidas."
        );
        return;
      }
      if (
        resource.start_date &&
        resource.end_date &&
        new Date(resource.start_date) > new Date(resource.end_date)
      ) {
        setCriticalError(
          "La fecha de inicio de la asignación debe ser anterior a la fecha de fin."
        );
        return;
      }
      if (
        (resource.start_date &&
          new Date(resource.start_date) < new Date(formData.start_date)) ||
        (resource.end_date &&
          new Date(resource.end_date) > new Date(formData.end_date))
      ) {
        setCriticalError(
          "Las fechas de asignación de recursos deben estar dentro de las fechas de la tarea."
        );
        return;
      }
    }

    const derivedStatus = deriveStatusFromProgress(
      formData.progress,
      isBlocked
    );
    const isCompleted = formData.progress === 100;

    const finalTaskData: NewTask = {
      ...formData,
      status: derivedStatus,
      completed: isCompleted,
    };

    const validResources: Omit<NewResourceAssignment, "task_id">[] =
      selectedResources
        .filter(
          (r) =>
            r.resource_id !== "" &&
            r.hours_assigned > 0 &&
            r.start_date &&
            r.end_date
        )
        .map((r) => ({
          resource_id: r.resource_id,
          hours_assigned: r.hours_assigned,
          start_date: r.start_date,
          end_date: r.end_date,
        }));

    if (task) {
      onSave({ ...finalTaskData, id: task.id }, validResources);
    } else {
      onSave(finalTaskData, validResources);
    }
  };

  const derivedStatus = deriveStatusFromProgress(formData.progress, isBlocked);
  const statusLabels = {
    not_started: "Sin Iniciar",
    in_progress: "En Progreso",
    blocked: "Bloqueada",
    completed: "Completada",
  };

  const isDisabled = project.status === "closed";

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
      {/* Alerta de Proyecto Cerrado */}
      {isDisabled && (
        <motion.div
          className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 md:p-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-2 md:gap-3">
            <AlertTriangleIcon className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-600 text-sm md:text-base">
                Proyecto Cerrado
              </h4>
              <p className="text-xs md:text-sm text-red-700 mt-1">
                Este proyecto está cerrado y no se pueden realizar
                modificaciones.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Título y Descripción */}
      <motion.div
        variants={{
          hidden: { opacity: 0, x: -20 },
          visible: { opacity: 1, x: 0 },
        }}
      >
        <label className="block text-sm font-medium text-foreground mb-2">
          Título *
        </label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Título de la tarea"
          required
          disabled={isDisabled}
        />
      </motion.div>

      <motion.div
        variants={{
          hidden: { opacity: 0, x: -20 },
          visible: { opacity: 1, x: 0 },
        }}
      >
        <label className="block text-sm font-medium text-foreground mb-2">
          Descripción
        </label>
        <textarea
          className="w-full min-h-20 px-3 py-2 bg-background border border-input rounded-md text-foreground disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Descripción de la tarea"
          disabled={isDisabled}
        />
      </motion.div>

      {/* Asignado a (Team Member) */}
      <motion.div
        variants={{
          hidden: { opacity: 0, x: -20 },
          visible: { opacity: 1, x: 0 },
        }}
      >
        <label className="block text-sm font-medium text-foreground mb-2">
          Asignado a
        </label>
        <select
          className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
          value={formData.assignee_id}
          onChange={(e) =>
            setFormData({ ...formData, assignee_id: e.target.value as UUID })
          }
          disabled={isDisabled}
        >
          {teamMembers.length === 0 && (
            <option value="">No hay miembros de equipo</option>
          )}
          {teamMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </motion.div>

      {/* Progreso y Estado */}
      <motion.div
        className="space-y-3"
        variants={{
          hidden: { opacity: 0, x: -20 },
          visible: { opacity: 1, x: 0 },
        }}
      >
        {/* Input Progreso */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Progreso (%) *
          </label>
          <Input
            type="number"
            min="0"
            max="100"
            value={formData.progress}
            onChange={(e) =>
              setFormData({
                ...formData,
                progress: Math.min(100, Math.max(0, Number(e.target.value))),
              })
            }
            disabled={isDisabled}
          />
        </div>
        {/* Checkbox Bloqueado */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="blocked"
            checked={isBlocked}
            onChange={(e) => setIsBlocked(e.target.checked)}
            className="w-4 h-4 rounded border-input bg-background disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isDisabled || formData.progress === 100}
          />
          <label
            htmlFor="blocked"
            className={`text-sm text-foreground cursor-pointer ${
              formData.progress === 100 ? "opacity-50" : ""
            }`}
          >
            Marcar como bloqueada
          </label>
        </div>
        {/* Label Estado Derivado */}
        <div className="text-xs md:text-sm text-muted-foreground bg-muted/50 p-3 rounded-md border border-border">
          <span className="font-medium">Estado derivado:</span>{" "}
          <span className="text-foreground">{statusLabels[derivedStatus]}</span>
        </div>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4"
        variants={{
          hidden: { opacity: 0, x: -20 },
          visible: { opacity: 1, x: 0 },
        }}
      >
        {/* Input Fecha Inicio */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Fecha de Inicio *
          </label>
          <Input
            type="date"
            min={project.start_date}
            max={project.end_date}
            value={formData.start_date}
            onChange={(e) => {
              setFormData({
                ...formData,
                start_date: e.target.value,
                end_date:
                  e.target.value > formData.end_date
                    ? e.target.value
                    : formData.end_date,
              });
            }}
            required
            disabled={isDisabled}
          />
        </div>
        {/* Input Fecha Vencimiento */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Fecha de Vencimiento *
          </label>
          <Input
            min={formData.start_date ? formData.start_date : project.start_date}
            max={project.end_date}
            type="date"
            value={formData.end_date}
            onChange={(e) =>
              setFormData({ ...formData, end_date: e.target.value })
            }
            required
            disabled={isDisabled}
          />
        </div>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4"
        variants={{
          hidden: { opacity: 0, x: -20 },
          visible: { opacity: 1, x: 0 },
        }}
      >
        {/* Input Horas Estimadas */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Horas Estimadas
          </label>
          <Input
            type="number"
            min="0"
            value={formData.estimated_hours}
            onChange={(e) =>
              setFormData({
                ...formData,
                estimated_hours: Number(e.target.value),
              })
            }
            disabled={isDisabled}
          />
        </div>
        {/* Input Presupuesto Asignado */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Presupuesto Asignado
          </label>
          <Input
            type="number"
            min="0"
            max={project.total_budget}
            value={formData.budget_allocated}
            onChange={(e) => {
              setCriticalError(null);
              setFormData({
                ...formData,
                budget_allocated: Number(e.target.value),
              });
              if (Number(e.target.value) > project.total_budget) {
                setCriticalError(
                  "El presupuesto asignado de la tarea no puede ser mayor al presupuesto disponible del proyecto"
                );
              }
            }}
            disabled={isDisabled}
          />
        </div>
      </motion.div>

      <motion.div
        variants={{
          hidden: { opacity: 0, x: -20 },
          visible: { opacity: 1, x: 0 },
        }}
        className="space-y-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <label className="block text-sm font-medium text-foreground">
            Asignar Recursos
          </label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAddResource}
            className="bg-transparent w-full sm:w-auto"
            disabled={isDisabled}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Agregar Recurso
          </Button>
        </div>

        {selectedResources.length > 0 && (
          <div className="space-y-3 border border-border rounded-lg p-2 md:p-3 bg-muted/30">
            {selectedResources.map((selected, index) => (
              <div
                key={index}
                className="space-y-2 p-2 md:p-3 bg-background rounded-md border border-border"
              >
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-start">
                  <div className="flex-1">
                    {/* Select de Recurso (UUID/string) */}
                    <select
                      className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      value={selected.resource_id}
                      onChange={(e) =>
                        handleResourceChange(
                          index,
                          "resource_id",
                          e.target.value as UUID
                        )
                      }
                      disabled={isDisabled}
                    >
                      <option value="">Seleccionar recurso...</option>
                      {resources.map((resource) => (
                        <option key={resource.id} value={resource.id}>
                          {resource.name} ({resource.type})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 sm:w-32">
                      <Input
                        type="number"
                        min="0"
                        placeholder="Horas"
                        value={selected.hours_assigned || ""}
                        onChange={(e) =>
                          handleResourceChange(
                            index,
                            "hours_assigned",
                            Number(e.target.value)
                          )
                        }
                        className="text-sm"
                        disabled={isDisabled}
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveResource(index)}
                      className="text-destructive hover:text-destructive shrink-0"
                      disabled={isDisabled}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Fecha Inicio Asignación */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Fecha Inicio
                    </label>
                    <Input
                      type="date"
                      value={selected.start_date}
                      onChange={(e) => {
                        handleResourceChange(
                          index,
                          "start_date",
                          e.target.value
                        );
                      }}
                      min={formData.start_date || project.start_date}
                      max={
                        selected.end_date ||
                        formData.end_date ||
                        project.end_date
                      }
                      className="text-sm"
                      disabled={isDisabled}
                    />
                  </div>

                  {/* Fecha Fin Asignación */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Fecha Fin
                    </label>
                    <Input
                      type="date"
                      value={selected.end_date}
                      onChange={(e) => {
                        handleResourceChange(index, "end_date", e.target.value);
                      }}
                      min={
                        selected.start_date ||
                        formData.start_date ||
                        project.start_date
                      }
                      max={formData.end_date || project.end_date}
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
            No hay recursos asignados. Haz clic en "Agregar Recurso" para
            asignar recursos a esta tarea.
          </p>
        )}
      </motion.div>
      {/* Alerta de Advertencias de Horas (Límite Excedido) */}
      {validationWarnings.length > 0 && (
        <motion.div
          className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 md:p-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h4 className="font-semibold text-orange-600 mb-2 text-sm md:text-base">
            Advertencia de Horas (Límite Excedido)
          </h4>
          <ul className="list-disc list-inside text-xs md:text-sm text-orange-700 space-y-1">
            {validationWarnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Alerta de Errores Críticos de Validación (Sustituye a alerts) */}
      {criticalError && (
        <motion.div
          className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 md:p-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-2 md:gap-3">
            <AlertTriangleIcon className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-600 text-sm md:text-base">
                Error de Validación
              </h4>
              <p className="text-xs md:text-sm text-red-700 mt-1">
                {criticalError}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Alerta de Conflictos de Recursos */}
      {resourceConflicts.length > 0 && (
        <motion.div
          className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 md:p-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h4 className="font-semibold text-yellow-600 mb-2 text-sm md:text-base">
            Conflictos de Recursos Detectados
          </h4>
          <ul className="list-disc list-inside text-xs md:text-sm text-yellow-700 space-y-1">
            {resourceConflicts.map((conflict, i) => (
              <li key={i}>
                <strong>{conflict.resourceName}</strong> asignado de{" "}
                {conflict.dates}. Conflictos:{" "}
                {conflict.conflictingTasks.join(", ")}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      <motion.div
        className="flex flex-col sm:flex-row gap-3 pt-4"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
      >
        <Button
          type="submit"
          className="flex-1"
          disabled={isDisabled || criticalError !== null}
        >
          {task ? "Actualizar Tarea" : "Crear Tarea"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 bg-transparent"
        >
          Cancelar
        </Button>
      </motion.div>
    </motion.form>
  );
}

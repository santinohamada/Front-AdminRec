"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "./ui/button"; // Assuming Button is available
import { Input } from "./ui/input"; // Assuming Input is available
import { motion } from "framer-motion";
import { AlertTriangleIcon, PlusIcon, XIcon } from "lucide-react";

// Importar los tipos normalizados
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
} from "../lib/project-types"; // Assuming relative path is correct

// Asumiendo que esta función existe en las utilidades.
// Si no la tienes, necesitarás añadirla a project-utils.ts
const deriveStatusFromProgress = (
  progress: number,
  isBlocked: boolean
): TaskStatus => {
  if (isBlocked) return "blocked";
  if (progress === 100) return "completed";
  if (progress > 0) return "in_progress";
  return "not_started";
};

// Importar las utilidades actualizadas
import {
  checkResourceConflicts,
  validateTaskProgress,
  validateTaskDatesInProjectRange,
  validateProjectBudget,
  validateResourceHours,
} from "../lib/project-utils"; // Asegúrate de que este path sea correcto

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

// Este tipo interno ahora coincide con lo que el formulario necesita
// para crear un NewResourceAssignment
interface ResourceAssignmentForm {
  resource_id: UUID;
  hours_assigned: number;
  start_date: string;
  end_date: string;
}

// Un tipo interno para el estado del formulario, basado en NewTask
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
    task?.assignee_id || (teamMembers.length > 0 ? teamMembers[0].id : ""); // Usar "" como default

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

  // Inicializar asignaciones de recursos
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

  // Sincronizar fechas de asignación con las fechas de la tarea
  useEffect(() => {
    setSelectedResources((prev) =>
      prev.map((res) => {
        let newStart = res.start_date;
        let newEnd = res.end_date;

        // Ajustar fecha inicio si es antes del inicio de la tarea
        if (newStart && formData.start_date && newStart < formData.start_date) {
          newStart = formData.start_date;
        }

        // Ajustar fecha fin si es después del fin de la tarea
        if (newEnd && formData.end_date && newEnd > formData.end_date) {
          newEnd = formData.end_date;
        }

        // Si start > end después de ajustes, resetear end
        if (newStart && newEnd && newStart > newEnd) {
          newEnd = newStart; // Resetear al inicio de la asignación
        }

        return { ...res, start_date: newStart, end_date: newEnd };
      })
    );
  }, [formData.start_date, formData.end_date]);

  // Validaciones y conflictos en tiempo real
  useEffect(() => {
    // Reiniciar errores críticos al cambiar recursos/datos
    setCriticalError(null);

    const conflicts: {
      resourceName: string;
      conflictingTasks: string[];
      dates: string;
    }[] = [];
    const warnings: string[] = [];

    for (const selected of selectedResources) {
      if (
        !selected.start_date ||
        !selected.end_date ||
        selected.resource_id === ""
      )
        continue;

      const resource = resources.find((r) => r.id === selected.resource_id);
      if (!resource) continue;

      // 1. Conflicto de Fechas
      const { hasConflict, conflictingAssignments } = checkResourceConflicts(
        selected.resource_id,
        selected.start_date,
        selected.end_date,
        task?.id,
        assignments
      );

      if (hasConflict) {
        const conflictingTaskNames = conflictingAssignments
          .map((a) => {
            const conflictTask = tasks.find((t) => t.id === a.task_id);
            return conflictTask
              ? `${conflictTask.name} (${a.start_date} - ${a.end_date})`
              : "";
          })
          .filter(Boolean);

        conflicts.push({
          resourceName: resource.name,
          conflictingTasks: conflictingTaskNames,
          dates: `${selected.start_date} - ${selected.end_date}`,
        });
      }

      // 2. Conflicto de Horas Disponibles
      const hoursValidation = validateResourceHours(
        selected.resource_id,
        resource,
        assignments,
        selected.hours_assigned,
        undefined // Asumimos que esta validación es para nuevas asignaciones
      );

      if (!hoursValidation.valid) {
        warnings.push(`${resource.name}: ${hoursValidation.error}`);
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
    // Eliminado 'hours_actual' por no existir en el nuevo esquema
    field:
      | "resource_id"
      | "hours_assigned"
      | "start_date"
      | "end_date",
    value: string | number
  ) => {
    const updated = [...selectedResources];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedResources(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCriticalError(null); // Limpiar errores antes de la validación

    // --- VALIDACIONES DE ENVÍO ---

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

    // 1. Validar asignaciones de recursos (fechas y campos requeridos)
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

    // --- LÓGICA DE GUARDADO ACTUALIZADA (NORMALIZADA) ---

    // 2. Calcular estado y completado
    const derivedStatus = deriveStatusFromProgress(
      formData.progress,
      isBlocked
    );
    const isCompleted = formData.progress === 100;

    // 3. Crear el objeto de datos final (tipo NewTask)
    const finalTaskData: NewTask = {
      ...formData,
      status: derivedStatus,
      completed: isCompleted,
    };

    // 4. Crear las asignaciones válidas (tipo Omit<NewResourceAssignment, "task_id">)
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
      // Enviar la Tarea completa (con ID) y las asignaciones
      onSave({ ...finalTaskData, id: task.id }, validResources);
    } else {
      // Enviar la Nueva Tarea (sin ID) y las asignaciones
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
          className="bg-red-500/10 border border-red-500/20 rounded-lg p-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangleIcon className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-600">Proyecto Cerrado</h4>
              <p className="text-sm text-red-700 mt-1">
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
          className="w-full min-h-20 px-3 py-2 bg-background border border-input rounded-md text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
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
          className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
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
            disabled={isDisabled || formData.progress === 100} // No se puede bloquear si está completa
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
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md border border-border">
          <span className="font-medium">Estado derivado:</span>{" "}
          <span className="text-foreground">{statusLabels[derivedStatus]}</span>
        </div>
      </motion.div>

      {/* Fechas de la Tarea */}
      <motion.div
        className="grid grid-cols-2 gap-4"
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
                    ? e.target.value // Si inicio > fin, forzar fin = inicio
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

      {/* Horas y Presupuesto */}
      <motion.div
        className="grid grid-cols-2 gap-4"
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
            onChange={(e) =>{
              setCriticalError(null)
              setFormData({
                ...formData,
                budget_allocated: Number(e.target.value) 
                 
              })
            if(Number(e.target.value) > project.total_budget){
              setCriticalError("El presupuesto asignado de la tarea no puede ser mayor al presupuesto disponible del proyecto")
            }
            }
            }
            disabled={isDisabled}
          />
        </div>
      </motion.div>

      {/* Asignar Recursos */}
      <motion.div
        variants={{
          hidden: { opacity: 0, x: -20 },
          visible: { opacity: 1, x: 0 },
        }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-foreground">
            Asignar Recursos
          </label>
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
              <div
                key={index}
                className="space-y-2 p-3 bg-background rounded-md border border-border"
              >
                <div className="flex gap-2 items-start">
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
                  <div className="w-32">
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
                    className="text-destructive hover:text-destructive"
                    disabled={isDisabled}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
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
                      min={formData.start_date || project.start_date} // nunca antes que inicio de tarea
                      max={
                        selected.end_date ||
                        formData.end_date ||
                        project.end_date
                      } // no puede superar fin asignación/tarea/proyecto
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
                      } // nunca antes que inicio asignación/tarea/proyecto
                      max={formData.end_date || project.end_date} // nunca después que fin tarea/proyecto
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
          className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h4 className="font-semibold text-orange-600 mb-2">
            Advertencia de Horas (Límite Excedido)
          </h4>
          <ul className="list-disc list-inside text-sm text-orange-700 space-y-1">
            {validationWarnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </motion.div>
      )}
    
      {/* Alerta de Errores Críticos de Validación (Sustituye a alerts) */}
      {criticalError && (
        <motion.div
          className="bg-red-500/10 border border-red-500/20 rounded-lg p-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangleIcon className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-600">Error de Validación</h4>
              <p className="text-sm text-red-700 mt-1">{criticalError}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Alerta de Conflictos de Recursos */}
      {resourceConflicts.length > 0 && (
        <motion.div
          className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h4 className="font-semibold text-yellow-600 mb-2">
            Conflictos de Recursos Detectados
          </h4>
          <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
            {resourceConflicts.map((conflict, i) => (
              <li key={i}>
                <strong>{conflict.resourceName}</strong> asignado de {conflict.dates}. Conflictos: {conflict.conflictingTasks.join(", ")}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

   
      {/* Botones de Guardar/Cancelar */}
      <motion.div
        className="flex gap-3 pt-4"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
      >
        <Button type="submit" className="flex-1" disabled={isDisabled || criticalError !==null}>
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

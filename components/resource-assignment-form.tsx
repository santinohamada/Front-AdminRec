"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Task, Resource, ResourceAssignment } from "@/lib/project-types"

interface ResourceAssignmentFormProps {
  tasks: Task[]
  resources: Resource[]
  assignments: ResourceAssignment[]
  onAssign: (assignment: Omit<ResourceAssignment, "id">) => void
  onCancel: () => void
}

export function ResourceAssignmentForm({
  tasks,
  resources,
  onAssign,
  onCancel,
}: ResourceAssignmentFormProps) {
  const [taskId, setTaskId] = useState<string>(tasks[0]?.id || "1")
  const [resourceId, setResourceId] = useState<string>(resources[0]?.id || "1")
  const [hours, setHours] = useState<number>(0)

  // --- NUEVO: Estado para las fechas ---
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")

  // --- NUEVO: Efecto para actualizar las fechas por defecto ---
  // Cuando la tarea seleccionada cambia, actualiza
  // las fechas de inicio y fin del formulario.
  useEffect(() => {
    const selectedTask = tasks.find((t) => t.id === taskId)
    if (selectedTask) {
      setStartDate(selectedTask.start_date)
      setEndDate(selectedTask.end_date)
    }
  }, [taskId, tasks]) // Depende de taskId y tasks

  const selectedResource = resources.find((r) => r.id === resourceId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (hours <= 0) {
      alert("Las horas deben ser mayores a 0")
      return
    }
    
    if (selectedResource && hours > selectedResource?.available_hours) {
      alert(`El recurso solo tiene ${selectedResource?.available_hours} horas disponibles`)
      return
    }

    // --- NUEVO: Validación de fechas ---
    if (!startDate || !endDate) {
      alert("Las fechas de inicio y fin son requeridas")
      return
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert("La fecha de inicio debe ser anterior a la fecha de fin")
      return
    }
    
    // Validar que las fechas de asignación estén dentro de la tarea (opcional pero recomendado)
    const selectedTask = tasks.find((t) => t.id === taskId)
    if (selectedTask) {
         if (new Date(startDate) < new Date(selectedTask.start_date) || new Date(endDate) > new Date(selectedTask.end_date)) {
             if (!confirm("Las fechas de asignación están fuera del rango de la tarea. ¿Continuar de todos modos?")) {
                 return
             }
         }
    }

    // --- CORREGIDO: Enviar el objeto completo ---
    onAssign({
      task_id: taskId,
      resource_id: resourceId,
      hours_assigned: hours,
      start_date: startDate, // <-- Requerido
      end_date: endDate, // <-- Requerido
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Tarea</label>
        <select
          className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground"
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
        >
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {/* CORREGIDO: Era task.title, debe ser task.name */}
              {task.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Recurso</label>
        <select
          className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground"
          value={resourceId}
          onChange={(e) => setResourceId(e.target.value)}
        >
          {resources.map((resource) => (
            <option key={resource.id} value={resource.id}>
              {resource.name} ({resource.type})
            </option>
          ))}
        </select>
      </div>

      {/* --- NUEVO: Inputs de Fecha --- */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Fecha de Inicio</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Fecha de Fin</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Horas a Asignar (Disponibles: {selectedResource?.available_hours}h)
        </label>
        <Input
          type="number"
          min="0"
          max={selectedResource?.available_hours}
          value={hours}
          onChange={(e) => setHours(Number(e.target.value))}
          required
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1">
          Asignar Recurso
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
          Cancelar
        </Button>
      </div>
    </form>
  )
}

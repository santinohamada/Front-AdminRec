import type { Project, Task, Resource, ResourceAssignment } from "./project-types"

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount)
}

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString("es-ES", { month: "short", day: "numeric", year: "numeric" })
}

export const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`
}

export const calculateProjectProgress = (tasks: Task[]): number => {
  if (tasks.length === 0) return 0

  const totalHours = tasks.reduce((sum, task) => sum + task.estimated_hours, 0)
  if (totalHours === 0) return 0

  const weightedProgress = tasks.reduce((sum, task) => {
    return sum + task.progress * task.estimated_hours
  }, 0)

  return weightedProgress / totalHours
}

export const calculateActualCost = (
  tasks: Task[],
  assignments: ResourceAssignment[],
  resources: Resource[],
): number => {
  const taskIds = tasks.map((t) => t.id)
  const relevantAssignments = assignments.filter((a) => taskIds.includes(a.task_id))

  return relevantAssignments.reduce((total, assignment) => {
    const resource = resources.find((r) => r.id === assignment.resource_id)
    if (!resource) return total
    return total + assignment.hours_actual * resource.hourly_rate
  }, 0)
}

export const calculateRemainingBudget = (project: Project, tasks: Task[]): number => {
  const projectTasks = tasks.filter((t) => t.project_id === project.id)
  const allocated = projectTasks.reduce((sum, task) => sum + task.budget_allocated, 0)
  return project.total_budget - allocated
}

export const calculateResourceHoursLeft = (
  resourceId: number,
  resource: Resource,
  assignments: ResourceAssignment[],
): number => {
  const assigned = assignments.filter((a) => a.resource_id === resourceId).reduce((sum, a) => sum + a.hours_assigned, 0)
  return resource.availability_hours - assigned
}

export const deriveStatusFromProgress = (progress: number, isBlocked = false): Task["status"] => {
  if (isBlocked) return "blocked"
  if (progress === 0) return "not_started"
  if (progress === 100) return "completed"
  return "in_progress"
}

export const getStatusInfo = (status: Task["status"]) => {
  const statusMap = {
    not_started: { label: "Sin Iniciar", color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
    in_progress: { label: "En Progreso", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    blocked: { label: "Bloqueada", color: "bg-red-500/10 text-red-500 border-red-500/20" },
    completed: { label: "Completada", color: "bg-green-500/10 text-green-500 border-green-500/20" },
  }
  return statusMap[status]
}

export const checkResourceConflicts = (
  resourceId: number,
  assignmentStartDate: string,
  assignmentEndDate: string,
  currentTaskId: number | undefined,
  assignments: ResourceAssignment[],
): { hasConflict: boolean; conflictingAssignments: ResourceAssignment[] } => {
  const start = new Date(assignmentStartDate)
  const end = new Date(assignmentEndDate)

  const conflictingAssignments: ResourceAssignment[] = []

  // Find all assignments for this resource
  const resourceAssignments = assignments.filter((a) => a.resource_id === resourceId)

  // Check each assignment for date overlap
  for (const assignment of resourceAssignments) {
    // Skip assignments from the current task if editing
    if (currentTaskId && assignment.task_id === currentTaskId) continue

    const assignmentStart = new Date(assignment.start_date)
    const assignmentEnd = new Date(assignment.end_date)

    // Check if dates overlap
    const hasOverlap = start <= assignmentEnd && end >= assignmentStart

    if (hasOverlap) {
      conflictingAssignments.push(assignment)
    }
  }

  return {
    hasConflict: conflictingAssignments.length > 0,
    conflictingAssignments,
  }
}

export const validateTaskProgress = (progress: number): { valid: boolean; error?: string } => {
  // RN-01: Progress must be between 0 and 100
  if (progress < 0 || progress > 100) {
    return { valid: false, error: "El porcentaje de avance debe estar entre 0 y 100" }
  }
  return { valid: true }
}

export const validateTaskDatesInProjectRange = (
  taskStartDate: string,
  taskEndDate: string,
  projectStartDate: string,
  projectEndDate: string,
): { valid: boolean; error?: string } => {
  // RN-05: Task dates must be within project date range
  const taskStart = new Date(taskStartDate)
  const taskEnd = new Date(taskEndDate)
  const projectStart = new Date(projectStartDate)
  const projectEnd = new Date(projectEndDate)

  if (taskStart < projectStart || taskEnd > projectEnd) {
    return {
      valid: false,
      error: `Las fechas de la tarea deben estar dentro del rango del proyecto (${formatDate(projectStartDate)} - ${formatDate(projectEndDate)})`,
    }
  }
  return { valid: true }
}

export const validateProjectBudget = (
  projectBudget: number,
  tasks: Task[],
  currentTaskId?: number,
  currentTaskBudget?: number,
): { valid: boolean; error?: string; remaining: number } => {
  // RN-03: Project total budget >= sum of task budgets
  const otherTasksBudget = tasks
    .filter((t) => t.id !== currentTaskId)
    .reduce((sum, task) => sum + task.budget_allocated, 0)

  const totalAllocated = otherTasksBudget + (currentTaskBudget || 0)
  const remaining = projectBudget - totalAllocated

  if (totalAllocated > projectBudget) {
    return {
      valid: false,
      error: `El presupuesto asignado (${formatCurrency(totalAllocated)}) excede el presupuesto total del proyecto (${formatCurrency(projectBudget)})`,
      remaining,
    }
  }

  return { valid: true, remaining }
}

export const validateResourceHours = (
  resourceId: number,
  resource: Resource,
  assignments: ResourceAssignment[],
  newHours: number,
  currentAssignmentId?: number,
): { valid: boolean; error?: string; remaining: number } => {
  // RN-06: Resources cannot exceed their total hours
  const otherAssignmentsHours = assignments
    .filter((a) => a.resource_id === resourceId && a.id !== currentAssignmentId)
    .reduce((sum, a) => sum + a.hours_assigned, 0)

  const totalAssigned = otherAssignmentsHours + newHours
  const remaining = resource.availability_hours - totalAssigned

  if (totalAssigned > resource.availability_hours) {
    return {
      valid: false,
      error: `Las horas asignadas (${totalAssigned}h) exceden las horas disponibles del recurso (${resource.availability_hours}h)`,
      remaining,
    }
  }

  return { valid: true, remaining }
}

import type {
  Project,
  Task,
  Resource,
  ResourceAssignment,
  TaskStatus,
  ProjectStatus,
  UUID,
} from "./project-types";

// Los tipos TeamMember, Manager, NewProject, NewTask, NewResource, NewResourceAssignment
// de 'project-types' no se usan directamente en estas utilidades, por lo que no se importan aquí.

/**
 * Formatea un número como moneda USD con formato español.
 * @param amount Cantidad a formatear.
 * @returns Cadena de texto con formato de moneda.
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
};

// ---
/**
 * Formatea una cadena de fecha ISO a un formato local abreviado (Ej: oct. 25, 2025).
 * @param dateString Cadena de fecha ISO (Ej: '2025-10-25').
 * @returns Cadena de texto con formato de fecha.
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  // Usa "numeric" para el día y año para consistencia
  return date.toLocaleDateString("es-ES", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// ---
/**
 * Formatea un valor numérico a un porcentaje redondeado.
 * @param value Valor decimal o entero a formatear (Ej: 0.85 o 85).
 * @returns Cadena de texto con el símbolo de porcentaje (Ej: "85%").
 */
export const formatPercentage = (value: number): string => {
  // Asumiendo que el valor puede ser 0-1 (decimal) o 0-100 (entero).
  const percentage = value <= 1 ? value * 100 : value;
  return `${Math.round(percentage)}%`;
};

// ---
/**
 * Calcula el progreso general del proyecto basándose en el progreso ponderado por horas de las tareas.
 * @param tasks Lista de tareas del proyecto.
 * @returns Progreso ponderado como un número decimal (0 a 1).
 */
export const calculateProjectProgress = (tasks: Task[]): number => {
  if (tasks.length === 0) return 0;

  // Usa reduce para calcular totalHours en una sola pasada para evitar doble iteración
  const { totalHours, weightedProgress } = tasks.reduce(
    (acc, task) => {
      acc.totalHours += task.estimated_hours;
      // La propiedad 'progress' en Task es un porcentaje (0-100), se divide por 100
      acc.weightedProgress += (task.progress / 100) * task.estimated_hours;
      return acc;
    },
    { totalHours: 0, weightedProgress: 0 }
  );

  if (totalHours === 0) return 0;

  // Retorna el progreso como un valor decimal (0 a 1)
  return weightedProgress / totalHours;
};

// ---
/**
 * Calcula el costo real (acumulado) basándose en las asignaciones y la tarifa horaria de los recursos.
 * NOTA: El código original asume que el costo actual es la suma de las tarifas horarias de las asignaciones,
 * ignorando la cantidad de horas asignadas.
 * Se actualiza para calcular COSTO = (tarifa horaria) * (horas asignadas).
 * @param tasks Tareas relevantes.
 * @param assignments Asignaciones de recursos.
 * @param resources Recursos disponibles.
 * @returns Costo actual total.
 */
export const calculateActualCost = (
  tasks: Task[],
  assignments: ResourceAssignment[],
  resources: Resource[]
): number => {
  const taskIds = new Set(tasks.map((t) => t.id));
  const resourceMap = new Map(resources.map((r) => [r.id, r]));

  // Filtra solo las asignaciones de las tareas proporcionadas
  const relevantAssignments = assignments.filter((a) => taskIds.has(a.task_id));

  return relevantAssignments.reduce((total, assignment) => {
    const resource = resourceMap.get(assignment.resource_id);
    if (!resource) return total;

    // Costo real = Tarifa horaria * Horas Asignadas
    return total + resource.hourly_rate * assignment.hours_assigned;
  }, 0);
};

// ---
/**
 * Calcula el presupuesto restante del proyecto (Presupuesto Total - Suma del Presupuesto Asignado a Tareas).
 * @param project Objeto Project.
 * @param tasks Lista de todas las tareas (para calcular la suma asignada).
 * @returns Presupuesto restante.
 */
export const calculateRemainingBudget = (
  project: Project,
  tasks: Task[]
): number => {
  // Filtra solo las tareas que pertenecen al proyecto
  const projectTasks = tasks.filter((t) => t.project_id === project.id);
  const allocated = projectTasks.reduce(
    (sum, task) => sum + task.budget_allocated,
    0
  );
  return project.total_budget - allocated;
};

// ---
/**
 * Proporciona información de visualización para el estado de una tarea.
 * @param status Estado de la tarea (TaskStatus).
 * @returns Objeto con 'label' (Etiqueta en español) y 'color' (Clases TailwindCSS).
 */
export const getTaskStatusInfo = (status: TaskStatus) => {
  const statusMap: {
    [key in TaskStatus]: { label: string; color: string };
  } = {
    not_started: {
      label: "Sin Iniciar",
      color: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    },
    in_progress: {
      label: "En Progreso",
      color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    },
    blocked: {
      label: "Bloqueada",
      color: "bg-red-500/10 text-red-500 border-red-500/20",
    },
    completed: {
      label: "Completada",
      color: "bg-green-500/10 text-green-500 border-green-500/20",
    },
  };
  return statusMap[status];
};

// ---
/**
 * Proporciona información de visualización para el estado de un proyecto.
 * @param status Estado del proyecto (ProjectStatus).
 * @returns Objeto con 'label' (Etiqueta en español) y 'color' (Clases TailwindCSS).
 */
export const getProjectStatusInfo = (status: ProjectStatus) => {
  const statusMap: {
    [key in ProjectStatus]: { label: string; color: string };
  } = {
    active: {
      label: "Activo",
      color: "bg-green-500/10 text-green-500 border-green-500/20",
    },
    paused: {
      label: "Pausado",
      color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    },
    closed: {
      label: "Cerrado",
      color: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    },
  };
  return statusMap[status];
};

// ---
/**
 * Verifica si existe un conflicto de fechas para un recurso en un nuevo rango de asignación.
 * @param resourceId ID del recurso a verificar.
 * @param assignmentStartDate Fecha de inicio de la nueva asignación.
 * @param assignmentEndDate Fecha de fin de la nueva asignación.
 * @param currentTaskId ID de la tarea actual (para ignorar sus asignaciones al editar).
 * @param assignments Lista completa de ResourceAssignment.
 * @returns Objeto con 'hasConflict' y la lista de asignaciones conflictivas.
 */
export const checkResourceConflicts = (
  resourceId: UUID,
  assignmentStartDate: string,
  assignmentEndDate: string,
  currentTaskId: UUID | undefined,
  assignments: ResourceAssignment[]
): { hasConflict: boolean; conflictingAssignments: ResourceAssignment[] } => {
  const start = new Date(assignmentStartDate);
  const end = new Date(assignmentEndDate);

  const conflictingAssignments: ResourceAssignment[] = [];

  // 1. Encontrar todas las asignaciones para este recurso
  const resourceAssignments = assignments.filter(
    (a) => a.resource_id === resourceId
  );

  // 2. Revisar cada asignación para ver si hay solapamiento
  for (const assignment of resourceAssignments) {
    // Si estamos editando una tarea, ignoramos sus asignaciones existentes.
    // El código original usaba currentTaskId para filtrar, lo mantengo,
    // pero si se estuviera editando la asignación en sí, se necesitaría currentAssignmentId.
    if (currentTaskId && assignment.task_id === currentTaskId) continue;

    const assignmentStart = new Date(assignment.start_date);
    const assignmentEnd = new Date(assignment.end_date);

    // Lógica de solapamiento: [A_start, A_end] se solapa con [B_start, B_end] si A_start <= B_end Y A_end >= B_start
    const hasOverlap = start <= assignmentEnd && end >= assignmentStart;

    if (hasOverlap) {
      conflictingAssignments.push(assignment);
    }
  }

  return {
    hasConflict: conflictingAssignments.length > 0,
    conflictingAssignments,
  };
};

// ---
/**
 * Valida que el porcentaje de avance de una tarea esté entre 0 y 100.
 * @param progress Porcentaje de avance (0-100).
 * @returns Objeto de validación.
 */
export const validateTaskProgress = (
  progress: number
): { valid: boolean; error?: string } => {
  // RN-01: Progress must be between 0 and 100
  if (progress < 0 || progress > 100) {
    return {
      valid: false,
      error: "El porcentaje de avance debe estar entre 0 y 100",
    };
  }
  return { valid: true };
};

// ---
/**
 * Valida que las fechas de la tarea estén dentro del rango de fechas del proyecto.
 * @param taskStartDate Fecha de inicio de la tarea.
 * @param taskEndDate Fecha de fin de la tarea.
 * @param projectStartDate Fecha de inicio del proyecto.
 * @param projectEndDate Fecha de fin del proyecto.
 * @returns Objeto de validación.
 */
export const validateTaskDatesInProjectRange = (
  taskStartDate: string,
  taskEndDate: string,
  projectStartDate: string,
  projectEndDate: string
): { valid: boolean; error?: string } => {
  // RN-05: Task dates must be within project date range
  const taskStart = new Date(taskStartDate);
  const taskEnd = new Date(taskEndDate);
  const projectStart = new Date(projectStartDate);
  const projectEnd = new Date(projectEndDate);

  if (taskStart < projectStart || taskEnd > projectEnd) {
    return {
      valid: false,
      error: `Las fechas de la tarea deben estar dentro del rango del proyecto (${formatDate(
        projectStartDate
      )} - ${formatDate(projectEndDate)})`,
    };
  }
  return { valid: true };
};

// ---
/**
 * Valida que la suma de los presupuestos asignados a las tareas no exceda el presupuesto total del proyecto.
 * @param projectBudget Presupuesto total del proyecto.
 * @param tasks Lista de tareas del proyecto.
 * @param currentTaskId ID de la tarea que se está modificando (opcional).
 * @param currentTaskBudget Nuevo presupuesto de la tarea actual (opcional).
 * @returns Objeto de validación con el presupuesto restante.
 */
export const validateProjectBudget = (
  projectBudget: number,
  tasks: Task[],
  currentTaskId?: UUID,
  currentTaskBudget?: number
): { valid: boolean; error?: string; remaining: number } => {
  // RN-03: Project total budget >= sum of task budgets

  // 1. Sumar el presupuesto de todas las tareas *excepto* la que se está editando
  const otherTasksBudget = tasks
    .filter((t) => t.id !== currentTaskId)
    .reduce((sum, task) => sum + task.budget_allocated, 0);

  // 2. Sumar el presupuesto de las demás tareas y el (posible) nuevo presupuesto de la tarea actual
  const totalAllocated = otherTasksBudget + (currentTaskBudget || 0);
  const remaining = projectBudget - totalAllocated;

  if (totalAllocated > projectBudget) {
    return {
      valid: false,
      error: `El presupuesto asignado (${formatCurrency(
        totalAllocated
      )}) excede el presupuesto total del proyecto (${formatCurrency(
        projectBudget
      )}). Exceso: ${formatCurrency(Math.abs(remaining))}`,
      remaining,
    };
  }

  return { valid: true, remaining };
};

// ---
/**
 * Valida que las horas asignadas a un recurso no excedan sus horas disponibles.
 * NOTA: El tipo 'Resource' ahora tiene 'available_hours' y 'assigned_hours'. Se usará 'available_hours' como límite.
 * @param resourceId ID del recurso.
 * @param resource Objeto Resource (con available_hours).
 * @param assignments Lista de asignaciones del recurso.
 * @param newHours Horas que se quieren asignar en la nueva o actual asignación.
 * @param currentAssignmentId ID de la asignación que se está modificando (opcional).
 * @returns Objeto de validación con las horas restantes.
 */
export const validateResourceHours = (
  resourceId: UUID,
  resource: Resource,
  assignments: ResourceAssignment[],
  newHours: number,
  currentAssignmentId?: UUID
): { valid: boolean; error?: string; remaining: number } => {
  // RN-06: Resources cannot exceed their available hours
  const otherAssignmentsHours = assignments
    .filter((a) => a.resource_id === resourceId && a.id !== currentAssignmentId)
    .reduce((sum, a) => sum + a.hours_assigned, 0);

  const totalAssigned = otherAssignmentsHours + newHours;
  const remaining = resource.available_hours - totalAssigned;

  if (totalAssigned > resource.available_hours) {
    return {
      valid: false,
      error: `Las horas asignadas (${totalAssigned}h) exceden las horas disponibles del recurso (${resource.available_hours}h). Exceso: ${Math.abs(
        remaining
      )}h`,
      remaining,
    };
  }

  return { valid: true, remaining };
};
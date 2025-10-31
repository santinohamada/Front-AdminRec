import type {
  Task,
  ResourceAssignment,
  Project,
  Resource,
  TeamMember,
  UUID,
} from "../lib/project-types"; // Asumiendo que project-types está en la misma carpeta o accesible

// Se usa 'let' para permitir la modificación de estos arrays por las funciones mock de la API (simulando CRUD)

// --- DATOS INICIALES ---

export let INITIAL_TEAM: TeamMember[] = [
  {
    id: "team-1" as UUID,
    name: "Ana García",
    dni: "12345678A",
    phone: "600-111-222",
    email: "ana.garcia@example.com",
    domicilio: "Calle Mayor 10, Madrid",
  },
  {
    id: "team-2" as UUID,
    name: "Luis Mendoza",
    dni: "87654321B",
    phone: "600-333-444",
    email: "luis.mendoza@example.com",
    domicilio: "Avenida Diagonal 55, Barcelona",
  },
  {
    id: "team-3" as UUID,
    name: "Carla Sosa",
    dni: "99988877C",
    phone: "600-555-666",
    email: "carla.sosa@example.com",
    domicilio: "Ronda Sant Pere 22, Barcelona",
  },
  {
    id: "team-4" as UUID,
    name: "David Kim",
    dni: "11122233D",
    phone: "600-777-888",
    email: "david.kim@example.com",
    domicilio: "Plaza de España 3, Madrid",
  },
];

export let INITIAL_PROJECTS: Project[] = [
  {
    id: "proj-1" as UUID,
    name: "Lanzamiento App Móvil",
    description:
      "Desarrollo y lanzamiento de la nueva app móvil de e-commerce.",
    start_date: "2025-11-01",
    end_date: "2026-03-31",
    total_budget: 150000,
    manager_id: "team-1" as UUID, // ID de Ana García
    status: "active",
  },
  {
    id: "proj-2" as UUID,
    name: "Migración a la Nube",
    description: "Migrar toda la infraestructura on-premise a AWS.",
    start_date: "2026-01-15",
    end_date: "2026-06-30",
    total_budget: 250000,
    manager_id: "team-3" as UUID, // ID de Carla Sosa
    status: "active",
  },
];

export let INITIAL_TASKS: Task[] = [
  // Proyecto 1
  {
    id: "task-1" as UUID,
    project_id: "proj-1" as UUID,
    name: "Diseño de UI/UX",
    description: "Crear wireframes y prototipos en Figma.",
    start_date: "2025-11-05",
    end_date: "2025-11-25",
    priority: "high",
    status: "in_progress",
    completed: false,
    assignee_id: "team-4" as UUID,
    progress: 30, // 30%
    budget_allocated: 20000,
    estimated_hours: 80,
  },
  {
    id: "task-2" as UUID,
    project_id: "proj-1" as UUID,
    name: "Desarrollo Frontend",
    description: "Implementar vistas en React Native.",
    start_date: "2025-11-26",
    end_date: "2026-01-15",
    priority: "high",
    status: "not_started",
    completed: false,
    assignee_id: "team-2" as UUID,
    progress: 0,
    budget_allocated: 50000,
    estimated_hours: 240,
  },
  // Proyecto 2
  {
    id: "task-3" as UUID,
    project_id: "proj-2" as UUID,
    name: "Auditoría de Infraestructura",
    description: "Analizar la infraestructura actual.",
    start_date: "2026-01-20",
    end_date: "2026-02-10",
    priority: "medium",
    status: "not_started",
    completed: false,
    assignee_id: "team-3" as UUID,
    progress: 0,
    budget_allocated: 15000,
    estimated_hours: 40,
  },
];

export let INITIAL_RESOURCES: Resource[] = [
  {
    id: "res-1" as UUID,
    name: "Frontend Dev (Senior)",
    type: "human",
    hourly_rate: 75,
    assigned_hours: 30, // Horas asignadas a 'task-2'
    available_hours: 170, 
    total_hours: 200, // Capacidad total
  },
  {
    id: "res-2" as UUID,
    name: "Backend Dev (Senior)",
    type: "human",
    hourly_rate: 80,
    assigned_hours: 40, // Horas asignadas a 'task-3'
    available_hours: 160,
    total_hours: 200,
  },
  {
    id: "res-3" as UUID,
    name: "Servidor de Pruebas",
    type: "infrastructure",
    hourly_rate: 15,
    assigned_hours: 0,
    available_hours: 168, // Disponible 24/7 en una semana
    total_hours: 168,
  },
];

export let INITIAL_ASSIGNMENTS: ResourceAssignment[] = [
  {
    id: "as-1" as UUID,
    task_id: "task-2" as UUID,
    resource_id: "res-1" as UUID,
    hours_assigned: 30,
    start_date: "2025-11-26",
    end_date: "2026-01-15",
  },
  {
    id: "as-2" as UUID,
    task_id: "task-3" as UUID,
    resource_id: "res-2" as UUID,
    hours_assigned: 40,
    start_date: "2026-01-20",
    end_date: "2026-02-10",
  },
];

/**
 * API simulada (Mock API) con operaciones CRUD para interactuar con los datos en memoria.
 * Nota: Los métodos 'add' asumen que el objeto ya viene con un 'id' único.
 */
export const mockApi = {
  // --- READ OPERATIONS ---
  getProjects: async (): Promise<Project[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(INITIAL_PROJECTS);
      }, 500); // Retraso de 500ms para simular latencia de red
    });
  },
  getTasks: async (): Promise<Task[]> =>
    new Promise((resolve) => setTimeout(() => resolve(INITIAL_TASKS), 500)),
  getResources: async (): Promise<Resource[]> =>
    new Promise((resolve) => setTimeout(() => resolve(INITIAL_RESOURCES), 500)),
  getTeam: async (): Promise<TeamMember[]> =>
    new Promise((resolve) => setTimeout(() => resolve(INITIAL_TEAM), 500)),
  getResourceAssignments: async (): Promise<ResourceAssignment[]> =>
    new Promise((resolve) => setTimeout(() => resolve(INITIAL_ASSIGNMENTS), 500)),

  // --- PROJECT CRUD ---
  addProject: async (project: Project): Promise<Project> => {
    INITIAL_PROJECTS.push(project);
    console.log(`[Mock API] Added Project: ${project.name}`);
    return project;
  },
  updateProject: async (
    id: UUID,
    updates: Partial<Project>
  ): Promise<Project> => {
    const index = INITIAL_PROJECTS.findIndex((p) => p.id === id);
    if (index !== -1) {
      INITIAL_PROJECTS[index] = { ...INITIAL_PROJECTS[index], ...updates };
      console.log(`[Mock API] Updated Project ID: ${id}`);
      return INITIAL_PROJECTS[index];
    }
    throw new Error("Project not found");
  },
  deleteProject: async (id: UUID): Promise<boolean> => {
    const initialLength = INITIAL_PROJECTS.length;
    INITIAL_PROJECTS = INITIAL_PROJECTS.filter((p) => p.id !== id);
    if (INITIAL_PROJECTS.length < initialLength) {
      console.log(`[Mock API] Deleted Project ID: ${id}`);
      return true;
    }
    throw new Error("Project not found for deletion");
  },

  // --- TASK CRUD ---
  addTask: async (task: Task): Promise<Task> => {
    INITIAL_TASKS.push(task);
    console.log(`[Mock API] Added Task: ${task.name}`);
    return task;
  },
  updateTask: async (id: UUID, updates: Partial<Task>): Promise<Task> => {
    const index = INITIAL_TASKS.findIndex((t) => t.id === id);
    if (index !== -1) {
      INITIAL_TASKS[index] = { ...INITIAL_TASKS[index], ...updates };
      console.log(`[Mock API] Updated Task ID: ${id}`);
      return INITIAL_TASKS[index];
    }
    throw new Error("Task not found");
  },
  deleteTask: async (id: UUID): Promise<boolean> => {
    const initialLength = INITIAL_TASKS.length;
    INITIAL_TASKS = INITIAL_TASKS.filter((t) => t.id !== id);
    if (INITIAL_TASKS.length < initialLength) {
      console.log(`[Mock API] Deleted Task ID: ${id}`);
      return true;
    }
    throw new Error("Task not found for deletion");
  },

  // --- RESOURCE CRUD ---
  addResource: async (resource: Resource): Promise<Resource> => {
    INITIAL_RESOURCES.push(resource);
    console.log(`[Mock API] Added Resource: ${resource.name}`);
    return resource;
  },
  updateResource: async (
    id: UUID,
    updates: Partial<Resource>
  ): Promise<Resource> => {
    const index = INITIAL_RESOURCES.findIndex((r) => r.id === id);
    if (index !== -1) {
      INITIAL_RESOURCES[index] = { ...INITIAL_RESOURCES[index], ...updates };
      // Aquí deberíamos recalcular assigned_hours y available_hours si se cambia total_hours,
      // pero para el mock, simplemente actualizamos.
      console.log(`[Mock API] Updated Resource ID: ${id}`);
      return INITIAL_RESOURCES[index];
    }
    throw new Error("Resource not found");
  },
  deleteResource: async (id: UUID): Promise<boolean> => {
    const initialLength = INITIAL_RESOURCES.length;
    INITIAL_RESOURCES = INITIAL_RESOURCES.filter((r) => r.id !== id);
    if (INITIAL_RESOURCES.length < initialLength) {
      console.log(`[Mock API] Deleted Resource ID: ${id}`);
      return true;
    }
    throw new Error("Resource not found for deletion");
  },

  // --- TEAM MEMBER CRUD ---
  addTeamMember: async (member: TeamMember): Promise<TeamMember> => {
    INITIAL_TEAM.push(member);
    console.log(`[Mock API] Added Team Member: ${member.name}`);
    return member;
  },
  updateTeamMember: async (
    id: UUID,
    updates: Partial<TeamMember>
  ): Promise<TeamMember> => {
    const index = INITIAL_TEAM.findIndex((m) => m.id === id);
    if (index !== -1) {
      INITIAL_TEAM[index] = { ...INITIAL_TEAM[index], ...updates };
      console.log(`[Mock API] Updated Team Member ID: ${id}`);
      return INITIAL_TEAM[index];
    }
    throw new Error("Team Member not found");
  },
  deleteTeamMember: async (id: UUID): Promise<boolean> => {
    const initialLength = INITIAL_TEAM.length;
    INITIAL_TEAM = INITIAL_TEAM.filter((m) => m.id !== id);
    if (INITIAL_TEAM.length < initialLength) {
      console.log(`[Mock API] Deleted Team Member ID: ${id}`);
      return true;
    }
    throw new Error("Team Member not found for deletion");
  },

  // --- RESOURCE ASSIGNMENT CRUD ---
  addResourceAssignment: async (
    assignment: ResourceAssignment
  ): Promise<ResourceAssignment> => {
    INITIAL_ASSIGNMENTS.push(assignment);
    console.log(`[Mock API] Added Resource Assignment ID: ${assignment.id}`);
    return assignment;
  },
  updateResourceAssignment: async (
    id: UUID,
    updates: Partial<ResourceAssignment>
  ): Promise<ResourceAssignment> => {
    const index = INITIAL_ASSIGNMENTS.findIndex((a) => a.id === id);
    if (index !== -1) {
      INITIAL_ASSIGNMENTS[index] = { ...INITIAL_ASSIGNMENTS[index], ...updates };
      console.log(`[Mock API] Updated Resource Assignment ID: ${id}`);
      return INITIAL_ASSIGNMENTS[index];
    }
    throw new Error("Resource Assignment not found");
  },
  deleteResourceAssignment: async (id: UUID): Promise<boolean> => {
    const initialLength = INITIAL_ASSIGNMENTS.length;
    INITIAL_ASSIGNMENTS = INITIAL_ASSIGNMENTS.filter((a) => a.id !== id);
    if (INITIAL_ASSIGNMENTS.length < initialLength) {
      console.log(`[Mock API] Deleted Resource Assignment ID: ${id}`);
      return true;
    }
    throw new Error("Resource Assignment not found for deletion");
  },
};

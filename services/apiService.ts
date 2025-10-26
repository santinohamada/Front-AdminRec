import { INITIAL_ASSIGNMENTS, INITIAL_PROJECTS, INITIAL_RESOURCES, INITIAL_TASKS, INITIAL_TEAM, mockApi } from "./mocks"
import type {
  Project,
  Task,
  Resource,
  TeamMember,
  ResourceAssignment,
  NewProject,
  NewTask,
  NewResource,
  UUID, // <- Importar tipo UUID
  NewResourceAssignment, // <- Importar tipo para formulario
} from "@/lib/project-types"

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

// --- Helper para llamadas fetch ---
const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`)
  }
  return response.json()
}
export const bootstrap = async () => {
  if (USE_MOCKS) {
    const projects = INITIAL_PROJECTS
    const tasks = INITIAL_TASKS
    const resources = INITIAL_RESOURCES
    const teamMembers = INITIAL_TEAM
    const resourceAssignments = INITIAL_ASSIGNMENTS
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ projects, tasks, resources, teamMembers, resourceAssignments })
      }, 500) // Retraso de 500ms para simular latencia de red
    })
  }
  return await apiFetch("/bootstrap")
}

// --- API de Proyectos ---
export const projectService = {
  async getProjects(): Promise<Project[]> {
    if (USE_MOCKS) return mockApi.getProjects()
    return apiFetch("/projects")
  },
  async createProject(data: NewProject): Promise<Project> {
    if (USE_MOCKS) {
      // Simulación simple con UUID
      const newProject: Project = { ...data, id: crypto.randomUUID() }
      return newProject
    }
    return apiFetch("/projects", { method: "POST", body: JSON.stringify(data) })
  },
  async updateProject(id: UUID, data: Project): Promise<Project> {
    if (USE_MOCKS) return data
    return apiFetch(`/projects/${id}`, { method: "PUT", body: JSON.stringify(data) })
  },
  async deleteProject(id: UUID): Promise<void> {
    if (USE_MOCKS) return
    return apiFetch(`/projects/${id}`, { method: "DELETE" })
  },
}

// --- API de Tareas ---
export const taskService = {
  async getTasks(): Promise<Task[]> {
    if (USE_MOCKS) return mockApi.getTasks()
    return apiFetch("/tasks")
  },
  // Usar el tipo Omit<NewResourceAssignment, "task_id">
  async createTask(
    data: NewTask,
    assignments: Omit<NewResourceAssignment, "task_id">[],
  ): Promise<{ task: Task; newAssignments: ResourceAssignment[] }> {
    if (USE_MOCKS) {
      const newTask: Task = { ...data, id: crypto.randomUUID() }
      const newAssignments: ResourceAssignment[] = assignments.map((a) => ({
        ...a,
        id: crypto.randomUUID(),
        task_id: newTask.id,
      }))
      return { task: newTask, newAssignments }
    }
    // En una API real, esto probablemente sería una sola llamada de transacción
    const { task, newAssignments } = await apiFetch("/tasks", {
      method: "POST",
      body: JSON.stringify({ ...data, assignments }),
    })
    return { task, newAssignments } // Asumiendo que la API devuelve la tarea y las asignaciones creadas
  },
  // Usar el tipo Omit<NewResourceAssignment, "task_id">
  async updateTask(
    id: UUID,
    data: Task,
    assignments: Omit<NewResourceAssignment, "task_id">[],
  ): Promise<{ task: Task; updatedAssignments: ResourceAssignment[] }> {
    if (USE_MOCKS) {
      const updatedAssignments: ResourceAssignment[] = assignments.map((a) => ({
        ...a,
        id: crypto.randomUUID(), // Simular nuevos IDs si es necesario, o la API manejaría la lógica
        task_id: id,
      }))
      return { task: data, updatedAssignments }
    }
    const { task, updatedAssignments } = await apiFetch(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify({ ...data, assignments }),
    })
    return { task, updatedAssignments }
  },
  async deleteTask(id: UUID): Promise<void> {
    if (USE_MOCKS) return
    return apiFetch(`/tasks/${id}`, { method: "DELETE" })
  },
}

// --- API de Recursos ---
export const resourceService = {
  async getResources(): Promise<Resource[]> {
    if (USE_MOCKS) return mockApi.getResources()
    return apiFetch("/resources")
  },
  async createResource(data: NewResource): Promise<Resource> {
    if (USE_MOCKS) return { ...data, id: crypto.randomUUID() }
    return apiFetch("/resources", { method: "POST", body: JSON.stringify(data) })
  },
  async updateResource(id: UUID, data: Resource): Promise<Resource> {
    if (USE_MOCKS) return data
    return apiFetch(`/resources/${id}`, { method: "PUT", body: JSON.stringify(data) })
  },
  async deleteResource(id: UUID): Promise<void> {
    if (USE_MOCKS) return
    return apiFetch(`/resources/${id}`, { method: "DELETE" })
  },
}

// --- API de Equipo y Asignaciones (simplificado) ---
export const teamService = {
  async getTeam(): Promise<TeamMember[]> {
    if (USE_MOCKS) return mockApi.getTeam()
    return apiFetch("/team")
  },
}

export const assignmentService = {
  async getAssignments(): Promise<ResourceAssignment[]> {
    if (USE_MOCKS) return mockApi.getResourceAssignments()
    return apiFetch("/assignments")
  },
  async updateAssignment(id: UUID, data: ResourceAssignment): Promise<ResourceAssignment> {
    if (USE_MOCKS) return data
    return apiFetch(`/assignments/${id}`, { method: "PUT", body: JSON.stringify(data) })
  },
  async deleteAssignment(id: UUID): Promise<void> {
    if (USE_MOCKS) return
    return apiFetch(`/assignments/${id}`, { method: "DELETE" })
  },
}

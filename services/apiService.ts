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
    NewTeamMember, // <- ¡Añadido!
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
        // Intentar leer un mensaje de error del cuerpo si está disponible
        const errorBody = await response.json().catch(() => ({ message: response.statusText }))
        const errorMessage = errorBody.message || response.statusText;
        throw new Error(`API error (${response.status}): ${errorMessage}`)
    }
    return response.json()
}

// --- Bootstrap (Carga inicial) ---
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
    // Una sola llamada a la API para obtener todos los datos iniciales
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
            const newProject: Project = { ...data, id: crypto.randomUUID(), status: 'active' } // Asumiendo 'active' por defecto
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
        const result = await apiFetch("/tasks", {
            method: "POST",
            body: JSON.stringify({ ...data, assignments }),
        })
        return { task: result.task, newAssignments: result.newAssignments } // Asumiendo que la API devuelve { task, newAssignments }
    },
    async updateTask(
        id: UUID,
        data: Task,
        assignments: Omit<NewResourceAssignment, "task_id">[],
    ): Promise<{ task: Task; updatedAssignments: ResourceAssignment[] }> {
        if (USE_MOCKS) {
            // Simular que la API retorna la tarea actualizada y las asignaciones gestionadas
            const updatedAssignments: ResourceAssignment[] = assignments.map((a) => ({
                ...a,
                // En un mock real deberías manejar si el ID ya existe o es nuevo
                id: (a as ResourceAssignment).id || crypto.randomUUID(),
                task_id: id,
            }))
            return { task: data, updatedAssignments }
        }
        const result = await apiFetch(`/tasks/${id}`, {
            method: "PUT",
            body: JSON.stringify({ ...data, assignments }),
        })
        return { task: result.task, updatedAssignments: result.updatedAssignments }
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

// --- API de Equipo ---
export const teamService = {
    async getTeam(): Promise<TeamMember[]> {
        if (USE_MOCKS) return mockApi.getTeam()
        return apiFetch("/team")
    },
    /**
     * @summary Añade un nuevo miembro al equipo
     */
    async createTeamMember(data: NewTeamMember): Promise<TeamMember> {
        if (USE_MOCKS) {
            const newMember: TeamMember = { ...data, id: crypto.randomUUID() }
            return newMember
        }
        return apiFetch("/team", { method: "POST", body: JSON.stringify(data) })
    },
    /**
     * @summary Actualiza un miembro existente del equipo
     */
    async updateTeamMember(id: UUID, data: TeamMember): Promise<TeamMember> {
        if (USE_MOCKS) return data
        return apiFetch(`/team/${id}`, { method: "PUT", body: JSON.stringify(data) })
    },
    /**
     * @summary Elimina un miembro del equipo
     */
    async deleteTeamMember(id: UUID): Promise<void> {
        if (USE_MOCKS) return
        return apiFetch(`/team/${id}`, { method: "DELETE" })
    },
}

// --- API de Asignaciones ---
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
    // Se omite `createAssignment` ya que se gestiona dentro de `taskService.createTask/updateTask`
}
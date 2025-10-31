import { INITIAL_ASSIGNMENTS, INITIAL_PROJECTS, INITIAL_RESOURCES, INITIAL_TASKS, INITIAL_TEAM } from "./mocks"
import type {
  Project,
  Task,
  Resource,
  TeamMember,
  ResourceAssignment,
  NewProject,
  NewTask,
  NewResource,
  UUID,
  NewResourceAssignment,
  NewTeamMember,
} from "@/lib/project-types"

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

// --- Helpers de LocalStorage ---
const STORAGE_KEYS = {
  projects: "mock_projects",
  tasks: "mock_tasks",
  resources: "mock_resources",
  team: "mock_team",
  assignments: "mock_assignments",
} as const

function getLocalData<T>(key: keyof typeof STORAGE_KEYS, fallback: T): T {
  if (typeof window === "undefined") return fallback
  const stored = localStorage.getItem(STORAGE_KEYS[key])
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return fallback
    }
  }
  localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(fallback))
  return fallback
}

function setLocalData<T>(key: keyof typeof STORAGE_KEYS, data: T) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data))
}

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
    const errorBody = await response.json().catch(() => ({ message: response.statusText }))
    const errorMessage = errorBody.message || response.statusText
    throw new Error(`API error (${response.status}): ${errorMessage}`)
  }
  return response.json()
}

// --- Bootstrap ---
export const bootstrap = async () => {
  if (USE_MOCKS) {
    const projects = getLocalData("projects", INITIAL_PROJECTS)
    const tasks = getLocalData("tasks", INITIAL_TASKS)
    const resources = getLocalData("resources", INITIAL_RESOURCES)
    const teamMembers = getLocalData("team", INITIAL_TEAM)
    const resourceAssignments = getLocalData("assignments", INITIAL_ASSIGNMENTS)

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ projects, tasks, resources, teamMembers, resourceAssignments })
      }, 300)
    })
  }
  return await apiFetch("/bootstrap")
}

// --- PROJECTS ---
export const projectService = {
  async getProjects(): Promise<Project[]> {
    if (USE_MOCKS) return getLocalData("projects", INITIAL_PROJECTS)
    return apiFetch("/projects")
  },
  async createProject(data: NewProject): Promise<Project> {
    if (USE_MOCKS) {
      const newProject: Project = { ...data, id: crypto.randomUUID(), status: "active" }
      const projects = getLocalData("projects", INITIAL_PROJECTS)
      const updated = [...projects, newProject]
      setLocalData("projects", updated)
      return newProject
    }
    return apiFetch("/projects", { method: "POST", body: JSON.stringify(data) })
  },
  async updateProject(id: UUID, data: Project): Promise<Project> {
    if (USE_MOCKS) {
      const projects = getLocalData("projects", INITIAL_PROJECTS)
      const updated = projects.map((p) => (p.id === id ? data : p))
      setLocalData("projects", updated)
      return data
    }
    return apiFetch(`/projects/${id}`, { method: "PUT", body: JSON.stringify(data) })
  },
  async deleteProject(id: UUID): Promise<void> {
    if (USE_MOCKS) {
      const projects = getLocalData("projects", INITIAL_PROJECTS)
      const filtered = projects.filter((p) => p.id !== id)
      setLocalData("projects", filtered)
      return
    }
    return apiFetch(`/projects/${id}`, { method: "DELETE" })
  },
}

// --- TASKS ---
export const taskService = {
  async getTasks(): Promise<Task[]> {
    if (USE_MOCKS) return getLocalData("tasks", INITIAL_TASKS)
    return apiFetch("/tasks")
  },
  async createTask(
    data: NewTask,
    assignments: Omit<NewResourceAssignment, "task_id">[],
  ): Promise<{ task: Task; newAssignments: ResourceAssignment[]; updatedResources: Resource[] }> {
    if (USE_MOCKS) {
      const newTask: Task = { ...data, id: crypto.randomUUID() }

      const resources = getLocalData("resources", INITIAL_RESOURCES)
      const newAssignments: ResourceAssignment[] = assignments.map((a) => ({
        ...a,
        id: crypto.randomUUID(),
        task_id: newTask.id,
      }))

      // Reducir horas disponibles de los recursos y aumentar assigned_hours
      const updatedResources = resources.map((r) => {
        const assignmentForResource = newAssignments.find((a) => a.resource_id === r.id)
        if (!assignmentForResource) return r

        const hours = assignmentForResource.hours_assigned
        const newAvailableHours = Math.max(0, r.available_hours - hours)

        console.log(
          `[v0] Resource ${r.name}: ${r.available_hours}h -> ${newAvailableHours}h (assigned: ${hours}h)`,
        )

        return {
          ...r,
          available_hours: newAvailableHours,
          assigned_hours: (r.assigned_hours || 0) + hours,
        }
      })

      // Persistir datos
      const allTasks = [...getLocalData("tasks", INITIAL_TASKS), newTask]
      const allAssignments = [...getLocalData("assignments", INITIAL_ASSIGNMENTS), ...newAssignments]
      setLocalData("tasks", allTasks)
      setLocalData("assignments", allAssignments)
      setLocalData("resources", updatedResources)

      return { task: newTask, newAssignments, updatedResources }
    }

    return apiFetch("/tasks", {
      method: "POST",
      body: JSON.stringify({ ...data, assignments }),
    })
  },
  async updateTask(
    id: UUID,
    data: Task,
    assignments: Omit<NewResourceAssignment, "task_id">[],
  ): Promise<{ task: Task; updatedAssignments: ResourceAssignment[] }> {
    if (USE_MOCKS) {
      const oldAssignments = getLocalData("assignments", INITIAL_ASSIGNMENTS).filter((a) => a.task_id === id)
      const resources = getLocalData("resources", INITIAL_RESOURCES)

      // Devolver horas de asignaciones antiguas (disminuir assigned_hours y aumentar available_hours)
      let updatedResources = resources.map((r) => {
        const oldAssignment = oldAssignments.find((a) => a.resource_id === r.id)
        if (!oldAssignment) return r
        const hours = oldAssignment.hours_assigned
        return {
          ...r,
          available_hours: r.available_hours + hours,
          assigned_hours: Math.max(0, (r.assigned_hours || 0) - hours),
        }
      })

      // Crear nuevas asignaciones (asegurar id's)
      const updatedAssignments: ResourceAssignment[] = assignments.map((a) => ({
        ...(a as ResourceAssignment),
        id: (a as ResourceAssignment).id || crypto.randomUUID(),
        task_id: id,
      }))

      // Restar horas de nuevas asignaciones y actualizar assigned_hours
      updatedResources = updatedResources.map((r) => {
        const newAssignment = updatedAssignments.find((a) => a.resource_id === r.id)
        if (!newAssignment) return r
        const hours = newAssignment.hours_assigned
        return {
          ...r,
          available_hours: Math.max(0, r.available_hours - hours),
          assigned_hours: (r.assigned_hours || 0) + hours,
        }
      })

      const tasks = getLocalData("tasks", INITIAL_TASKS).map((t) => (t.id === id ? data : t))
      const allAssignments = getLocalData("assignments", INITIAL_ASSIGNMENTS).filter((a) => a.task_id !== id)

      setLocalData("tasks", tasks)
      setLocalData("assignments", [...allAssignments, ...updatedAssignments])
      setLocalData("resources", updatedResources)

      return { task: data, updatedAssignments }
    }
    const result = await apiFetch(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify({ ...data, assignments }),
    })
    return { task: result.task, updatedAssignments: result.updatedAssignments }
  },
  async deleteTask(id: UUID): Promise<void> {
    if (USE_MOCKS) {
      const assignmentsToDelete = getLocalData("assignments", INITIAL_ASSIGNMENTS).filter((a) => a.task_id === id)
      const resources = getLocalData("resources", INITIAL_RESOURCES)

      // Devolver horas de las asignaciones eliminadas (aumentar available_hours, disminuir assigned_hours)
      const updatedResources = resources.map((r) => {
        const assignmentsForResource = assignmentsToDelete.filter((a) => a.resource_id === r.id)
        const hoursToReturn = assignmentsForResource.reduce((sum, a) => sum + a.hours_assigned, 0)

        if (hoursToReturn > 0) {
          console.log(`[v0] Returning ${hoursToReturn}h to resource ${r.name}`)
        }

        return {
          ...r,
          available_hours: r.available_hours + hoursToReturn,
          assigned_hours: Math.max(0, (r.assigned_hours || 0) - hoursToReturn),
        }
      })

      const tasks = getLocalData("tasks", INITIAL_TASKS).filter((t) => t.id !== id)
      const assignments = getLocalData("assignments", INITIAL_ASSIGNMENTS).filter((a) => a.task_id !== id)

      setLocalData("tasks", tasks)
      setLocalData("assignments", assignments)
      setLocalData("resources", updatedResources)
      return
    }
    return apiFetch(`/tasks/${id}`, { method: "DELETE" })
  },
}

// --- RESOURCES ---
export const resourceService = {
  async getResources(): Promise<Resource[]> {
    if (USE_MOCKS) return getLocalData("resources", INITIAL_RESOURCES)
    return apiFetch("/resources")
  },
  async createResource(data: NewResource): Promise<Resource> {
    if (USE_MOCKS) {
      const newRes: Resource = { ...data, id: crypto.randomUUID() }
      const updated = [...getLocalData("resources", INITIAL_RESOURCES), newRes]
      setLocalData("resources", updated)
      return newRes
    }
    return apiFetch("/resources", { method: "POST", body: JSON.stringify(data) })
  },
  async updateResource(id: UUID, data: Resource): Promise<Resource> {
    if (USE_MOCKS) {
      const updated = getLocalData("resources", INITIAL_RESOURCES).map((r) => (r.id === id ? data : r))
      setLocalData("resources", updated)
      return data
    }
    return apiFetch(`/resources/${id}`, { method: "PUT", body: JSON.stringify(data) })
  },
  async deleteResource(id: UUID): Promise<void> {
    if (USE_MOCKS) {
      const filtered = getLocalData("resources", INITIAL_RESOURCES).filter((r) => r.id !== id)
      setLocalData("resources", filtered)
      return
    }
    return apiFetch(`/resources/${id}`, { method: "DELETE" })
  },
}

// --- TEAM ---
export const teamService = {
  async getTeam(): Promise<TeamMember[]> {
    if (USE_MOCKS) return getLocalData("team", INITIAL_TEAM)
    return apiFetch("/team")
  },
  async createTeamMember(data: NewTeamMember): Promise<TeamMember> {
    if (USE_MOCKS) {
      const newMember: TeamMember = { ...data, id: crypto.randomUUID() }
      const updated = [...getLocalData("team", INITIAL_TEAM), newMember]
      setLocalData("team", updated)
      return newMember
    }
    return apiFetch("/team", { method: "POST", body: JSON.stringify(data) })
  },
  async updateTeamMember(id: UUID, data: TeamMember): Promise<TeamMember> {
    if (USE_MOCKS) {
      const updated = getLocalData("team", INITIAL_TEAM).map((m) => (m.id === id ? data : m))
      setLocalData("team", updated)
      return data
    }
    return apiFetch(`/team/${id}`, { method: "PUT", body: JSON.stringify(data) })
  },
  async deleteTeamMember(id: UUID): Promise<void> {
    if (USE_MOCKS) {
      const filtered = getLocalData("team", INITIAL_TEAM).filter((m) => m.id !== id)
      setLocalData("team", filtered)
      return
    }
    return apiFetch(`/team/${id}`, { method: "DELETE" })
  },
}

// --- ASSIGNMENTS ---

export const assignmentService = {
  async getAssignments(): Promise<ResourceAssignment[]> {
    if (USE_MOCKS) return getLocalData("assignments", INITIAL_ASSIGNMENTS)
    return apiFetch("/assignments")
  },

  async getResources(): Promise<Resource[]> {
    if (USE_MOCKS) return getLocalData("resources", INITIAL_RESOURCES)
    return apiFetch("/resources")
  },

  async createAssignment(data: NewResourceAssignment): Promise<ResourceAssignment> {
    if (USE_MOCKS) {
      const newAssignment: ResourceAssignment = {
        id: crypto.randomUUID(),
        task_id: data.task_id,
        resource_id: data.resource_id,
        hours_assigned: data.hours_assigned,
        start_date: data.start_date,
        end_date: data.end_date,
      }

      const resources = getLocalData("resources", INITIAL_RESOURCES)
      const updatedResources = resources.map((r) =>
        r.id === data.resource_id ? { ...r, available_hours: Math.max(0, r.available_hours - data.hours_assigned),assigned_hours: (r.assigned_hours || 0) + data.hours_assigned } : r,
      )

      const updatedAssignments = [...getLocalData("assignments", INITIAL_ASSIGNMENTS), newAssignment]
      setLocalData("assignments", updatedAssignments)
      setLocalData("resources", updatedResources)

      return newAssignment
    }

    return apiFetch(`/assignments`, { method: "POST", body: JSON.stringify(data) })
  },

  async updateAssignment(id: UUID, data: ResourceAssignment): Promise<ResourceAssignment> {
    if (USE_MOCKS) {
      const assignments = getLocalData("assignments", INITIAL_ASSIGNMENTS)
      const prev = assignments.find((a) => a.id === id)
      const updatedAssignments = assignments.map((a) => (a.id === id ? data : a))

      const resources = getLocalData("resources", INITIAL_RESOURCES)
      const updatedResources = resources.map((r) => {
        if (r.id !== data.resource_id) return r
        const diff = data.hours_assigned - (prev?.hours_assigned || 0)
        return {
          ...r,
          available_hours: Math.max(0, r.available_hours - diff),
          assigned_hours: Math.max(0, (r.assigned_hours || 0) + diff),
        }
      })

      setLocalData("assignments", updatedAssignments)
      setLocalData("resources", updatedResources)
      return data
    }

    return apiFetch(`/assignments/${id}`, { method: "PUT", body: JSON.stringify(data) })
  },

  async deleteAssignment(id: UUID): Promise<void> {
    if (USE_MOCKS) {
      const assignments = getLocalData("assignments", INITIAL_ASSIGNMENTS)
      const assignmentToRemove = assignments.find((a) => a.id === id)
      const filteredAssignments = assignments.filter((a) => a.id !== id)

      const resources = getLocalData("resources", INITIAL_RESOURCES)
      const updatedResources = assignmentToRemove
        ? resources.map((r) =>
            r.id === assignmentToRemove.resource_id
              ? { ...r, available_hours: r.available_hours + assignmentToRemove.hours_assigned, assigned_hours: Math.max(0, (r.assigned_hours || 0) - assignmentToRemove.hours_assigned) }
              : r,
          )
        : resources

      setLocalData("assignments", filteredAssignments)
      setLocalData("resources", updatedResources)
      return
    }

    return apiFetch(`/assignments/${id}`, { method: "DELETE" })
  },
}

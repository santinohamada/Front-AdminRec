"use client"

import { create } from "zustand"
import { devtools } from "zustand/middleware"
import {
  projectService,
  taskService,
  resourceService,
  teamService,
  assignmentService,
} from "@/services/apiService"

import type {
  Project,
  Task,
  Resource,
  TeamMember,
  ResourceAssignment,
  NewProject,
  NewTask,
  NewResource,
} from "@/lib/project-types"

interface ProjectStore {
  // Datos
  projects: Project[]
  tasks: Task[]
  resources: Resource[]
  teamMembers: TeamMember[]
  resourceAssignments: ResourceAssignment[]
  isLoading: boolean
  error: Error | null

  // Acciones
  init: () => Promise<void>
  createProject: (data: NewProject) => Promise<Project | null>
  updateProject: (data: Project) => Promise<Project | null>
  deleteProject: (id: string) => Promise<void>
  toggleProjectStatus: (project: Project) => Promise<Project | null>

  createTask: (
    data: NewTask,
    assignments: Omit<ResourceAssignment, "id" | "task_id">[]
  ) => Promise<Task | null>
  updateTask: (
    data: Task,
    assignments: Omit<ResourceAssignment, "id" | "task_id">[]
  ) => Promise<Task | null>
  deleteTask: (id: string) => Promise<void>

  createResource: (data: NewResource) => Promise<Resource | null>
  updateResource: (data: Resource) => Promise<Resource | null>
  deleteResource: (id: string) => Promise<void>

  updateAssignment: (data: ResourceAssignment) => Promise<ResourceAssignment | null>
  deleteAssignment: (id: string) => Promise<void>
}

// ------------------------------------
// STORE ZUSTAND
// ------------------------------------

export const useProjectStore = create<ProjectStore>()(
  ((set, get) => ({
    projects: [],
    tasks: [],
    resources: [],
    teamMembers: [],
    resourceAssignments: [],
    isLoading: true,
    error: null,

    // --- Inicialización ---
    init: async () => {
      try {
        set({ isLoading: true, error: null })
  
        const [projects, tasks, resources, teamMembers, resourceAssignments] = await Promise.all([
          
          projectService.getProjects(),
          taskService.getTasks(),
          resourceService.getResources(),
          teamService.getTeam(),
          assignmentService.getAssignments(),
        ])
        set({ projects, tasks, resources, teamMembers, resourceAssignments })
      } catch (err) {
        set({ error: err as Error })
      } finally {
        set({ isLoading: false })
      }
    },

    // --- Proyectos ---
    createProject: async (data) => {
      try {
        const newProject = await projectService.createProject(data)
        set((state) => ({ projects: [...state.projects, newProject] }))
        return newProject
      } catch (err) {
        console.error(err)
        return null
      }
    },

    updateProject: async (data) => {
      try {
        const updated = await projectService.updateProject(data.id, data)
        set((state) => ({
          projects: state.projects.map((p) => (p.id === updated.id ? updated : p)),
        }))
        return updated
      } catch (err) {
        console.error(err)
        return null
      }
    },

    deleteProject: async (id) => {
      try {
        await projectService.deleteProject(id)
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          tasks: state.tasks.filter((t) => t.project_id !== id),
          resourceAssignments: state.resourceAssignments.filter(
            (a) => !state.tasks.find((t) => t.id === a.task_id && t.project_id === id)
          ),
        }))
      } catch (err) {
        console.error(err)
      }
    },

    toggleProjectStatus: async (project) => {
      const newStatus = project.status === "closed" ? "active" : "closed"
      return await get().updateProject({ ...project, status: newStatus })
    },

    // --- Tareas ---
    createTask: async (data, assignments) => {
      try {
        const { task, newAssignments } = await taskService.createTask(data, assignments)
        set((state) => ({
          tasks: [...state.tasks, task],
          resourceAssignments: [...state.resourceAssignments, ...newAssignments],
        }))
        return task
      } catch (err) {
        console.error(err)
        return null
      }
    },

    updateTask: async (data, assignments) => {
      try {
        const { task, updatedAssignments } = await taskService.updateTask(data.id, data, assignments)
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
          resourceAssignments: [
            ...state.resourceAssignments.filter((a) => a.task_id !== task.id),
            ...updatedAssignments,
          ],
        }))
        return task
      } catch (err) {
        console.error(err)
        return null
      }
    },

    deleteTask: async (id) => {
      try {
        await taskService.deleteTask(id)
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
          resourceAssignments: state.resourceAssignments.filter((a) => a.task_id !== id),
        }))
      } catch (err) {
        console.error(err)
      }
    },

    // --- Recursos ---
    createResource: async (data) => {
      try {
        const newResource = await resourceService.createResource(data)
        set((state) => ({ resources: [...state.resources, newResource] }))
        return newResource
      } catch (err) {
        console.error(err)
        return null
      }
    },

    updateResource: async (data) => {
      try {
        const updated = await resourceService.updateResource(data.id, data)
        set((state) => ({
          resources: state.resources.map((r) => (r.id === updated.id ? updated : r)),
        }))
        return updated
      } catch (err) {
        console.error(err)
        return null
      }
    },

    deleteResource: async (id) => {
      try {
        await resourceService.deleteResource(id)
        set((state) => ({
          resources: state.resources.filter((r) => r.id !== id),
          resourceAssignments: state.resourceAssignments.filter((a) => a.resource_id !== id),
        }))
      } catch (err) {
        console.error(err)
      }
    },

    // --- Asignaciones ---
    updateAssignment: async (data) => {
      try {
        const updated = await assignmentService.updateAssignment(data.id, data)
        set((state) => ({
          resourceAssignments: state.resourceAssignments.map((a) =>
            a.id === updated.id ? updated : a
          ),
        }))
        return updated
      } catch (err) {
        console.error(err)
        return null
      }
    },

    deleteAssignment: async (id) => {
      try {
        await assignmentService.deleteAssignment(id)
        set((state) => ({
          resourceAssignments: state.resourceAssignments.filter((a) => a.id !== id),
        }))
      } catch (err) {
        console.error(err)
      }
    },
  }))
)

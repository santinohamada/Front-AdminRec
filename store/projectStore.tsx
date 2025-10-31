"use client"

import { create } from "zustand"
import { devtools } from "zustand/middleware"
import {
  projectService,
  taskService,
  resourceService,
  teamService,
  assignmentService,
  bootstrap,
} from "@/services/apiService" // Asegúrate de que tu apiService incluya teamService

import type {
  Project,
  Task,
  Resource,
  TeamMember,
  ResourceAssignment,
  NewTask,
  NewResource,
  NewTeamMember,
  NewResourceAssignment,
  UUID,
} from "@/lib/project-types"

/**
 * Interfaz unificada para el Store de Proyectos
 */
interface ProjectStore {
  // Datos
  projects: Project[]
  tasks: Task[]
  resources: Resource[]
  teamMembers: TeamMember[]
  resourceAssignments: ResourceAssignment[]
  isLoading: boolean
  error: Error | null // Usamos Error para manejar errores de API

  // Acciones
  init: () => Promise<void>

  // --- Proyectos ---
  createProject: (data: Omit<Project, "id">) => Promise<Project | null>
  updateProject: (data: Project) => Promise<Project | null>
  deleteProject: (id: UUID) => Promise<void>
  toggleProjectStatus: (project: Project) => Promise<Project | null>

  // --- Tareas ---
  createTask: (data: NewTask, assignments?: Omit<ResourceAssignment, "id" | "task_id">[]) => Promise<Task | null>
  updateTask: (data: Task, assignments?: Omit<ResourceAssignment, "id" | "task_id">[]) => Promise<Task | null>
  deleteTask: (id: UUID) => Promise<void>

  // --- Recursos ---
  createResource: (data: NewResource) => Promise<Resource | null>
  updateResource: (data: Resource) => Promise<Resource | null>
  deleteResource: (id: UUID) => Promise<void>

  // --- Miembros del Equipo (Team Members) ---
  createTeamMember: (member: NewTeamMember) => Promise<TeamMember | null>
  updateTeamMember: (member: TeamMember) => Promise<TeamMember | null>
  deleteTeamMember: (id: UUID) => Promise<void>

  // --- Asignaciones ---
  updateAssignment: (data: ResourceAssignment) => Promise<ResourceAssignment | null>
  deleteAssignment: (id: UUID) => Promise<void>
  createAssignment: (data: NewResourceAssignment) => Promise<ResourceAssignment | null>

  // Se ha omitido `createAssignment` independiente ya que `createTask` y `updateTask` la manejan en el primer fragmento.
  // Si se necesita una acción independiente, se puede agregar.

  // --- Selectores ---
  getResourcesByProject: (projectId: UUID) => Resource[]
  getTeamMembersByProject: (projectId: UUID) => TeamMember[]
  getTeamMemberWorkload: (memberId: UUID) => number
}

// ------------------------------------
// STORE ZUSTAND UNIFICADO
// ------------------------------------

export const useProjectStore = create<ProjectStore>()(
  // Envolvemos el store con devtools para una mejor experiencia de desarrollo/depuración
  devtools(
    (set, get) => ({
      // Estado Inicial
      projects: localStorage.getItem("mock_projects") ? JSON.parse(localStorage.getItem("mock_projects")!) : [],
      tasks: localStorage.getItem("mock_tasks") ? JSON.parse(localStorage.getItem("mock_tasks")!) : [],
     
      resources: localStorage.getItem("mock_resources") ? JSON.parse(localStorage.getItem("mock_resources")!) : [],
      teamMembers: localStorage.getItem("mock_team") ? JSON.parse(localStorage.getItem("mock_team")!) : [],
      resourceAssignments: localStorage.getItem("mock_asignments") ? JSON.parse(localStorage.getItem("mock_asignments")!) : [],
      isLoading: true, // Inicialmente en true para la carga inicial
      error: null,

      // --- Inicialización ---
      init: async () => { 
        try {
          set({ isLoading: true, error: null })

          // Llama a la función bootstrap para cargar todos los datos iniciales
          const { projects, tasks, resources, teamMembers, resourceAssignments } = await bootstrap()
          set({ projects, tasks, resources, teamMembers, resourceAssignments })
        } catch (err) {
          console.error("Error during initialization:", err)
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
          console.error("Error creating project:", err)
          set({ error: err as Error })
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
          console.error("Error updating project:", err)
          set({ error: err as Error })
          return null
        }
      },

      deleteProject: async (id) => {
        try {
          await projectService.deleteProject(id)
          set((state) => {
            // Obtener IDs de las tareas asociadas al proyecto
            const tasksToDelete = state.tasks.filter((t) => t.project_id === id)
            const taskIdsToDelete = tasksToDelete.map((t) => t.id)

            return {
              projects: state.projects.filter((p) => p.id !== id),
              tasks: state.tasks.filter((t) => t.project_id !== id),
              // Filtrar asignaciones que NO estén asociadas a las tareas eliminadas
              resourceAssignments: state.resourceAssignments.filter((a) => !taskIdsToDelete.includes(a.task_id)),
            }
          })
        } catch (err) {
          console.error("Error deleting project:", err)
          set({ error: err as Error })
        }
      },

      toggleProjectStatus: async (project) => {
        const newStatus = project.status === "closed" ? "active" : "closed"
        // Reutiliza la función updateProject
        return await get().updateProject({ ...project, status: newStatus })
      },

      // --- Tareas ---
      createTask: async (data, assignments = []) => {
        try {
          const { task, newAssignments, updatedResources } = await taskService.createTask(data, assignments)
          set((state) => {
            // Crear un mapa de recursos actualizados por ID para búsqueda rápida
            const updatedResourcesMap = new Map(updatedResources.map((r) => [r.id, r]))

            // Reemplazar recursos actualizados en el estado
            const syncedResources = state.resources.map((r) =>
              updatedResourcesMap.has(r.id) ? updatedResourcesMap.get(r.id)! : r,
            )

            return {
              tasks: [...state.tasks, task],
              resourceAssignments: [...state.resourceAssignments, ...newAssignments],
              resources: syncedResources, // Recursos sincronizados correctamente
            }
          })
          return task
        } catch (err) {
          console.error("Error creating task:", err)
          set({ error: err as Error })
          return null
        }
      },

      updateTask: async (data, assignments = []) => {
        try {
          const { task, updatedAssignments } = await taskService.updateTask(data.id, data, assignments)
          
          // Obtener recursos actualizados después de la operación
          const updatedResources = await assignmentService.getResources()
          console.log(updatedResources)
          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
            resourceAssignments: [
              // Filtra las asignaciones antiguas de esta tarea
              ...state.resourceAssignments.filter((a) => a.task_id !== task.id),
              // Añade las asignaciones actualizadas
              ...updatedAssignments,
            ],
            resources: updatedResources, 
          }))
          return task
        } catch (err) {
          console.error("Error updating task:", err)
          set({ error: err as Error })
          return null
        }
      },

      deleteTask: async (id) => {
        try {
          await taskService.deleteTask(id)

          const updatedResources = await assignmentService.getResources()

          set((state) => ({
            tasks: state.tasks.filter((t) => t.id !== id),
            // Elimina las asignaciones asociadas a la tarea
            resourceAssignments: state.resourceAssignments.filter((a) => a.task_id !== id),
            resources: updatedResources, // Sincronizar recursos (devuelve horas)
          }))
        } catch (err) {
          console.error("Error deleting task:", err)
          set({ error: err as Error })
        }
      },

      // --- Recursos ---
      createResource: async (data) => {
        try {
          const newResource = await resourceService.createResource(data)
          set((state) => ({ resources: [...state.resources, newResource] }))
          return newResource
        } catch (err) {
          console.error("Error creating resource:", err)
          set({ error: err as Error })
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
          console.error("Error updating resource:", err)
          set({ error: err as Error })
          return null
        }
      },

      deleteResource: async (id) => {
        try {
          await resourceService.deleteResource(id)
          set((state) => ({
            resources: state.resources.filter((r) => r.id !== id),
            // Elimina las asignaciones asociadas al recurso
            resourceAssignments: state.resourceAssignments.filter((a) => a.resource_id !== id),
          }))
        } catch (err) {
          console.error("Error deleting resource:", err)
          set({ error: err as Error })
        }
      },

      // --- Miembros del Equipo (Team Members) ---
      // Usamos teamService en lugar de fetch directamente, asumiendo su existencia
      createTeamMember: async (member: NewTeamMember) => {
        try {
          const newMember = await teamService.createTeamMember(member)
          set((state) => ({
            teamMembers: [...state.teamMembers, newMember],
          }))
          return newMember
        } catch (error) {
          console.error("Error creating team member:", error)
          set({ error: error as Error })
          return null
        }
      },

      updateTeamMember: async (member: TeamMember) => {
        try {
          const updatedMember = await teamService.updateTeamMember(member.id, member)
          set((state) => ({
            teamMembers: state.teamMembers.map((m) => (m.id === updatedMember.id ? updatedMember : m)),
          }))
          return updatedMember
        } catch (error) {
          console.error("Error updating team member:", error)
          set({ error: error as Error })
          return null
        }
      },

      deleteTeamMember: async (id: UUID) => {
        try {
          await teamService.deleteTeamMember(id)
          set((state) => ({
            teamMembers: state.teamMembers.filter((m) => m.id !== id),
            // Considerar eliminar o reasignar tareas donde este miembro era el `assignee_id`
            // Aquí solo lo quitaremos de la lista de miembros por simplicidad
          }))
        } catch (error) {
          console.error("Error deleting team member:", error)
          set({ error: error as Error })
        }
      },

      // --- Asignaciones ---
      // --- Asignaciones en el store ---
      createAssignment: async (data: NewResourceAssignment) => {
        try {
          const created = await assignmentService.createAssignment(data)
          const updatedResources = await assignmentService.getResources()

          set((state) => ({
            resourceAssignments: [...state.resourceAssignments, created],
            resources: updatedResources,
          }))
          return created
        } catch (err) {
          console.error("Error creating assignment:", err)
          set({ error: err as Error })
          return null
        }
      },

      updateAssignment: async (data: ResourceAssignment) => {
        try {
          const updated = await assignmentService.updateAssignment(data.id, data)
          const updatedResources = await assignmentService.getResources()

          set((state) => ({
            resourceAssignments: state.resourceAssignments.map((a) => (a.id === updated.id ? updated : a)),
            resources: updatedResources,
          }))
          return updated
        } catch (err) {
          console.error("Error updating assignment:", err)
          set({ error: err as Error })
          return null
        }
      },

      deleteAssignment: async (id: UUID) => {
        try {
          await assignmentService.deleteAssignment(id)
          const updatedResources = await assignmentService.getResources()

          set((state) => ({
            resourceAssignments: state.resourceAssignments.filter((a) => a.id !== id),
            resources: updatedResources,
          }))
        } catch (err) {
          console.error("Error deleting assignment:", err)
          set({ error: err as Error })
        }
      },

      // --- Selectores (Funciones de Lectura) ---
      getResourcesByProject: (projectId: UUID) => {
        const state = get()
        const projectTasks = state.tasks.filter((t) => t.project_id === projectId)
        const taskIds = projectTasks.map((t) => t.id)
        // Obtener asignaciones para estas tareas
        const assignments = state.resourceAssignments.filter((a) => taskIds.includes(a.task_id))
        // Obtener IDs de recursos únicos
        const resourceIds = [...new Set(assignments.map((a) => a.resource_id))]
        // Filtrar recursos
        return state.resources.filter((r) => resourceIds.includes(r.id))
      },

      getTeamMembersByProject: (projectId: UUID) => {
        const state = get()
        // Tareas del proyecto
        const projectTasks = state.tasks.filter((t) => t.project_id === projectId)
        // IDs de los miembros asignados a esas tareas (y filtra nulos/undefined)
        const memberIds = [...new Set(projectTasks.map((t) => t.assignee_id).filter(Boolean))]
        // Filtrar miembros del equipo
        return state.teamMembers.filter((m) => memberIds.includes(m.id))
      },


      getTeamMemberWorkload: (memberId: UUID) => {
        const state = get()
        // Tareas asignadas directamente al miembro del equipo (asumiendo `assignee_id` en `Task`)
        const memberTasks = state.tasks.filter((t) => t.assignee_id === memberId)
        // Suma las horas estimadas de esas tareas
        return memberTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0)
      },
    }),
    { name: "ProjectStore" },
  ), // Nombre del store para devtools
)

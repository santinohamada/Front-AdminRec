"use client"

import { useState, useMemo } from "react"
import { CheckCircle2Icon, BoxIcon, DollarSignIcon, UsersIcon, MenuIcon, XIcon } from "lucide-react"
import { ProjectList } from "@/components/project-list"
import { ProjectHeader } from "@/components/project-header"
import { ProjectForm } from "@/components/project-form"
import { TaskList } from "@/components/task-list"
import { TaskForm } from "@/components/task-form"
import { BudgetOverview } from "@/components/budget-overview"
import { ResourceList } from "@/components/resource-list"
import { ResourceForm } from "@/components/resource-form"
import { TeamList } from "@/components/team-list"
import { WeeklyReport } from "@/components/weekly-report"
import { Modal } from "@/components/modal"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { INITIAL_PROJECTS, INITIAL_TASKS, INITIAL_RESOURCES, INITIAL_TEAM } from "@/lib/project-data"
import type { Task, ResourceAssignment, Project, Resource } from "@/lib/project-types"

export default function ProjectManagementSystem() {
  const [projects, setProjects] = useState(INITIAL_PROJECTS)
  const [tasks, setTasks] = useState(INITIAL_TASKS)
  const [resources, setResources] = useState(INITIAL_RESOURCES)
  const [teamMembers] = useState(INITIAL_TEAM)
  const [resourceAssignments, setResourceAssignments] = useState<ResourceAssignment[]>([])

  const [selectedProjectId, setSelectedProjectId] = useState<number>(1)
  const [activeTab, setActiveTab] = useState<"tasks" | "resources" | "budget" | "team">("tasks")
  const [taskFilter, setTaskFilter] = useState<"all" | "completed" | "in-progress">("all")

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | undefined>()
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false)
  const [isResourceFormModalOpen, setIsResourceFormModalOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | undefined>()
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  const selectedProject = projects.find((p) => p.id === selectedProjectId)
  const projectTasks = useMemo(
    () => tasks.filter((t) => t.project_id === selectedProjectId),
    [tasks, selectedProjectId],
  )

  const isProjectClosed = selectedProject?.status === "closed"

  const handleSaveProject = (projectData: Omit<Project, "id"> | Project) => {
    if ("id" in projectData) {
      setProjects(projects.map((p) => (p.id === projectData.id ? (projectData as Project) : p)))
    } else {
      const newProject: Project = {
        ...projectData,
        id: Math.max(...projects.map((p) => p.id), 0) + 1,
      }
      setProjects([...projects, newProject])
      setSelectedProjectId(newProject.id)
    }
    setIsProjectModalOpen(false)
    setEditingProject(undefined)
  }

  const handleDeleteProject = () => {
    if (!selectedProject) return

    if (
      confirm(
        `¿Estás seguro de que quieres eliminar "${selectedProject.name}"? Esto también eliminará todas las tareas y asignaciones de recursos asociadas.`,
      )
    ) {
      setProjects(projects.filter((p) => p.id !== selectedProjectId))
      const projectTaskIds = tasks.filter((t) => t.project_id === selectedProjectId).map((t) => t.id)
      setTasks(tasks.filter((t) => t.project_id !== selectedProjectId))
      setResourceAssignments(resourceAssignments.filter((a) => !projectTaskIds.includes(a.task_id)))

      const remainingProjects = projects.filter((p) => p.id !== selectedProjectId)
      if (remainingProjects.length > 0) {
        setSelectedProjectId(remainingProjects[0].id)
      }
    }
  }

  const handleToggleProjectClosed = () => {
    if (!selectedProject) return

    const newStatus = selectedProject.status === "closed" ? "active" : "closed"
    const action = newStatus === "closed" ? "cerrar" : "reabrir"

    if (
      confirm(
        `¿Estás seguro de que quieres ${action} este proyecto? ${
          newStatus === "closed"
            ? "No se podrán realizar cambios hasta que se reabra."
            : "Se permitirán cambios nuevamente."
        }`,
      )
    ) {
      setProjects(projects.map((p) => (p.id === selectedProjectId ? { ...p, status: newStatus } : p)))
    }
  }

  const handleSaveTask = (
    taskData: Omit<Task, "id"> | Task,
    resourceAssignments?: Omit<ResourceAssignment, "id" | "task_id">[],
  ) => {
    if ("id" in taskData) {
      setTasks(tasks.map((t) => (t.id === taskData.id ? (taskData as Task) : t)))

      // Update resource assignments for existing task
      if (resourceAssignments) {
        // Remove old assignments for this task
        setResourceAssignments((prev) => prev.filter((a) => a.task_id !== taskData.id))

        // Add new assignments
        const newAssignments = resourceAssignments.map((ra, index) => ({
          ...ra,
          id: Math.max(...resourceAssignments.map((a) => a.id || 0), 0) + index + 1,
          task_id: taskData.id,
          hours_actual: 0,
        }))
        setResourceAssignments((prev) => [...prev, ...newAssignments])
      }
    } else {
      const newTask: Task = {
        ...taskData,
        id: Math.max(...tasks.map((t) => t.id), 0) + 1,
      }
      setTasks([...tasks, newTask])

      // Add resource assignments for new task
      if (resourceAssignments && resourceAssignments.length > 0) {
        const newAssignments = resourceAssignments.map((ra, index) => ({
          ...ra,
          id: Math.max(...resourceAssignments.map((a) => a.id), 0) + index + 1,
          task_id: newTask.id,
          hours_actual: 0,
        }))
        setResourceAssignments([...resourceAssignments, ...newAssignments])
      }
    }
    setIsTaskModalOpen(false)
    setEditingTask(undefined)
  }

  const handleDeleteTask = (taskId: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta tarea?")) {
      setTasks(tasks.filter((t) => t.id !== taskId))
      setResourceAssignments(resourceAssignments.filter((a) => a.task_id !== taskId))
    }
  }

  const handleToggleComplete = (taskId: number) => {
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)))
  }

  const handleSaveResource = (resourceData: Omit<Resource, "id"> | Resource) => {
    if ("id" in resourceData) {
      setResources(resources.map((r) => (r.id === resourceData.id ? (resourceData as Resource) : r)))
    } else {
      const newResource: Resource = {
        ...resourceData,
        id: Math.max(...resources.map((r) => r.id), 0) + 1,
      }
      setResources([...resources, newResource])
    }
    setIsResourceFormModalOpen(false)
    setEditingResource(undefined)
  }

  const handleDeleteResource = (resourceId: number) => {
    const hasAssignments = resourceAssignments.some((a) => a.resource_id === resourceId)

    if (hasAssignments) {
      if (
        !confirm(
          "Este recurso tiene asignaciones. ¿Estás seguro de que quieres eliminarlo? Esto también eliminará todas sus asignaciones.",
        )
      ) {
        return
      }
      setResourceAssignments(resourceAssignments.filter((a) => a.resource_id !== resourceId))
    } else {
      if (!confirm("¿Estás seguro de que quieres eliminar este recurso?")) {
        return
      }
    }

    setResources(resources.filter((r) => r.id !== resourceId))
  }

  const handleAssignResource = (assignment: Omit<ResourceAssignment, "id">) => {
    const newAssignment: ResourceAssignment = {
      ...assignment,
      id: Math.max(...resourceAssignments.map((a) => a.id), 0) + 1,
    }
    setResourceAssignments([...resourceAssignments, newAssignment])
    setIsResourceModalOpen(false)
  }

  const handleRemoveResourceAssignment = (assignmentId: number) => {
    if (confirm("¿Eliminar esta asignación de recurso?")) {
      setResourceAssignments(resourceAssignments.filter((a) => a.id !== assignmentId))
    }
  }

  const handleUpdateAssignment = (updatedAssignment: ResourceAssignment) => {
    setResourceAssignments(resourceAssignments.map((a) => (a.id === updatedAssignment.id ? updatedAssignment : a)))
  }

  const handleSelectProject = (projectId: number) => {
    setSelectedProjectId(projectId)
    setIsMobileSidebarOpen(false)
  }

  if (!selectedProject) return null

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="px-4 md:px-6 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          >
            {isMobileSidebarOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </Button>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Sistema de Gestión de Proyectos</h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1 hidden sm:block">
              Gestiona proyectos, tareas, recursos y presupuestos
            </p>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)] md:h-[calc(100vh-89px)] relative">
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
          )}
        </AnimatePresence>

        <div
          className={`
            fixed md:relative inset-y-0 left-0 z-50 md:z-0
            transform transition-transform duration-300 ease-in-out
            ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
        >
          <ProjectList
            projects={projects}
            tasks={tasks}
            selectedProjectId={selectedProjectId}
            onSelectProject={handleSelectProject}
            onAddProject={() => {
              setEditingProject(undefined)
              setIsProjectModalOpen(true)
              setIsMobileSidebarOpen(false)
            }}
          />
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            <ProjectHeader
              project={selectedProject}
              teamMembers={teamMembers}
              onEdit={() => {
                setEditingProject(selectedProject)
                setIsProjectModalOpen(true)
              }}
              onDelete={handleDeleteProject}
              onGenerateReport={() => setIsReportModalOpen(true)}
              onToggleClosed={handleToggleProjectClosed} // Added toggle closed handler
            />

            <div className="border-b border-border mb-4 md:mb-6 -mx-4 md:mx-0 px-4 md:px-0">
              <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                {[
                  { id: "tasks", label: "Tareas", icon: CheckCircle2Icon },
                  { id: "resources", label: "Recursos", icon: BoxIcon },
                  { id: "budget", label: "Presupuesto", icon: DollarSignIcon },
                  { id: "team", label: "Equipo", icon: UsersIcon },
                ].map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-3 md:px-4 py-2 md:py-3 border-b-2 transition-colors whitespace-nowrap text-sm md:text-base ${
                        activeTab === tab.id
                          ? "border-primary text-foreground font-medium"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {activeTab === "tasks" && (
              <TaskList
                tasks={projectTasks}
                resources={resources}
                assignments={resourceAssignments}
                filter={taskFilter}
                onFilterChange={setTaskFilter}
                onAddTask={() => {
                  setEditingTask(undefined)
                  setIsTaskModalOpen(true)
                }}
                onEditTask={(task) => {
                  setEditingTask(task)
                  setIsTaskModalOpen(true)
                }}
                onDeleteTask={handleDeleteTask}
                isProjectClosed={isProjectClosed} // Pass closed status
              />
            )}

            {activeTab === "resources" && (
              <ResourceList
                resources={resources}
                assignments={resourceAssignments}
                tasks={projectTasks}
                onAssignResource={() => setIsResourceModalOpen(true)}
                onRemoveAssignment={handleRemoveResourceAssignment}
                onAddResource={() => {
                  setEditingResource(undefined)
                  setIsResourceFormModalOpen(true)
                }}
                onEditResource={(resource) => {
                  setEditingResource(resource)
                  setIsResourceFormModalOpen(true)
                }}
                onDeleteResource={handleDeleteResource}
                onUpdateAssignment={handleUpdateAssignment}
              />
            )}

            {activeTab === "budget" && (
              <BudgetOverview
                project={selectedProject}
                tasks={projectTasks}
                resources={resources}
                assignments={resourceAssignments}
              />
            )}

            {activeTab === "team" && <TeamList teamMembers={teamMembers} tasks={projectTasks} />}
          </div>
        </main>
      </div>

      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false)
          setEditingProject(undefined)
        }}
        title={editingProject ? "Editar Proyecto" : "Crear Nuevo Proyecto"}
      >
        <ProjectForm
          project={editingProject}
          teamMembers={teamMembers}
          onSave={handleSaveProject}
          onCancel={() => {
            setIsProjectModalOpen(false)
            setEditingProject(undefined)
          }}
        />
      </Modal>

      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false)
          setEditingTask(undefined)
        }}
        title={editingTask ? "Editar Tarea" : "Crear Nueva Tarea"}
      >
        <TaskForm
          task={editingTask}
          projectId={selectedProjectId}
          project={selectedProject}
          teamMembers={teamMembers}
          resources={resources}
          assignments={resourceAssignments}
          tasks={tasks}
          onSave={handleSaveTask}
          onCancel={() => {
            setIsTaskModalOpen(false)
            setEditingTask(undefined)
          }}
        />
      </Modal>

      <Modal
        isOpen={isResourceFormModalOpen}
        onClose={() => {
          setIsResourceFormModalOpen(false)
          setEditingResource(undefined)
        }}
        title={editingResource ? "Editar Recurso" : "Crear Nuevo Recurso"}
      >
        <ResourceForm
          resource={editingResource}
          onSave={handleSaveResource}
          onCancel={() => {
            setIsResourceFormModalOpen(false)
            setEditingResource(undefined)
          }}
        />
      </Modal>

      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="" size="large">
        <WeeklyReport
          project={selectedProject}
          tasks={projectTasks}
          resources={resources}
          assignments={resourceAssignments}
        />
      </Modal>
    </div>
  )
}

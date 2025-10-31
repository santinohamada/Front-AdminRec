"use client"

import { useState, useEffect, useMemo } from "react"
import { CheckCircle2Icon, BoxIcon, DollarSignIcon, UsersIcon } from "lucide-react"

// --- CAMBIOS DE IMPORTACIÓN ---
// Eliminamos tu Modal personalizado
// import { Modal } from "@/components/modal";
// Agregamos los componentes de Dialog de Shadcn/UI
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// --- FIN CAMBIOS DE IMPORTACIÓN ---

import { TeamList } from "@/components/team-list"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

import type { Task, ResourceAssignment, Project, UUID } from "@/lib/project-types"
import { useProjectStore } from "@/store/projectStore"
import { ProjectSkeleton } from "@/components/project/project-skeleton"
import { ProjectList } from "@/components/project/project-list"
import { ProjectHeader } from "@/components/project/project-header"
import { TaskList } from "@/components/task/task-list"
import ResourceAssignmentList from "@/components/resourceAssignment/resourceAssignment-list"
import { BudgetOverview } from "@/components/budget-overview"
import { ProjectForm } from "@/components/project/project-form"
import { TaskForm } from "@/components/task/task-form"

export default function ProjectManagementSystem() {
  const {
    projects,
    tasks,
    resources,
    teamMembers: allTeamMembers,
    resourceAssignments,
    isLoading,
    createProject,
    updateProject,
    deleteProject,
    toggleProjectStatus,
    createTask,
    updateTask,
    deleteTask,
    error,
    deleteAssignment,
    updateAssignment,
    createAssignment,
    init,
    getResourcesByProject,
    getTeamMembersByProject,
  } = useProjectStore()

  useEffect(() => {
    init()
  }, [init])

  // UI state
  const [selectedProjectId, setSelectedProjectId] = useState<UUID | null>(null)
  const [activeTab, setActiveTab] = useState<"tasks" | "assignments" | "budget" | "team">("tasks")
  const [taskFilter, setTaskFilter] = useState<"all" | "completed" | "in-progress">("all")
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Project modals / edit state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | undefined>()

  // Task modals / edit state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()

  // Assignment modal (create / edit ResourceAssignment)
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<ResourceAssignment | undefined>()

  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  // (El resto de tus hooks y lógica permanecen igual... )
  // Select first project when loaded
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId])

  // Selectores derivados
  const selectedProject = useMemo(() => projects.find((p) => p.id === selectedProjectId), [projects, selectedProjectId])

  const projectTasks = useMemo(
    () => tasks.filter((t) => t.project_id === selectedProjectId),
    [tasks, selectedProjectId],
  )

  // Filtrar asignaciones pertenecientes al proyecto mediante task_id
  const projectAssignments = resourceAssignments.filter((a) => projectTasks.some((t) => t.id === a.task_id))
  
  console.log(projectAssignments,selectedProject)
  const isProjectClosed = selectedProject?.status === "closed"

  const projectTeamMembers = useMemo(() => {
    if (!selectedProjectId) return []
    return getTeamMembersByProject(selectedProjectId)
  }, [selectedProjectId, getTeamMembersByProject])

  const projectResources = useMemo(() => {
    if (!selectedProjectId) return []
    return getResourcesByProject(selectedProjectId)
  }, [selectedProjectId, getResourcesByProject])

  // --- Handlers ---

  const handleSaveProject = async (projectData: Omit<Project, "id"> | Project) => {
    const savedProject = await ("id" in projectData
      ? updateProject(projectData as Project)
      : createProject(projectData))
    if (savedProject) {
      if (!("id" in projectData)) setSelectedProjectId(savedProject.id)
      setIsProjectModalOpen(false)
      setEditingProject(undefined)
    }
  }

  const handleDeleteProject = async () => {
    if (!selectedProject) return
    if (
      confirm(
        `¿Estás seguro de que quieres eliminar "${selectedProject.name}"? Esto también eliminará tareas y asignaciones.`,
      )
    ) {
      const oldProjects = projects.filter((p) => p.id !== selectedProject.id)
      await deleteProject(selectedProject.id)
      if (oldProjects.length > 0) setSelectedProjectId(oldProjects[0].id)
      else setSelectedProjectId(null)
    }
  }

  const handleToggleProjectClosed = () => {
    if (!selectedProject) return
    const action = selectedProject.status === "closed" ? "reabrir" : "cerrar"
    if (confirm(`¿Estás seguro de que quieres ${action} este proyecto?`)) {
      toggleProjectStatus(selectedProject)
    }
  }

  const handleSaveTask = async (
    taskData: Omit<Task, "id"> | Task,
    resourceAssignments?: Omit<ResourceAssignment, "id" | "task_id">[],
  ) => {
    const dataToSave = { ...taskData, project_id: taskData.project_id || selectedProjectId }
    const savedTask = await ("id" in dataToSave
      ? updateTask(dataToSave as Task, resourceAssignments || [])
      : createTask(dataToSave as Task, resourceAssignments || []))
    if (savedTask) {
      setIsTaskModalOpen(false)
      setEditingTask(undefined)
    }
  }

  const handleDeleteTask = (taskId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta tarea?")) {
      deleteTask(taskId)
    }
  }

  const handleRemoveAssignment = (assignmentId: string) => {
    if (confirm("¿Eliminar esta asignación de recurso?")) {
      deleteAssignment(assignmentId)
    }
  }

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId)
    setIsMobileSidebarOpen(false)
  }

  // --- renderizado principal ---
  if (isLoading) return <ProjectSkeleton />

  if (error) {
    return (
      <div className="min-h-screen bg-background text-destructive flex items-center justify-center">
        Error: {error.message}
      </div>
    )
  }

  if (!selectedProject) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col gap-4 items-center justify-center p-8">
        <p className="text-xl">
          No hay <strong>proyectos</strong> seleccionados.
        </p>
        <Button
          onClick={() => {
            setEditingProject(undefined)
            setIsProjectModalOpen(true)
          }}
        >
          Crear un Proyecto
        </Button>
        {/* Aquí también usamos el Dialog para el primer proyecto */}
        <Dialog
          open={isProjectModalOpen}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setIsProjectModalOpen(false)
              setEditingProject(undefined)
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProject ? "Editar Proyecto" : "Crear Nuevo Proyecto"}</DialogTitle>
            </DialogHeader>
            <ProjectForm
              project={editingProject}
              teamMembers={allTeamMembers}
              onSave={handleSaveProject}
              onCancel={() => {
                setIsProjectModalOpen(false)
                setEditingProject(undefined)
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className=" text-foreground">
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
          className={`fixed md:relative inset-y-0 left-0 z-50 md:z-0 transform transition-transform duration-300 ease-in-out ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
        >
          <ProjectList
            projects={projects}
            tasks={tasks}
            selectedProjectId={selectedProjectId || projects[0]?.id}
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
              teamMembers={allTeamMembers}
              onEdit={() => {
                setEditingProject(selectedProject)
                setIsProjectModalOpen(true)
              }}
              onDelete={handleDeleteProject}
              onToggleClosed={handleToggleProjectClosed}
            />

            <div className="border-b border-border mb-4 md:mb-6 -mx-4 md:mx-0 px-4 md:px-0">
              <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                {[
                  { id: "tasks", label: "Tareas", icon: CheckCircle2Icon },
                  { id: "assignments", label: "Asignaciones", icon: BoxIcon },
                  { id: "budget", label: "Presupuesto", icon: DollarSignIcon },
                  { id: "team", label: "Equipo", icon: UsersIcon },
                ].map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-3 md:px-4 py-2 md:py-3 border-b-2 transition-colors whitespace-nowrap text-sm md:text-base ${activeTab === tab.id ? "border-primary text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
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
                isProjectClosed={isProjectClosed}
              />
            )}

            {activeTab === "assignments" && (
              <ResourceAssignmentList
              key={selectedProjectId}
                resources={projectResources}
                assignments={projectAssignments}
                tasks={projectTasks}
              
              />
            )}

            {activeTab === "budget" && (
              <BudgetOverview
                project={selectedProject}
                tasks={projectTasks}
                resources={projectResources}
                assignments={resourceAssignments}
              />
            )}

            {activeTab === "team" && <TeamList teamMembers={projectTeamMembers} tasks={projectTasks} />}
          </div>
        </main>
      </div>

      {/* --- MODALES ACTUALIZADOS CON SHADCN/UI --- */}

      {/* 1. Modal de Proyecto */}
      <Dialog
        open={isProjectModalOpen}
        onOpenChange={(isOpen) => {
          setIsProjectModalOpen(isOpen)
          if (!isOpen) {
            setEditingProject(undefined)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProject ? "Editar Proyecto" : "Crear Nuevo Proyecto"}</DialogTitle>
          </DialogHeader>
          <ProjectForm
            project={editingProject}
            teamMembers={allTeamMembers}
            onSave={handleSaveProject}
            onCancel={() => {
              setIsProjectModalOpen(false)
              setEditingProject(undefined)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* 2. Modal de Tarea */}
      <Dialog
        open={isTaskModalOpen}
        onOpenChange={(isOpen) => {
          setIsTaskModalOpen(isOpen)
          if (!isOpen) {
            setEditingTask(undefined)
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Editar Tarea" : "Crear Nueva Tarea"}</DialogTitle>
          </DialogHeader>
          <TaskForm
            task={editingTask}
            projectId={selectedProjectId || projects[0]?.id}
            project={selectedProject}
            teamMembers={allTeamMembers}
            resources={resources}
            assignments={resourceAssignments}
            tasks={tasks}
            onSave={handleSaveTask}
            onCancel={() => {
              setIsTaskModalOpen(false)
              setEditingTask(undefined)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

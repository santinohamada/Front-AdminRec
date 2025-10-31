"use client";

import { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2Icon,
  BoxIcon,
  DollarSignIcon,
  UsersIcon,
  FolderKanbanIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertDialogCustom } from "@/components/ui/alert-dialog-custom";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { TeamList } from "@/components/team-list";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

import type {
  Task,
  ResourceAssignment,
  Project,
  UUID,
} from "@/lib/project-types";
import { useProjectStore } from "@/store/projectStore";
import { ProjectSkeleton } from "@/components/project/project-skeleton";
import { ProjectList } from "@/components/project/project-list";
import { ProjectHeader } from "@/components/project/project-header";
import { TaskList } from "@/components/task/task-list";
import ResourceAssignmentList from "@/components/resourceAssignment/resourceAssignment-list";
import { BudgetOverview } from "@/components/budget-overview";
import { ProjectForm } from "@/components/project/project-form";
import { TaskForm } from "@/components/task/task-form";

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
    init,
    getResourcesByProject,
    getTeamMembersByProject,
  } = useProjectStore();

  const { dialogState, confirm, closeDialog } = useConfirmDialog();

  useEffect(() => {
    init();
  }, [init]);

  // UI state
  const [selectedProjectId, setSelectedProjectId] = useState<UUID | null>(null);
  const [activeTab, setActiveTab] = useState<
    "tasks" | "assignments" | "budget" | "team"
  >("tasks");
  const [taskFilter, setTaskFilter] = useState<
    "all" | "completed" | "in-progress"
  >("all");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Project modals / edit state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();

  // Task modals / edit state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId),
    [projects, selectedProjectId]
  );

  const projectTasks = useMemo(
    () => tasks.filter((t) => t.project_id === selectedProjectId),
    [tasks, selectedProjectId]
  );

  const projectAssignments = resourceAssignments.filter((a) =>
    projectTasks.some((t) => t.id === a.task_id)
  );

  const isProjectClosed = selectedProject?.status === "closed";

  const projectTeamMembers = useMemo(() => {
    if (!selectedProjectId) return [];
    return getTeamMembersByProject(selectedProjectId);
  }, [selectedProjectId, getTeamMembersByProject]);

  const projectResources = useMemo(() => {
    if (!selectedProjectId) return [];
    return getResourcesByProject(selectedProjectId);
  }, [selectedProjectId, getResourcesByProject]);

  const handleSaveProject = async (
    projectData: Omit<Project, "id"> | Project
  ) => {
    const savedProject = await ("id" in projectData
      ? updateProject(projectData as Project)
      : createProject(projectData));
    if (savedProject) {
      if (!("id" in projectData)) setSelectedProjectId(savedProject.id);
      setIsProjectModalOpen(false);
      setEditingProject(undefined);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;
    const confirmed = await confirm({
      title: "Eliminar Proyecto",
      description: `¿Estás seguro de que quieres eliminar "${selectedProject.name}"? Esto también eliminará tareas y asignaciones.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      variant: "destructive",
    });

    if (confirmed) {
      const oldProjects = projects.filter((p) => p.id !== selectedProject.id);
      await deleteProject(selectedProject.id);
      if (oldProjects.length > 0) setSelectedProjectId(oldProjects[0].id);
      else setSelectedProjectId(null);
    }
  };

  const handleToggleProjectClosed = async () => {
    if (!selectedProject) return;
    const action = selectedProject.status === "closed" ? "reabrir" : "cerrar";
    const confirmed = await confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Proyecto`,
      description: `¿Estás seguro de que quieres ${action} este proyecto?`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: "Cancelar",
    });

    if (confirmed) {
      toggleProjectStatus(selectedProject);
    }
  };

  const handleSaveTask = async (
    taskData: Omit<Task, "id"> | Task,
    resourceAssignments?: Omit<ResourceAssignment, "id" | "task_id">[]
  ) => {
    const dataToSave = {
      ...taskData,
      project_id: taskData.project_id || selectedProjectId,
    };
    const savedTask = await ("id" in dataToSave
      ? updateTask(dataToSave as Task, resourceAssignments || [])
      : createTask(dataToSave as Task, resourceAssignments || []));
    if (savedTask) {
      setIsTaskModalOpen(false);
      setEditingTask(undefined);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const confirmed = await confirm({
      title: "Eliminar Tarea",
      description: "¿Estás seguro de que quieres eliminar esta tarea?",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      variant: "destructive",
    });

    if (confirmed) {
      deleteTask(taskId);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    const confirmed = await confirm({
      title: "Eliminar Asignación",
      description: "¿Eliminar esta asignación de recurso?",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      variant: "destructive",
    });

    if (confirmed) {
      deleteAssignment(assignmentId);
    }
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setIsMobileSidebarOpen(false);
  };

  if (isLoading) return <ProjectSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-background text-destructive flex items-center justify-center">
        Error: {error.message}
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col gap-4 items-center justify-center p-8">
        <p className="text-xl">
          No hay <strong>proyectos</strong> seleccionados.
        </p>
        <Button
          onClick={() => {
            setEditingProject(undefined);
            setIsProjectModalOpen(true);
          }}
        >
          Crear un Proyecto
        </Button>
        <Dialog
          open={isProjectModalOpen}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setIsProjectModalOpen(false);
              setEditingProject(undefined);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProject ? "Editar Proyecto" : "Crear Nuevo Proyecto"}
              </DialogTitle>
            </DialogHeader>
            <ProjectForm
              project={editingProject}
              teamMembers={allTeamMembers}
              onSave={handleSaveProject}
              onCancel={() => {
                setIsProjectModalOpen(false);
                setEditingProject(undefined);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="text-foreground">
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
          className={`fixed md:relative inset-y-0 left-0 z-50 md:z-0 transform transition-transform duration-300 ease-in-out ${
            isMobileSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }`}
        >
          <ProjectList
            projects={projects}
            tasks={tasks}
            selectedProjectId={selectedProjectId || projects[0]?.id}
            onSelectProject={handleSelectProject}
            onAddProject={() => {
              setEditingProject(undefined);
              setIsProjectModalOpen(true);
              setIsMobileSidebarOpen(false);
            }}
          />
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            <ProjectHeader
              project={selectedProject}
              teamMembers={allTeamMembers}
              onEdit={() => {
                setEditingProject(selectedProject);
                setIsProjectModalOpen(true);
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
                  const Icon = tab.icon;
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
                  );
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
                  setEditingTask(undefined);
                  setIsTaskModalOpen(true);
                }}
                onEditTask={(task) => {
                  setEditingTask(task);
                  setIsTaskModalOpen(true);
                }}
                onDeleteTask={handleDeleteTask}
                isProjectClosed={isProjectClosed}
              />
            )}

            {activeTab === "assignments" && (
              <ResourceAssignmentList
                key={selectedProjectId}
                projectId={selectedProjectId || projects[0]?.id}
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

            {activeTab === "team" && (
              <TeamList teamMembers={projectTeamMembers} tasks={projectTasks} />
            )}
          </div>
        </main>

        <motion.button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="md:hidden fixed bottom-6 right-6 z-30 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <FolderKanbanIcon className="h-6 w-6" />
        </motion.button>
      </div>

      <Dialog
        open={isProjectModalOpen}
        onOpenChange={(isOpen) => {
          setIsProjectModalOpen(isOpen);
          if (!isOpen) {
            setEditingProject(undefined);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProject ? "Editar Proyecto" : "Crear Nuevo Proyecto"}
            </DialogTitle>
          </DialogHeader>
          <ProjectForm
            project={editingProject}
            teamMembers={allTeamMembers}
            onSave={handleSaveProject}
            onCancel={() => {
              setIsProjectModalOpen(false);
              setEditingProject(undefined);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={isTaskModalOpen}
        onOpenChange={(isOpen) => {
          setIsTaskModalOpen(isOpen);
          if (!isOpen) {
            setEditingTask(undefined);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Editar Tarea" : "Crear Nueva Tarea"}
            </DialogTitle>
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
              setIsTaskModalOpen(false);
              setEditingTask(undefined);
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialogCustom
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
        onConfirm={dialogState.onConfirm}
        title={dialogState.title}
        description={dialogState.description}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        variant={dialogState.variant}
      />
    </div>
  );
}

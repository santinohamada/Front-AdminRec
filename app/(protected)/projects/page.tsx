"use client";

import { useState, useMemo, useEffect } from "react";
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
import { ProjectList } from "@/components/project/project-list";
import { ProjectHeader } from "@/components/project/project-header";
import { TaskList } from "@/components/task/task-list";
import ResourceAssignmentList from "@/components/resourceAssignment/resourceAssignment-list";
import { BudgetOverview } from "@/components/budget-overview";
import { TeamList } from "@/components/team-list";
import { ProjectForm } from "@/components/project/project-form";
import { TaskForm } from "@/components/task/task-form";
import { ProjectSkeleton } from "@/components/project/project-skeleton";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

// Hooks de React Query (como los definiste)
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from "@/hooks/useProjects"; // (ruta de ejemplo)
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from "@/hooks/useTasks"; // (ruta de ejemplo)
import { useResources } from "@/hooks/useResources"; // (ruta de ejemplo)
import { useTeam } from "@/hooks/useTeam"; // (ruta de ejemplo)
import { useAssignments } from "@/hooks/useAssignments"; // (ruta de ejemplo)

import type {
  Project,
  Task,
  ResourceAssignment,
  UUID,
  NewProject,
  NewTask,
  NewResourceAssignment, // Importado para el casteo en handleSaveTask
} from "@/lib/project-types";
import { useClient } from "@/hooks/useClient";

export default function ProjectManagementSystem() {
  const { dialogState, confirm, closeDialog } = useConfirmDialog();

  // --- UI State ---
  const [selectedProjectId, setSelectedProjectId] = useState<UUID | null>(null);
  const [activeTab, setActiveTab] = useState<
    "tasks" | "assignments" | "budget" | "team"
  >("tasks");
  const [taskFilter, setTaskFilter] = useState<
    "all" | "completed" | "in-progress"
  >("all");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();

  // --- Queries (Usando Hooks) ---
  const {
    data: projects = [],
    isLoading: loadingProjects,
    error: projectsError,
  } = useProjects();
  const { data: tasks = [], isLoading: loadingTasks } = useTasks();
  const { data: resources = [] } = useResources();
  const { data: teamMembers = [] } = useTeam();
  const {data: clients = []} = useClient()
  const { data: resourceAssignments = [] } = useAssignments();

  // --- Mutations (Usando Hooks) ---
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  // --- Estado Derivado (LÓGICA CORREGIDA) ---

  // 1. Selecciona el primer proyecto por defecto
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // 2. Encuentra el proyecto seleccionado
  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId),
    [projects, selectedProjectId]
  );

  // 3. Filtra las tareas del proyecto seleccionado
  const projectTasks = useMemo(
    () => tasks.filter((t) => t.project_id === selectedProjectId),
    [tasks, selectedProjectId]
  );

  // 4. Filtra las asignaciones de recursos de esas tareas
  const projectAssignments = useMemo(
    () =>
      resourceAssignments.filter((a) =>
        projectTasks.some((t) => t.id === a.task_id)
      ),
    [resourceAssignments, projectTasks] // Depende de projectTasks
  );

  // 5. (CORREGIDO) Encuentra los miembros del equipo del proyecto
  const projectTeamMembers = useMemo(() => {
    if (!selectedProject) return [];

    // Obtiene los IDs de los asignados a las tareas
    const taskAssigneeIds = new Set(projectTasks.map((t) => t.assignee_id));
    
    // Añade el ID del manager del proyecto
    const managerId = selectedProject.manager_id;
    if (managerId) {
      taskAssigneeIds.add(managerId);
    }

    // Filtra la lista completa de miembros del equipo
    return teamMembers.filter((tm) => taskAssigneeIds.has(tm.id));
  }, [teamMembers, projectTasks, selectedProject]);

  // 6. (CORREGIDO) Encuentra los recursos del proyecto
  const projectResources = useMemo(() => {
    // Obtiene los IDs de los recursos desde las asignaciones del proyecto
    const projectResourceIds = new Set(
      projectAssignments.map((a) => a.resource_id)
    );

    // Filtra la lista completa de recursos
    return resources.filter((r) => projectResourceIds.has(r.id));
  }, [resources, projectAssignments]); // Depende de projectAssignments

  // 7. Estado del proyecto
  const isProjectClosed = selectedProject?.status === "closed";


  // --- Handlers (Ajustados para los hooks) ---
  const handleSelectProject = (projectId: UUID) => {
    setSelectedProjectId(projectId);
    setIsMobileSidebarOpen(false);
  };

  const handleSaveProject = async (
    projectData: Omit<Project, "id"> | Project
  ) => {
    if ("id" in projectData) {
      await updateProjectMutation.mutateAsync(projectData);
    } else {
      await createProjectMutation.mutateAsync(projectData as NewProject, {
        onSuccess: (newProject) => {
          // onSuccess específico aquí para actualizar la UI local
          setSelectedProjectId(newProject.id);
        },
      });
    }
    setIsProjectModalOpen(false);
    setEditingProject(undefined);
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
    if (confirmed && selectedProject) {
      await deleteProjectMutation.mutateAsync(selectedProject.id, {
        onSuccess: () => {
          // Lógica de la UI: seleccionar otro proyecto
          const remainingProjects = projects.filter(p => p.id !== selectedProject.id);
          setSelectedProjectId(remainingProjects[0]?.id || null);
        }
      });
    }
  };

  const handleToggleProjectClosed = async () => {
    if (!selectedProject) return;
    const newStatus = selectedProject.status === "closed" ? "active" : "closed";
    const action = newStatus === "active" ? "reabrir" : "cerrar";

    const confirmed = await confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Proyecto`,
      description: `¿Estás seguro de que quieres ${action} este proyecto?`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: "Cancelar",
    });

    if (confirmed) {
      await updateProjectMutation.mutateAsync({
        ...selectedProject,
        status: newStatus,
      });
    }
  };

  const handleSaveTask = async (
    taskData: Omit<Task, "id"> | Task,
    assignments: Omit<ResourceAssignment, "id" | "task_id">[] = []
  ) => {
    const dataToSave = {
      ...taskData,
      project_id: taskData.project_id || selectedProjectId,
    };

    const formattedAssignments = assignments as Omit<
      NewResourceAssignment,
      "task_id"
    >[];

    if ("id" in dataToSave) {
      await updateTaskMutation.mutateAsync({
        id: dataToSave.id,
        data: dataToSave as Task,
        assignments: formattedAssignments,
      });
    } else {
      await createTaskMutation.mutateAsync({
        data: dataToSave as NewTask,
        assignments: formattedAssignments,
      });
    }
    setIsTaskModalOpen(false);
    setEditingTask(undefined);
  };

  const handleDeleteTask = async (taskId: UUID) => {
    const confirmed = await confirm({
      title: "Eliminar Tarea",
      description: "¿Estás seguro de que quieres eliminar esta tarea?",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      variant: "destructive",
    });
    if (confirmed) await deleteTaskMutation.mutateAsync(taskId);
  };

  // --- Render ---

  if (loadingProjects || loadingTasks) return <ProjectSkeleton />;

  if (projectsError) {
    return (
      <div className="min-h-screen bg-background text-destructive flex items-center justify-center">
        Error: {(projectsError as Error).message}
      </div>
    );
  }

  if (!selectedProject && !loadingProjects) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col gap-4 items-center justify-center p-8">
        <p className="text-xl">
          No hay <strong>proyectos</strong> creados.
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
            } else {
              setIsProjectModalOpen(true);
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
              clients={clients}
              teamMembers={teamMembers}
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
  
  // Si selectedProject es undefined pero hay proyectos (ej. después de borrar)
  // Este es un estado intermedio que el useEffect debe corregir, pero por si acaso:
  if (!selectedProject) {
     return <ProjectSkeleton />;
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
            clients={clients}
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
              teamMembers={teamMembers} // El formulario de edición puede necesitar TODOS los miembros
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
                  {
                    id: "assignments",
                    label: "Asignaciones",
                    icon: BoxIcon,
                  },
                  {
                    id: "budget",
                    label: "Presupuesto",
                    icon: DollarSignIcon,
                  },
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

            {/* Renderizado de Pestañas con datos derivados CORREGIDOS */}
            
            {activeTab === "tasks" && (
              <TaskList
                tasks={projectTasks} // OK
                resources={resources} // El formulario de tareas necesita TODOS los recursos
                assignments={resourceAssignments} // Pasa todas las asignaciones
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
                // Este componente probablemente hace sus propios filtros
                // o podría recibir 'projectAssignments' y 'projectResources'
              />
            )}

            {activeTab === "budget" && (
              <BudgetOverview
                project={selectedProject} // OK
                tasks={projectTasks} // OK
                resources={projectResources} // CORREGIDO
                assignments={projectAssignments} // OK
              />
            )}

            {activeTab === "team" && (
              <TeamList
                teamMembers={projectTeamMembers} // CORREGIDO
                tasks={projectTasks} // OK
              />
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

      {/* Modales */}
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
            clients={clients}
            teamMembers={teamMembers} // El formulario necesita TODOS los miembros para el selector de 'manager'
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
            teamMembers={teamMembers} // El formulario necesita TODOS los miembros para el selector de 'assignee'
            resources={resources} // El formulario necesita TODOS los recursos
            assignments={resourceAssignments} // Pasa todas las asignaciones
            tasks={tasks} // Pasa todas las tareas (para dependencias, etc.)
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
"use client";

import { useState, useMemo, useEffect } from "react";
import {
  CheckCircle2Icon,
  BoxIcon,
  DollarSignIcon,
  UsersIcon,
  MenuIcon,
  XIcon,
} from "lucide-react";
import { ProjectList } from "@/components/project-list";
import { ProjectHeader } from "@/components/project-header";
import { ProjectForm } from "@/components/project-form";
import { TaskList } from "@/components/task-list";
import { TaskForm } from "@/components/task-form";
import { BudgetOverview } from "@/components/budget-overview";
import { ResourceList } from "@/components/resource-list";
import { ResourceForm } from "@/components/resource-form"; // Asumo que este componente existe
import { TeamList } from "@/components/team-list";
import { WeeklyReport } from "@/components/weekly-report";
import { Modal } from "@/components/modal";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

import type {
  Task,
  ResourceAssignment,
  Project,
  Resource,
  NewTask,
  NewResource,
} from "@/lib/project-types";
import { ResourceAssignmentForm } from "@/components/resource-assignment-form";
import { useProjectStore } from "@/store/projectStore";

export default function ProjectManagementSystem() {
  // --- Hook de Carga y Estado Global ---
  // Obtiene todos los arrays de datos y el estado de carga/error
  const {
    projects,
    tasks,
    resources,
    teamMembers,
    resourceAssignments,
    isLoading,
    createProject,
    updateProject,
    deleteProject,
    toggleProjectStatus,
    createTask,
    updateTask,
    deleteTask,
    createResource,
    updateResource,
    deleteResource,
    error,
    deleteAssignment,
    updateAssignment,
    init,
  } = useProjectStore();

  useEffect(() => {
    const handleInit = async () => {
      init();
    };
    handleInit();
  }, []);
  // --- Estado de la UI (sin cambios) ---
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<
    "tasks" | "resources" | "budget" | "team"
  >("tasks");
  const [taskFilter, setTaskFilter] = useState<
    "all" | "completed" | "in-progress"
  >("all");

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [isResourceFormModalOpen, setIsResourceFormModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<
    Resource | undefined
  >();
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // --- Sincronización de UI y Datos (sin cambios) ---
  useMemo(() => {
    if (selectedProjectId === null && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // --- Selectores y Derivados (sin cambios) ---
  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId),
    [projects, selectedProjectId]
  );
  const projectTasks = useMemo(
    () => tasks.filter((t) => t.project_id === selectedProjectId),
    [tasks, selectedProjectId]
  );
  const isProjectClosed = selectedProject?.status === "closed";

  // --- Handlers de UI (Wrappers) ---
  // Ahora llaman a los hooks de acciones (createProject, deleteTask, etc.)

  const handleSaveProject = async (
    projectData: Omit<Project, "id"> | Project
  ) => {
    // La lógica de API está en el hook/store
    const savedProject = await ("id" in projectData
      ? updateProject(projectData as Project)
      : createProject(projectData));

    if (savedProject) {
      if (!("id" in projectData)) {
        setSelectedProjectId(savedProject.id); // Seleccionar nuevo proyecto
      }
      setIsProjectModalOpen(false);
      setEditingProject(undefined);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    if (
      confirm(
        `¿Estás seguro de que quieres eliminar "${selectedProject.name}"? Esto también eliminará todas las tareas y asignaciones de recursos asociadas.`
      )
    ) {
      // El 'projects' de useProjectData es el de la renderización actual (el antiguo)
      const oldProjects = projects.filter((p) => p.id !== selectedProject.id);

      await deleteProject(selectedProject.id); // El store se actualiza

      // La UI se actualiza. `oldProjects` se usa para encontrar el siguiente proyecto
      if (oldProjects.length > 0) {
        setSelectedProjectId(oldProjects[0].id);
      } else {
        setSelectedProjectId(null);
      }
    }
  };

  const handleToggleProjectClosed = () => {
    if (!selectedProject) return;

    const action = selectedProject.status === "closed" ? "reabrir" : "cerrar";
    if (confirm(`¿Estás seguro de que quieres ${action} este proyecto?`)) {
      toggleProjectStatus(selectedProject); // Llama a la acción del hook
    }
  };

  const handleSaveTask = async (
    taskData: Omit<Task, "id"> | Task,
    resourceAssignments?: Omit<ResourceAssignment, "id" | "task_id">[]
  ) => {
    const savedTask = await ("id" in taskData
      ? updateTask(taskData as Task, resourceAssignments || [])
      : createTask(taskData as NewTask, resourceAssignments || []));

    if (savedTask) {
      setIsTaskModalOpen(false);
      setEditingTask(undefined);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta tarea?")) {
      deleteTask(taskId);
    }
  };

  const handleSaveResource = async (
    resourceData: Omit<Resource, "id"> | Resource
  ) => {
    const savedResource = await ("id" in resourceData
      ? updateResource(resourceData as Resource)
      : createResource(resourceData as NewResource));

    if (savedResource) {
      setIsResourceFormModalOpen(false);
      setEditingResource(undefined);
    }
  };

  const handleDeleteResource = (resourceId: string) => {
    const hasAssignments = resourceAssignments.some(
      (a) => a.resource_id === resourceId
    );
    let confirmed = false;

    if (hasAssignments) {
      confirmed = confirm(
        "Este recurso tiene asignaciones. ¿Estás seguro de que quieres eliminarlo? Esto también eliminará todas sus asignaciones."
      );
    } else {
      confirmed = confirm(
        "¿Estás seguro de que quieres eliminar este recurso?"
      );
    }

    if (confirmed) {
      deleteResource(resourceId);
    }
  };

  const handleRemoveResourceAssignment = (assignmentId: string) => {
    if (confirm("¿Eliminar esta asignación de recurso?")) {
      deleteAssignment(assignmentId);
    }
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setIsMobileSidebarOpen(false);
  };

  // --- Renderizado (sin cambios en el JSX) ---

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        Cargando datos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-destructive flex items-center justify-center">
        Error: {error.message}
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div>
          <p>No hay proyectos seleccionados.</p>
          <Button
            onClick={() => {
              setEditingProject(undefined);
              setIsProjectModalOpen(true);
            }}
          >
            Crear un Proyecto
          </Button>
          {/* ... El modal de proyecto se renderiza abajo ... */}
        </div>
      </div>
    );
  }

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
            {isMobileSidebarOpen ? (
              <XIcon className="h-5 w-5" />
            ) : (
              <MenuIcon className="h-5 w-5" />
            )}
          </Button>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              Sistema de Gestión de Proyectos
            </h1>
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
            ${
              isMobileSidebarOpen
                ? "translate-x-0"
                : "-translate-x-full md:translate-x-0"
            }
          `}
        >
          <ProjectList
            projects={projects}
            tasks={tasks}
            selectedProjectId={selectedProjectId ?? "proj-1"}
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
              teamMembers={teamMembers}
              onEdit={() => {
                setEditingProject(selectedProject);
                setIsProjectModalOpen(true);
              }}
              onDelete={handleDeleteProject}
              onGenerateReport={() => setIsReportModalOpen(true)}
              onToggleClosed={handleToggleProjectClosed}
            />

            <div className="border-b border-border mb-4 md:mb-6 -mx-4 md:mx-0 px-4 md:px-0">
              <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                {[
                  { id: "tasks", label: "Tareas", icon: CheckCircle2Icon },
                  { id: "resources", label: "Recursos", icon: BoxIcon },
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

            {activeTab === "resources" && (
              <ResourceList
                resources={resources}
                assignments={resourceAssignments}
                tasks={projectTasks}
                onAssignResource={() => setIsResourceModalOpen(true)}
                onRemoveAssignment={handleRemoveResourceAssignment}
                onAddResource={() => {
                  setEditingResource(undefined);
                  setIsResourceFormModalOpen(true);
                }}
                onEditResource={(resource) => {
                  setEditingResource(resource);
                  setIsResourceFormModalOpen(true);
                }}
                onDeleteResource={handleDeleteResource}
                onUpdateAssignment={updateAssignment} // Pasa la acción del hook
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

            {activeTab === "team" && (
              <TeamList teamMembers={teamMembers} tasks={projectTasks} />
            )}
          </div>
        </main>
      </div>

      {/* --- Modales --- */}
      {/* El JSX de los modales no cambia, solo los handlers que se les pasa */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setEditingProject(undefined);
        }}
        title={editingProject ? "Editar Proyecto" : "Crear Nuevo Proyecto"}
      >
        <ProjectForm
          project={editingProject}
          teamMembers={teamMembers}
          onSave={handleSaveProject}
          onCancel={() => {
            setIsProjectModalOpen(false);
            setEditingProject(undefined);
          }}
        />
      </Modal>

      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(undefined);
        }}
        title={editingTask ? "Editar Tarea" : "Crear Nueva Tarea"}
      >
        <TaskForm
          task={editingTask}
          projectId={selectedProjectId ?? "proj-1"}
          project={selectedProject}
          teamMembers={teamMembers}
          resources={resources}
          assignments={resourceAssignments}
          tasks={tasks}
          onSave={handleSaveTask}
          onCancel={() => {
            setIsTaskModalOpen(false);
            setEditingTask(undefined);
          }}
        />
      </Modal>

      <Modal
        isOpen={isResourceFormModalOpen}
        onClose={() => {
          setIsResourceFormModalOpen(false);
          setEditingResource(undefined);
        }}
        title={editingResource ? "Editar Recurso" : "Crear Nuevo Recurso"}
      >
        <ResourceForm
          resource={editingResource}
          onSave={handleSaveResource}
          onCancel={() => {
            setIsResourceFormModalOpen(false);
            setEditingResource(undefined);
          }}
        />
      </Modal>

      <Modal
        isOpen={isResourceModalOpen}
        onClose={() => setIsResourceModalOpen(false)}
        title="Asignar Recurso"
      >
        <ResourceAssignmentForm
          tasks={projectTasks}
          resources={resources}
          assignments={resourceAssignments}
          onAssign={(data) => {
            console.log("Asignando recurso:", data);
            setIsResourceModalOpen(false);
          }}
          onCancel={() => setIsResourceModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title=""
        size="large"
      >
        <WeeklyReport
          project={selectedProject}
          tasks={projectTasks}
          resources={resources}
          assignments={resourceAssignments}
        />
      </Modal>
    </div>
  );
}

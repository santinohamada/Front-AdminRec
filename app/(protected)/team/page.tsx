"use client";

import { useState, useMemo, useCallback } from "react"; // CAMBIO: Añadido useCallback
// CAMBIO: Se eliminó useProjectStore
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertDialogCustom } from "@/components/ui/alert-dialog-custom";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { TeamMemberForm } from "@/components/team/team-member-form";
import {
  PlusIcon,
  SearchIcon,
  UsersIcon,
  BriefcaseIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton"; // CAMBIO: Añadido Skeleton

// CAMBIO: Se importaron los hooks de React Query
import {
  useTeam,
  useCreateTeamMember,
  useUpdateTeamMember,
  useDeleteTeamMember,
} from "@/hooks/useTeam"; // (Ajusta la ruta si es necesario)
import { useTasks } from "@/hooks/useTasks"; // (Ajusta la ruta si es necesario)

// CAMBIO: Se importaron los tipos necesarios
import type { TeamMember, NewTeamMember } from "@/lib/project-types";

export default function TeamPage() {
  // CAMBIO: Refactorizado para usar React Query
  const {
    data: teamMembers = [],
    isLoading: isLoadingTeam,
    isError: isErrorTeam,
    error: teamError,
  } = useTeam();
  const {
    data: tasks = [],
    isLoading: isLoadingTasks,
    isError: isErrorTasks,
    error: tasksError,
  } = useTasks();

  const createTeamMemberMutation = useCreateTeamMember();
  const updateTeamMemberMutation = useUpdateTeamMember();
  const deleteTeamMemberMutation = useDeleteTeamMember();

  const { dialogState, confirm, closeDialog } = useConfirmDialog();

  // El estado local de la UI no cambia
  const [searchQuery, setSearchQuery] = useState("");
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | undefined>();

  // CAMBIO: Lógica del store recreada como useCallback
  const getTeamMemberWorkload = useCallback(
    (memberId: string) => {
      return tasks
        .filter((t) => t.assignee_id === memberId)
        .reduce((sum, t) => sum + (t.estimated_hours ?? 0), 0);
    },
    [tasks]
  );

  const getMemberTaskCount = useCallback(
    (memberId: string) => {
      return tasks.filter((t) => t.assignee_id === memberId).length;
    },
    [tasks]
  );

  const getMemberCompletedTasks = useCallback(
    (memberId: string) => {
      return tasks.filter(
        (t) => t.assignee_id === memberId && t.status === "completed"
      ).length;
    },
    [tasks]
  );

  // useMemo no cambia, pero ahora depende de los datos de React Query
  const filteredMembers = useMemo(() => {
    return teamMembers.filter((member) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        member.name.toLowerCase().includes(searchLower) ||
        member.email.toLowerCase().includes(searchLower) ||
        member.dni.toLowerCase().includes(searchLower)
      );
    });
  }, [teamMembers, searchQuery]);

  // CAMBIO: La dependencia de 'getTeamMemberWorkload' ahora es el hook recreado
  const stats = useMemo(() => {
    const totalMembers = teamMembers.length;
    const totalAssignments = tasks.filter((t) => t.assignee_id).length;
    const avgWorkload =
      teamMembers.length > 0
        ? teamMembers.reduce((sum, m) => sum + getTeamMemberWorkload(m.id), 0) /
          teamMembers.length
        : 0;

    return { totalMembers, totalAssignments, avgWorkload };
  }, [teamMembers, tasks, getTeamMemberWorkload]);

  // CAMBIO: Refactorizado para usar mutaciones de React Query
  const handleSaveMember = async (
    memberData: Omit<TeamMember, "id"> | TeamMember
  ) => {
    try {
      if ("id" in memberData) {
        await updateTeamMemberMutation.mutateAsync(memberData as TeamMember);
      } else {
        await createTeamMemberMutation.mutateAsync(memberData as NewTeamMember);
      }
      setIsTeamModalOpen(false);
      setEditingMember(undefined);
    } catch (error) {
      console.error("Error al guardar el miembro:", error);
      // Opcional: Mostrar un toast de error
    }
  };

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setIsTeamModalOpen(true);
  };

  // CAMBIO: Refactorizado para usar mutaciones de React Query
  const handleDeleteMember = async (member: TeamMember) => {
    const memberTasks = tasks.filter((t) => t.assignee_id === member.id);
    let confirmed = false;

    if (memberTasks.length > 0) {
      confirmed = await confirm({
        title: "Eliminar Miembro del Equipo",
        description: `${member.name} tiene ${memberTasks.length} tarea(s) asignada(s). ¿Estás seguro de que quieres eliminar este miembro? Las tareas quedarán sin asignar.`,
        confirmText: "Eliminar",
        cancelText: "Cancelar",
        variant: "destructive",
      });
    } else {
      confirmed = await confirm({
        title: "Eliminar Miembro del Equipo",
        description: `¿Estás seguro de que quieres eliminar a ${member.name}?`,
        confirmText: "Eliminar",
        cancelText: "Cancelar",
        variant: "destructive",
      });
    }

    if (confirmed) {
      try {
        await deleteTeamMemberMutation.mutateAsync(member.id);
      } catch (error) {
        console.error("Error al eliminar el miembro:", error);
      }
    }
  };

  // CAMBIO: Manejo de estados de carga y error
  const isLoading = isLoadingTeam || isLoadingTasks;
  const isError = isErrorTeam || isErrorTasks;
  const error = teamError || tasksError;

  if (isLoading) {
    return <TeamPageSkeleton />;
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8 flex items-center justify-center">
        <Card className="p-12 text-center">
          <h3 className="text-lg font-semibold mb-2 text-destructive">
            Error al cargar los datos
          </h3>
          <p className="text-muted-foreground">
            {(error as Error)?.message || "Inténtalo de nuevo más tarde."}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* --- Header --- */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Equipo</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona todos los miembros del equipo
            </p>
          </div>
          <Button
            onClick={() => setIsTeamModalOpen(true)}
            className="w-full md:w-auto"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Nuevo Miembro
          </Button>
        </div>

        {/* --- Stats Cards --- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UsersIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Miembros</p>
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BriefcaseIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Asignaciones Activas
                </p>
                <p className="text-2xl font-bold">{stats.totalAssignments}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BriefcaseIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Carga Promedio</p>
                <p className="text-2xl font-bold">
                  {stats.avgWorkload.toFixed(0)}h
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* --- Filter Bar --- */}
        <Card className="p-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o DNI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* --- Member List --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const taskCount = getMemberTaskCount(member.id);
            const completedTasks = getMemberCompletedTasks(member.id);
            const workload = getTeamMemberWorkload(member.id);
            const completionRate =
              taskCount > 0 ? (completedTasks / taskCount) * 100 : 0;

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-5 hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg shrink-0">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">
                          {member.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          DNI: {member.dni}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MailIcon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <PhoneIcon className="w-4 h-4 shrink-0" />
                        <span>{member.phone}</span>
                      </div>
                      {member.domicilio && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPinIcon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{member.domicilio}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Tareas asignadas:
                        </span>
                        <span className="font-medium">{taskCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Completadas:
                        </span>
                        <span className="font-medium">
                          {completedTasks} ({completionRate.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Carga de trabajo:
                        </span>
                        <span className="font-medium">
                          {workload.toFixed(0)}h
                        </span>
                      </div>
                    </div>

                    {taskCount > 0 && (
                      <div className="space-y-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-green-500 transition-all"
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditMember(member)}
                        className="flex-1"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteMember(member)}
                        className="flex-1 text-red-600 hover:text-red-700"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* --- Empty State --- */}
        {filteredMembers.length === 0 && (
          <Card className="p-12 text-center">
            <UsersIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No se encontraron miembros
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "Intenta ajustar la búsqueda"
                : "Comienza agregando tu primer miembro del equipo"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsTeamModalOpen(true)}>
                <PlusIcon className="w-4 h-4 mr-2" />
                Crear Miembro
              </Button>
            )}
          </Card>
        )}
      </div>

      {/* --- Modals --- */}
      <Dialog
        open={isTeamModalOpen}
        onOpenChange={(isOpen) => {
          setIsTeamModalOpen(isOpen);
          if (!isOpen) {
            setEditingMember(undefined);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMember ? "Editar Miembro" : "Nuevo Miembro"}
            </DialogTitle>
          </DialogHeader>
          <TeamMemberForm
            member={editingMember}
            onSave={handleSaveMember}
            onCancel={() => {
              setIsTeamModalOpen(false);
              setEditingMember(undefined);
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

// CAMBIO: Componente Skeleton para el estado de carga
function TeamPageSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>

        <Skeleton className="h-12 w-full" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="pt-3 border-t space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
"use client"

import { useState, useMemo } from "react"
import { useProjectStore } from "@/store/projectStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Modal } from "@/components/modal"
import { TeamMemberForm } from "@/components/team/team-member-form"
import { PlusIcon, SearchIcon, UsersIcon, BriefcaseIcon, MailIcon, PhoneIcon, MapPinIcon } from "lucide-react"
import { motion } from "framer-motion"
import type { TeamMember } from "@/lib/project-types"

export default function TeamPage() {
  const { teamMembers, tasks, createTeamMember, updateTeamMember, deleteTeamMember, getTeamMemberWorkload } =
    useProjectStore()

  const [searchQuery, setSearchQuery] = useState("")
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | undefined>()

  const filteredMembers = useMemo(() => {
    return teamMembers.filter((member) => {
      const searchLower = searchQuery.toLowerCase()
      return (
        member.name.toLowerCase().includes(searchLower) ||
        member.email.toLowerCase().includes(searchLower) ||
        member.dni.toLowerCase().includes(searchLower)
      )
    })
  }, [teamMembers, searchQuery])

  const stats = useMemo(() => {
    const totalMembers = teamMembers.length
    const totalAssignments = tasks.filter((t) => t.assignee_id).length
    const avgWorkload =
      teamMembers.length > 0
        ? teamMembers.reduce((sum, m) => sum + getTeamMemberWorkload(m.id), 0) / teamMembers.length
        : 0

    return { totalMembers, totalAssignments, avgWorkload }
  }, [teamMembers, tasks, getTeamMemberWorkload])

  const handleSaveMember = async (memberData: Omit<TeamMember, "id"> | TeamMember) => {
    const saved = await ("id" in memberData ? updateTeamMember(memberData as TeamMember) : createTeamMember(memberData))

    if (saved) {
      setIsTeamModalOpen(false)
      setEditingMember(undefined)
    }
  }

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member)
    setIsTeamModalOpen(true)
  }

  const handleDeleteMember = async (member: TeamMember) => {
    const memberTasks = tasks.filter((t) => t.assignee_id === member.id)

    if (memberTasks.length > 0) {
      if (
        !confirm(
          `${member.name} tiene ${memberTasks.length} tarea(s) asignada(s). ¿Estás seguro de que quieres eliminar este miembro? Las tareas quedarán sin asignar.`,
        )
      ) {
        return
      }
    } else {
      if (!confirm(`¿Estás seguro de que quieres eliminar a ${member.name}?`)) {
        return
      }
    }

    await deleteTeamMember(member.id)
  }

  const getMemberTaskCount = (memberId: string) => {
    return tasks.filter((t) => t.assignee_id === memberId).length
  }

  const getMemberCompletedTasks = (memberId: string) => {
    return tasks.filter((t) => t.assignee_id === memberId && t.status === "completed").length
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Equipo</h1>
            <p className="text-muted-foreground mt-1">Gestiona todos los miembros del equipo</p>
          </div>
          <Button onClick={() => setIsTeamModalOpen(true)} className="w-full md:w-auto">
            <PlusIcon className="w-4 h-4 mr-2" />
            Nuevo Miembro
          </Button>
        </div>

        {/* Stats Cards */}
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
                <p className="text-sm text-muted-foreground">Asignaciones Activas</p>
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
                <p className="text-2xl font-bold">{stats.avgWorkload.toFixed(0)}h</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
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

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const taskCount = getMemberTaskCount(member.id)
            const completedTasks = getMemberCompletedTasks(member.id)
            const workload = getTeamMemberWorkload(member.id)

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-5 hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    {/* Avatar and Name */}
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">{member.name}</h3>
                        <p className="text-sm text-muted-foreground">DNI: {member.dni}</p>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MailIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <PhoneIcon className="w-4 h-4 flex-shrink-0" />
                        <span>{member.phone}</span>
                      </div>
                      {member.domicilio && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{member.domicilio}</span>
                        </div>
                      )}
                    </div>

                    {/* Task Stats */}
                    <div className="pt-3 border-t space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tareas asignadas:</span>
                        <span className="font-medium">{taskCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Completadas:</span>
                        <span className="font-medium">
                          {completedTasks} ({taskCount > 0 ? ((completedTasks / taskCount) * 100).toFixed(0) : 0}%)
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Carga de trabajo:</span>
                        <span className="font-medium">{workload.toFixed(0)}h</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {taskCount > 0 && (
                      <div className="space-y-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-green-500 transition-all"
                            style={{ width: `${(completedTasks / taskCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditMember(member)} className="flex-1">
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
            )
          })}
        </div>

        {filteredMembers.length === 0 && (
          <Card className="p-12 text-center">
            <UsersIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron miembros</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Intenta ajustar la búsqueda" : "Comienza agregando tu primer miembro del equipo"}
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

      {/* Team Member Form Modal */}
      <Modal
        isOpen={isTeamModalOpen}
        onClose={() => {
          setIsTeamModalOpen(false)
          setEditingMember(undefined)
        }}
        title={editingMember ? "Editar Miembro" : "Nuevo Miembro"}
      >
        <TeamMemberForm
          member={editingMember}
          onSave={handleSaveMember}
          onCancel={() => {
            setIsTeamModalOpen(false)
            setEditingMember(undefined)
          }}
        />
      </Modal>
    </div>
  )
}

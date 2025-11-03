"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { teamService } from "@/services/apiService"
import type { TeamMember, NewTeamMember, UUID } from "@/lib/project-types"

export function useTeam() {
  return useQuery<TeamMember[]>({
    queryKey: ["team"],
    queryFn: teamService.getTeam,
  })
}

export function useCreateTeamMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: NewTeamMember) => teamService.createTeamMember(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team"] }),
  })
}

export function useUpdateTeamMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: TeamMember) => teamService.updateTeamMember(data.id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team"] }),
  })
}

export function useDeleteTeamMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: UUID) => teamService.deleteTeamMember(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team"] }),
  })
}

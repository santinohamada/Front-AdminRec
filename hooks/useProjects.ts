"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { projectService } from "@/services/apiService"
import type { Project, NewProject, UUID } from "@/lib/project-types"

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: projectService.getProjects,
  })
}

export function useProject(id?: UUID) {
  return useQuery<Project | undefined>({
    queryKey: ["project", id],
    queryFn: () => (id ? projectService.getProjectById(id) : Promise.resolve(undefined)),
    enabled: !!id,
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: NewProject) => projectService.createProject(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Project) => projectService.updateProject(data.id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: UUID) => projectService.deleteProject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  })
}

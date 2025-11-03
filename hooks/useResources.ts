"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { resourceService } from "@/services/apiService"
import type { Resource, NewResource, UUID } from "@/lib/project-types"

export function useResources() {
  return useQuery<Resource[]>({
    queryKey: ["resources"],
    queryFn: resourceService.getResources,
  })
}

export function useCreateResource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: NewResource) => resourceService.createResource(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resources"] }),
  })
}

export function useUpdateResource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Resource) => resourceService.updateResource(data.id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resources"] }),
  })
}

export function useDeleteResource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: UUID) => resourceService.deleteResource(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resources"] }),
  })
}

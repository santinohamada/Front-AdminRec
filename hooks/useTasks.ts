"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { taskService } from "@/services/apiService"
import type { Task, NewTask, NewResourceAssignment, UUID } from "@/lib/project-types"

export function useTasks() {
  return useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: taskService.getTasks,
  })
}

export function useTask(id?: UUID) {
  return useQuery<Task | undefined>({
    queryKey: ["task", id],
    queryFn: () => (id ? taskService.getTaskById(id) : Promise.resolve(undefined)),
    enabled: !!id,
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ data, assignments }: { data: NewTask; assignments: Omit<NewResourceAssignment, "task_id">[] }) =>
      taskService.createTask(data, assignments),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] })
      qc.invalidateQueries({ queryKey: ["resources"] })
      qc.invalidateQueries({ queryKey: ["assignments"] })
    },
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data, assignments }: { id: UUID; data: Task; assignments: Omit<NewResourceAssignment, "task_id">[] }) =>
      taskService.updateTask(id, data, assignments),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] })
      qc.invalidateQueries({ queryKey: ["resources"] })
      qc.invalidateQueries({ queryKey: ["assignments"] })
    },
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: UUID) => taskService.deleteTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] })
      qc.invalidateQueries({ queryKey: ["resources"] })
      qc.invalidateQueries({ queryKey: ["assignments"] })
    },
  })
}

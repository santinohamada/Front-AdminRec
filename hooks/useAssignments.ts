// En un nuevo archivo, ej: @/hooks/useAssignments.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { assignmentService } from "@/services/apiService";
import type { ResourceAssignment } from "@/lib/project-types";

export function useAssignments() {
  return useQuery<ResourceAssignment[]>({
    queryKey: ["assignments"],
    queryFn: assignmentService.getAssignments,
  });
}

// Nota: No se necesitan hooks de mutación aquí,
// ya que las asignaciones se gestionan a través de
// useCreateTask y useUpdateTask, que ya invalidan "assignments".
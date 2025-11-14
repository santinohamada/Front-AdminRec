"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { clientService} from "@/services/apiService"
import type { Client, UUID } from "@/lib/project-types"

export function useClient() {
  return useQuery<Client[]>({
    queryKey: ["Client"],
    queryFn: clientService.getClient,
  })
}


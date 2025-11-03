// src/store/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TeamMember, UUID } from "@/lib/project-types";
import { INITIAL_TEAM } from "@/services/mocks";

interface AuthState {
  currentUser: TeamMember | null;
  login: (userId: UUID) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null, // Se rehidratará desde LocalStorage
      
      login: (userId: UUID) => {
        const user = INITIAL_TEAM.find((u) => u.id === userId);
        if (user) {
          set({ currentUser: user });
          // Ya no seteamos un cookie
        }
      },
      
      logout: () => {
        set({ currentUser: null });
        // Ya no borramos un cookie
      },
    }),
    {
      name: "auth-storage", // Clave en LocalStorage
    }
  )
);
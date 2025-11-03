// src/store/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TeamMember, UUID } from "@/lib/project-types";

interface AuthState {
  currentUser: TeamMember | null;
  login: (user: TeamMember) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null, // Se rehidratará desde LocalStorage
      
      // 3. --- CAMBIO --- Implementación de 'login' simplificada
      login: (user: TeamMember) => {
        set({ currentUser: user });
      },
      
      logout: () => {
        set({ currentUser: null });
      },
    }),
    {
      name: "auth-storage", // Clave en LocalStorage
    }
  )
);
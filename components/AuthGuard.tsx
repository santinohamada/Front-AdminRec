"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Skeleton } from "@/components/ui/skeleton"; // O un spinner

/**
 * Este componente protege las rutas del lado del cliente.
 * Verifica el estado de LocalStorage (via Zustand) ANTES de mostrar la página.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser } = useAuthStore();
  
  // Estado para saber si Zustand ya cargó los datos de LocalStorage.
  const [isHydrated, setIsHydrated] = useState(false);

  // 1. Esperar a que Zustand se hidrate desde LocalStorage
  useEffect(() => {
    useAuthStore.persist.rehydrate();
    setIsHydrated(true);
  }, []);

  // 2. Comprobar la autenticación una vez que tengamos los datos
  useEffect(() => {
    // Si la hidratación terminó Y no hay usuario...
    if (isHydrated && !currentUser) {
      // Redirigir a /login
      const loginUrl = new URL('/login', window.location.origin);
      loginUrl.searchParams.set('from', pathname); // Guardar la ruta que intentó visitar
      router.replace(loginUrl.toString());
    }
  }, [isHydrated, currentUser, router, pathname]);

  // 3. Mostrar un loader mientras se hidrata o si estamos por redirigir
  if (!isHydrated || !currentUser) {
    // Esto previene el "flash" de la página protegida
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-8 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  // 4. Si todo está bien, mostrar la página
  return <>{children}</>;
}
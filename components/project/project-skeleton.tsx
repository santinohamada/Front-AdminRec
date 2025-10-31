// @/components/project-skeleton.tsx

import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Componente Skeleton (Pantalla Esqueleto) para la carga inicial de la aplicación.
 * Utiliza componentes Skeleton de shadcn/ui para simular la estructura de la interfaz.
 */
export const ProjectSkeleton: React.FC = () => (
    <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border bg-card">
            <div className="px-4 md:px-6 py-4 flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-md md:hidden" />
                <div className="flex-1">
                    <Skeleton className="h-6 w-1/3 mb-1" />
                    <Skeleton className="h-4 w-1/4 hidden sm:block" />
                </div>
            </div>
        </header>

        <div className="flex h-[calc(100vh-73px)] md:h-[calc(100vh-89px)] relative">
            {/* Sidebar Skeleton */}
            <div className="hidden md:block w-[280px] border-r border-border bg-muted/20 p-4 space-y-4">
                <Skeleton className="h-8 w-full" />
                <div className="space-y-3">
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-3/4" />
                </div>
            </div>

            {/* Main Content Skeleton */}
            <main className="flex-1 p-4 md:p-6 space-y-6">
                {/* Header Section Skeleton */}
                <div className="space-y-3">
                    <Skeleton className="h-8 w-1/4" />
                    <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-5 w-24" />
                    </div>
                    <div className="flex gap-4 border-b border-border">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-16" />
                    </div>
                </div>

                {/* Content List Skeleton */}
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-2/3" />
                </div>
            </main>
        </div>
    </div>
);

// export default ProjectSkeleton; // Si usas exportación por defecto
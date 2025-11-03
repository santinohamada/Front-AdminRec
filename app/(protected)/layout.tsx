// app/(protected)/layout.tsx

import { AuthGuard } from "@/components/AuthGuard"; // Importa el guardia

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Envuelve todas las páginas dentro de (protected) con el AuthGuard
  return <AuthGuard>{children}</AuthGuard>;
}
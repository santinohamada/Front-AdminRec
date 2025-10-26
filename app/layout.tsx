import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestor de Proyectos",
  description: "TFI de Admin de recursos",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

"use client"

import React, { useState } from "react"
import {
  ClockIcon,
  DollarSignIcon,
  PencilIcon,
  Trash2Icon,
  UserIcon,
  FileTextIcon,
  LockIcon,
  UnlockIcon,
  MoreHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Project, TeamMember } from "@/lib/project-types"
import { formatCurrency, formatDate } from "@/lib/project-utils"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

interface ProjectHeaderProps {
  project: Project
  teamMembers: TeamMember[]
  onEdit: () => void
  onDelete: () => void

  onToggleClosed: () => void // Added handler to toggle closed status
}

export function ProjectHeader({
  project,
  teamMembers,
  onEdit,
  onDelete,

  onToggleClosed,
}: ProjectHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const manager = teamMembers.find((member) => member.id === project.manager_id)
  const isClosed = project.status === "closed" // Check if project is closed

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-600 border-green-500/20"
      case "planning":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      case "on-hold":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
      case "completed":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20"
      case "closed": // Added closed status styling
        return "bg-gray-500/10 text-gray-600 border-gray-500/20"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "activo"
      case "planning":
        return "planificación"
      case "on-hold":
        return "en espera"
      case "completed":
        return "completado"
      case "closed": // Added closed status label
        return "cerrado"
      default:
        return status
    }
  }
  const router = useRouter()
 const onGenerateReport = () => {
  router.push(`/report/${project.id}`)
 }
  return (
    <motion.div
      className="mb-6"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Closed banner */}
      {isClosed && (
        <motion.div
          className="mb-4 bg-gray-500/10 border border-gray-500/20 rounded-lg p-3 flex items-center gap-3"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <LockIcon className="h-5 w-5 text-gray-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Proyecto cerrado — solo lectura</p>
            <p className="text-xs text-gray-600">No se pueden realizar cambios mientras el proyecto esté cerrado.</p>
          </div>
          <div className="hidden sm:block">
            <Button size="sm" variant="outline" onClick={onToggleClosed}>
              <UnlockIcon className="h-4 w-4 mr-2" /> Reabrir
            </Button>
          </div>
        </motion.div>
      )}

      {/* Header top: title + actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <motion.h2
              className="text-2xl sm:text-3xl font-bold text-foreground truncate max-w-[60vw] sm:max-w-none"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              title={project.name}
            >
              {project.name}
            </motion.h2>

            <motion.span
              className={`px-3 py-1 rounded-full text-xs font-medium border capitalize shrink-0 ${getStatusStyles(project.status)}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.12 }}
            >
              {getStatusLabel(project.status)}
            </motion.span>
          </div>

          {/* Description - hidden on very small screens to save vertical space */}
          <motion.p
            className="text-muted-foreground mt-2 text-sm line-clamp-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.18 }}
          >
            {project.description}
          </motion.p>
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onGenerateReport} className="bg-transparent">
            <FileTextIcon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Reporte</span>
          </Button>

          <Button size="sm" variant="outline" onClick={onToggleClosed} className="bg-transparent">
            {isClosed ? <UnlockIcon className="h-4 w-4 mr-2" /> : <LockIcon className="h-4 w-4 mr-2" />}
            <span className="hidden sm:inline">{isClosed ? "Reabrir" : "Cerrar"}</span>
          </Button>

          <Button size="sm" variant="outline" onClick={onEdit} disabled={isClosed}>
            <PencilIcon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Editar</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onDelete}
            disabled={isClosed}
            className="text-destructive hover:text-destructive bg-transparent disabled:opacity-50"
          >
            <Trash2Icon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Eliminar</span>
          </Button>
        </div>

        {/* Mobile actions: compact menu */}
        <div className="md:hidden relative">
          <button
            aria-label="Acciones"
            onClick={() => setMobileMenuOpen((s) => !s)}
            className="p-2 rounded-md hover:bg-accent/10"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>

          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 mt-2 w-44 bg-background border border-border rounded-md shadow-lg z-50 overflow-hidden"
              >
                <div className="flex flex-col p-2">
                  <button
                    onClick={() => {
                      onGenerateReport();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-2 py-2 text-sm rounded hover:bg-accent/10"
                  >
                    <FileTextIcon className="h-4 w-4" />
                    <span>Reporte</span>
                  </button>

                  <button
                    onClick={() => {
                      onToggleClosed();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-2 py-2 text-sm rounded hover:bg-accent/10"
                  >
                    {isClosed ? <UnlockIcon className="h-4 w-4" /> : <LockIcon className="h-4 w-4" />}
                    <span>{isClosed ? "Reabrir" : "Cerrar"}</span>
                  </button>

                  <button
                    onClick={() => {
                      onEdit();
                      setMobileMenuOpen(false);
                    }}
                    disabled={isClosed}
                    className="flex items-center gap-2 px-2 py-2 text-sm rounded hover:bg-accent/10 disabled:opacity-50"
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => {
                      onDelete();
                      setMobileMenuOpen(false);
                    }}
                    disabled={isClosed}
                    className="flex items-center gap-2 px-2 py-2 text-sm rounded hover:bg-accent/10 text-destructive disabled:opacity-50"
                  >
                    <Trash2Icon className="h-4 w-4" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Info row: manager, dates, budget */}
      <motion.div
        className="flex mt-4 gap-3 flex-wrap  text-sm "
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
      >
        <div className="flex items-center gap-1 ">
          <UserIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground truncate">
            Responsable: <span className="font-medium text-foreground">{manager?.name || "Desconocido"}</span>
          </span>
        </div>

        <div className="flex items-center gap-1 truncate">
          <ClockIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground truncate">
            {formatDate(project.start_date)} — {formatDate(project.end_date)}
          </span>
        </div>

        <div className="flex items-center gap-1 truncate">
          <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground truncate">Presupuesto: {formatCurrency(project.total_budget)}</span>
        </div>
      </motion.div>
    </motion.div>
  )
}

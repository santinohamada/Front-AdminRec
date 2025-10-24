"use client"

import {
  ClockIcon,
  DollarSignIcon,
  PencilIcon,
  Trash2Icon,
  UserIcon,
  FileTextIcon,
  LockIcon,
  UnlockIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Project, TeamMember } from "@/lib/project-types"
import { formatCurrency, formatDate } from "@/lib/project-utils"
import { motion } from "framer-motion"

interface ProjectHeaderProps {
  project: Project
  teamMembers: TeamMember[]
  onEdit: () => void
  onDelete: () => void
  onGenerateReport: () => void
  onToggleClosed: () => void // Added handler to toggle closed status
}

export function ProjectHeader({
  project,
  teamMembers,
  onEdit,
  onDelete,
  onGenerateReport,
  onToggleClosed,
}: ProjectHeaderProps) {
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

  return (
    <motion.div
      className="mb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {isClosed && (
        <motion.div
          className="mb-4 bg-gray-500/10 border border-gray-500/20 rounded-lg p-3 flex items-center gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <LockIcon className="h-5 w-5 text-gray-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Proyecto Cerrado - Solo Lectura</p>
            <p className="text-xs text-gray-600">Este proyecto está cerrado y no se pueden realizar cambios.</p>
          </div>
        </motion.div>
      )}

      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <motion.h2
            className="text-3xl font-bold text-foreground"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {project.name}
          </motion.h2>
          <motion.span
            className={`px-3 py-1 rounded-full text-xs font-medium border capitalize ${getStatusStyles(project.status)}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            {getStatusLabel(project.status)}
          </motion.span>
        </div>
        <motion.div
          className="flex gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button size="sm" variant="outline" onClick={onGenerateReport} className="bg-transparent">
            <FileTextIcon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Reporte Semanal</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onToggleClosed}
            className={isClosed ? "bg-transparent" : "bg-transparent"}
          >
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
        </motion.div>
      </div>
      <motion.p
        className="text-muted-foreground mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {project.description}
      </motion.p>
      <motion.div
        className="flex gap-6 text-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            Responsable: <span className="font-medium text-foreground">{manager?.name || "Desconocido"}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            {formatDate(project.start_date)} - {formatDate(project.end_date)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Presupuesto: {formatCurrency(project.total_budget)}</span>
        </div>
      </motion.div>
    </motion.div>
  )
}

"use client"

import { motion } from "framer-motion"
import type { Project, Task, Resource, ResourceAssignment } from "@/lib/project-types"
import { formatCurrency, formatDate, getStatusInfo, calculateActualCost } from "@/lib/project-utils"
import {
  CheckCircle2Icon,
  ClockIcon,
  AlertCircleIcon,
  XCircleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
} from "lucide-react"

interface WeeklyReportProps {
  project: Project
  tasks: Task[]
  resources: Resource[]
  assignments: ResourceAssignment[]
}

export function WeeklyReport({ project, tasks, resources, assignments }: WeeklyReportProps) {
  // Calculate statistics
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.status === "completed").length
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length
  const blockedTasks = tasks.filter((t) => t.status === "blocked").length
  const notStartedTasks = tasks.filter((t) => t.status === "not_started").length

  const avgProgress = tasks.length > 0 ? tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length : 0

  const actualCost = calculateActualCost(tasks, assignments, resources)
  const budgetUsedPercentage = (actualCost / project.total_budget) * 100

  // Mock recent activities (since we don't have real history)
  const recentActivities = [
    { type: "completed", task: tasks.find((t) => t.status === "completed"), date: "2024-01-15" },
    { type: "started", task: tasks.find((t) => t.status === "in_progress"), date: "2024-01-14" },
    { type: "blocked", task: tasks.find((t) => t.status === "blocked"), date: "2024-01-13" },
  ].filter((a) => a.task)

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h2 className="text-2xl font-bold text-foreground mb-2">Reporte Semanal</h2>
        <p className="text-sm text-muted-foreground">
          Proyecto: <span className="font-medium text-foreground">{project.name}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Generado el {formatDate(new Date().toISOString().split("T")[0])}
        </p>
      </div>

      {/* Task Summary */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Resumen de Tareas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2Icon className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-600 font-medium">Completadas</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {((completedTasks / totalTasks) * 100).toFixed(0)}% del total
            </p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <ClockIcon className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-blue-600 font-medium">En Progreso</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{inProgressTasks}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {((inProgressTasks / totalTasks) * 100).toFixed(0)}% del total
            </p>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircleIcon className="h-5 w-5 text-red-600" />
              <span className="text-sm text-red-600 font-medium">Bloqueadas</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{blockedTasks}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {((blockedTasks / totalTasks) * 100).toFixed(0)}% del total
            </p>
          </div>

          <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircleIcon className="h-5 w-5 text-gray-600" />
              <span className="text-sm text-gray-600 font-medium">Sin Iniciar</span>
            </div>
            <p className="text-2xl font-bold text-gray-600">{notStartedTasks}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {((notStartedTasks / totalTasks) * 100).toFixed(0)}% del total
            </p>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Avance General</h3>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Progreso Promedio</span>
            <span className="text-2xl font-bold text-foreground">{avgProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
              initial={{ width: 0 }}
              animate={{ width: `${avgProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Budget Status */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Estado del Presupuesto</h3>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Presupuesto Total</span>
            <span className="font-semibold text-foreground">{formatCurrency(project.total_budget)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Gasto Actual</span>
            <span className="font-semibold text-foreground">{formatCurrency(actualCost)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Disponible</span>
            <span className="font-semibold text-foreground">{formatCurrency(project.total_budget - actualCost)}</span>
          </div>
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Uso del Presupuesto</span>
              <div className="flex items-center gap-2">
                {budgetUsedPercentage > 90 ? (
                  <TrendingUpIcon className="h-4 w-4 text-red-500" />
                ) : (
                  <TrendingDownIcon className="h-4 w-4 text-green-500" />
                )}
                <span className={`font-bold ${budgetUsedPercentage > 90 ? "text-red-500" : "text-green-500"}`}>
                  {budgetUsedPercentage.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <motion.div
                className={`h-full ${budgetUsedPercentage > 90 ? "bg-red-500" : "bg-green-500"}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(budgetUsedPercentage, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Actividad Reciente</h3>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity, idx) => {
              const statusInfo = getStatusInfo(activity.task!.status)
              return (
                <div key={idx} className="p-4 flex items-start gap-3">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{activity.task!.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(activity.date)}</p>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">No hay actividad reciente</div>
          )}
        </div>
      </div>

      {/* Resource Utilization */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Utilización de Recursos</h3>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-3">
            {resources.slice(0, 5).map((resource) => {
              const resourceAssignments = assignments.filter((a) => a.resource_id === resource.id)
              const totalHours = resourceAssignments.reduce((sum, a) => sum + a.hours_assigned, 0)
              const utilization = (totalHours / resource.availability_hours) * 100

              return (
                <div key={resource.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground">{resource.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {totalHours}h / {resource.availability_hours}h
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${utilization > 100 ? "bg-red-500" : utilization > 80 ? "bg-yellow-500" : "bg-blue-500"}`}
                      style={{ width: `${Math.min(utilization, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

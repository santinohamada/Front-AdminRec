"use client"

import { motion } from "framer-motion"
import type { Project, Task, Resource, ResourceAssignment } from "@/lib/project-types"
import { formatCurrency, formatDate, calculateActualCost, getTaskStatusInfo } from "@/lib/project-utils"
import {
  CheckCircle2Icon,
  ClockIcon,
  AlertCircleIcon,
  XCircleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
} from "lucide-react"

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface WeeklyReportProps {
  project: Project
  tasks: Task[]
  resources: Resource[]
  assignments: ResourceAssignment[]
  isPdfMode?: boolean
}

export function WeeklyReport({ project, tasks, resources, assignments, isPdfMode = false }: WeeklyReportProps) {
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.status === "completed").length
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length
  const blockedTasks = tasks.filter((t) => t.status === "blocked").length
  const notStartedTasks = tasks.filter((t) => t.status === "not_started").length

  const avgProgress = tasks.length > 0 ? tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length : 0

  const actualCost = calculateActualCost(tasks, assignments, resources)
  const budgetUsedPercentage = (actualCost / project.total_budget) * 100

  const recentActivities = [
    {
      type: "completed",
      task: tasks.find((t) => t.status === "completed"),
      date: "2024-01-15",
    },
    {
      type: "started",
      task: tasks.find((t) => t.status === "in_progress"),
      date: "2024-01-14",
    },
    {
      type: "blocked",
      task: tasks.find((t) => t.status === "blocked"),
      date: "2024-01-13",
    },
  ].filter((a) => a.task)

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className={`border-b pb-4 ${isPdfMode ? "border-gray-200" : "border-border"}`}>
        <h2 className={`text-2xl font-bold mb-2 ${isPdfMode ? "text-black" : "text-foreground"}`}>Reporte Semanal</h2>
        <p className={`text-sm ${isPdfMode ? "text-gray-600" : "text-muted-foreground"}`}>
          Proyecto:{" "}
          <span className={`font-medium ${isPdfMode ? "text-black" : "text-foreground"}`}>{project.name}</span>
        </p>
        <p className={`text-xs ${isPdfMode ? "text-gray-500" : "text-muted-foreground"}`}>
          Generado el {formatDate(new Date().toISOString().split("T")[0])}
        </p>
      </div>

      {/* Task Summary */}
      <div>
        <h3 className={`text-lg font-semibold mb-3 ${isPdfMode ? "text-black" : "text-foreground"}`}>
          Resumen de Tareas
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Tarjeta 1: Completadas */}
          <Card className={isPdfMode ? "bg-white border border-gray-200" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Completadas</CardTitle>
              <CheckCircle2Icon className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
              <p className={`text-xs mt-1 ${isPdfMode ? "text-gray-500" : "text-muted-foreground"}`}>
                {((completedTasks / totalTasks) * 100).toFixed(0)}% del total
              </p>
            </CardContent>
          </Card>

          {/* Tarjeta 2: En Progreso */}
          <Card className={isPdfMode ? "bg-white border border-gray-200" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-600">En Progreso</CardTitle>
              <ClockIcon className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{inProgressTasks}</div>
              <p className={`text-xs mt-1 ${isPdfMode ? "text-gray-500" : "text-muted-foreground"}`}>
                {((inProgressTasks / totalTasks) * 100).toFixed(0)}% del total
              </p>
            </CardContent>
          </Card>

          {/* Tarjeta 3: Bloqueadas */}
          <Card className={isPdfMode ? "bg-white border border-gray-200" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Bloqueadas</CardTitle>
              <AlertCircleIcon className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{blockedTasks}</div>
              <p className={`text-xs mt-1 ${isPdfMode ? "text-gray-500" : "text-muted-foreground"}`}>
                {((blockedTasks / totalTasks) * 100).toFixed(0)}% del total
              </p>
            </CardContent>
          </Card>

          {/* Tarjeta 4: Sin Iniciar */}
          <Card className={isPdfMode ? "bg-white border border-gray-200" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isPdfMode ? "text-gray-700" : "text-foreground"}`}>
                Sin Iniciar
              </CardTitle>
              <XCircleIcon className={`h-5 w-5 ${isPdfMode ? "text-gray-500" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isPdfMode ? "text-gray-700" : "text-foreground"}`}>
                {notStartedTasks}
              </div>
              <p className={`text-xs mt-1 ${isPdfMode ? "text-gray-500" : "text-muted-foreground"}`}>
                {((notStartedTasks / totalTasks) * 100).toFixed(0)}% del total
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className={isPdfMode ? "bg-white border border-gray-200" : ""}>
        <CardHeader className="pb-4">
          <CardTitle className={`text-lg ${isPdfMode ? "text-black" : "text-foreground"}`}>Avance General</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${isPdfMode ? "text-gray-600" : "text-muted-foreground"}`}>
              Progreso Promedio
            </span>
            <span className={`text-2xl font-bold ${isPdfMode ? "text-black" : "text-foreground"}`}>
              {avgProgress.toFixed(1)}%
            </span>
          </div>
          {isPdfMode ? (
            <div className="relative h-3 w-full overflow-hidden rounded-full" style={{ backgroundColor: "#e5e7eb" }}>
              <div
                className="h-full transition-all"
                style={{
                  backgroundColor: "#3b82f6",
                  width: `${avgProgress}%`,
                }}
              />
            </div>
          ) : (
            <Progress value={avgProgress} className="h-3" />
          )}
        </CardContent>
      </Card>

      {/* Budget Status */}
      <Card className={isPdfMode ? "bg-white border border-gray-200" : ""}>
        <CardHeader className="pb-4">
          <CardTitle className={`text-lg ${isPdfMode ? "text-black" : "text-foreground"}`}>
            Estado del Presupuesto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-sm ${isPdfMode ? "text-gray-600" : "text-muted-foreground"}`}>
                Presupuesto Total
              </span>
              <span className={`font-semibold ${isPdfMode ? "text-black" : "text-foreground"}`}>
                {formatCurrency(project.total_budget)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${isPdfMode ? "text-gray-600" : "text-muted-foreground"}`}>Gasto Actual</span>
              <span className={`font-semibold ${isPdfMode ? "text-black" : "text-foreground"}`}>
                {formatCurrency(actualCost)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${isPdfMode ? "text-gray-600" : "text-muted-foreground"}`}>Disponible</span>
              <span className={`font-semibold ${isPdfMode ? "text-black" : "text-foreground"}`}>
                {formatCurrency(project.total_budget - actualCost)}
              </span>
            </div>
          </div>

          <div className={`pt-4 border-t ${isPdfMode ? "border-gray-200" : "border-border"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${isPdfMode ? "text-gray-600" : "text-muted-foreground"}`}>
                Uso del Presupuesto
              </span>
              <div className="flex items-center gap-2">
                {budgetUsedPercentage > 90 ? (
                  <TrendingUpIcon className="h-4 w-4 text-red-600" />
                ) : (
                  <TrendingDownIcon className="h-4 w-4 text-green-500" />
                )}
                <span className={`font-bold ${budgetUsedPercentage > 90 ? "text-red-600" : "text-green-500"}`}>
                  {budgetUsedPercentage.toFixed(1)}%
                </span>
              </div>
            </div>
            <div
              className="w-full rounded-full h-2 overflow-hidden"
              style={isPdfMode ? { backgroundColor: "#e5e7eb" } : undefined}
            >
              <motion.div
                className={budgetUsedPercentage > 90 ? "bg-red-600" : "bg-green-500"}
                style={
                  isPdfMode
                    ? {
                        height: "100%",
                        backgroundColor: budgetUsedPercentage > 90 ? "#dc2626" : "#22c55e",
                        width: `${Math.min(budgetUsedPercentage, 100)}%`,
                      }
                    : { height: "100%" }
                }
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(budgetUsedPercentage, 100)}%` }}
                transition={{ duration: isPdfMode ? 0 : 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity & Resource Utilization */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className={isPdfMode ? "bg-white border border-gray-200" : ""}>
          <CardHeader>
            <CardTitle className={`text-lg ${isPdfMode ? "text-black" : "text-foreground"}`}>
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity, idx) => {
                  const statusInfo = getTaskStatusInfo(activity.task!.status)
                  return (
                    <div key={idx} className="flex items-start gap-3">
                      <div className={`mt-1 px-2 py-0.5 rounded text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${isPdfMode ? "text-black" : "text-foreground"}`}>
                          {activity.task!.name}
                        </p>
                        <p className={`text-xs mt-1 ${isPdfMode ? "text-gray-500" : "text-muted-foreground"}`}>
                          {formatDate(activity.date)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className={`p-4 text-center text-sm ${isPdfMode ? "text-gray-500" : "text-muted-foreground"}`}>
                No hay actividad reciente
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={isPdfMode ? "bg-white border border-gray-200" : ""}>
          <CardHeader>
            <CardTitle className={`text-lg ${isPdfMode ? "text-black" : "text-foreground"}`}>
              Utilización de Recursos
            </CardTitle>
            <CardDescription className={isPdfMode ? "text-gray-600" : ""}>
              Top 5 recursos más utilizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {resources.slice(0, 5).map((resource) => {
                const resourceAssignments = assignments.filter((a) => a.resource_id === resource.id)
                const totalHours = resourceAssignments.reduce((sum, a) => sum + a.hours_assigned, 0)
                const utilization = (totalHours / resource.available_hours) * 100

                return (
                  <div key={resource.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm ${isPdfMode ? "text-black" : "text-foreground"}`}>{resource.name}</span>
                      <span className={`text-xs ${isPdfMode ? "text-gray-600" : "text-muted-foreground"}`}>
                        {totalHours}h / {resource.available_hours}h
                      </span>
                    </div>
                    {isPdfMode ? (
                      <div
                        className="relative h-2 w-full overflow-hidden rounded-full"
                        style={{ backgroundColor: "#e5e7eb" }}
                      >
                        <div
                          className="h-full transition-all"
                          style={{
                            backgroundColor: utilization > 100 ? "#dc2626" : utilization > 80 ? "#eab308" : "#3b82f6",
                            width: `${Math.min(utilization, 100)}%`,
                          }}
                        />
                      </div>
                    ) : (
                      <Progress
                        value={utilization}
                        className={`h-2 ${
                          utilization > 100
                            ? "[&>div]:bg-red-600"
                            : utilization > 80
                              ? "[&>div]:bg-yellow-500"
                              : "[&>div]:bg-blue-500"
                        }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}

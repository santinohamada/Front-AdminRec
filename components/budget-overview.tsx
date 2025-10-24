"use client"

import { AlertCircleIcon, TrendingUpIcon, TrendingDownIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import type { Project, Task, Resource, ResourceAssignment } from "@/lib/project-types"
import { formatCurrency, formatPercentage } from "@/lib/project-utils"
import { motion } from "framer-motion"

interface BudgetOverviewProps {
  project: Project
  tasks: Task[]
  resources: Resource[]
  assignments: ResourceAssignment[]
}

export function BudgetOverview({ project, tasks, resources, assignments }: BudgetOverviewProps) {
  const totalAllocated = tasks.reduce((sum, t) => sum + t.budget_allocated, 0)
  const remainingBudget = project.total_budget - totalAllocated

  const actualCost = assignments.reduce((sum, assignment) => {
    const resource = resources.find((r) => r.id === assignment.resource_id)
    if (!resource) return sum
    return sum + assignment.hours_actual * resource.hourly_rate
  }, 0)

  const plannedCost = assignments.reduce((sum, assignment) => {
    const resource = resources.find((r) => r.id === assignment.resource_id)
    if (!resource) return sum
    return sum + assignment.hours_assigned * resource.hourly_rate
  }, 0)

  const costVariance = plannedCost - actualCost
  const costVariancePercent = plannedCost > 0 ? (costVariance / plannedCost) * 100 : 0

  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-6">Resumen de Presupuesto</h3>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Presupuesto Total</div>
            <div className="text-2xl md:text-3xl font-bold text-foreground">{formatCurrency(project.total_budget)}</div>
          </Card>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Asignado</div>
            <div className="text-2xl md:text-3xl font-bold text-foreground">{formatCurrency(totalAllocated)}</div>
          </Card>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Costo Real</div>
            <div className="text-2xl md:text-3xl font-bold text-foreground">{formatCurrency(actualCost)}</div>
            <div className="text-xs text-muted-foreground mt-1">Planificado: {formatCurrency(plannedCost)}</div>
          </Card>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Restante</div>
            <div
              className={`text-2xl md:text-3xl font-bold ${remainingBudget < 0 ? "text-red-500" : "text-green-500"}`}
            >
              {formatCurrency(remainingBudget)}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {actualCost > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-foreground mb-1">Variación de Costos</h4>
                <p className="text-sm text-muted-foreground">
                  {costVariance >= 0 ? "Bajo presupuesto" : "Sobre presupuesto"}
                </p>
              </div>
              <div className="text-right">
                <div
                  className={`text-2xl font-bold flex items-center gap-2 ${costVariance >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {costVariance >= 0 ? (
                    <TrendingDownIcon className="h-5 w-5" />
                  ) : (
                    <TrendingUpIcon className="h-5 w-5" />
                  )}
                  {formatCurrency(Math.abs(costVariance))}
                </div>
                <div className="text-sm text-muted-foreground">{formatPercentage(Math.abs(costVariancePercent))}</div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {remainingBudget < 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-6">
            <AlertCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-500 mb-1">Presupuesto Excedido</h4>
              <p className="text-sm text-red-500/80">
                El presupuesto total asignado excede el presupuesto del proyecto por{" "}
                {formatCurrency(Math.abs(remainingBudget))}. Por favor ajuste los presupuestos de las tareas.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <Card className="p-6">
        <h4 className="font-semibold text-foreground mb-4">Presupuesto por Tarea</h4>
        <div className="space-y-3">
          {tasks.map((task) => {
            const percentage = (task.budget_allocated / project.total_budget) * 100

            const taskAssignments = assignments.filter((a) => a.task_id === task.id)
            const taskActualCost = taskAssignments.reduce((sum, assignment) => {
              const resource = resources.find((r) => r.id === assignment.resource_id)
              if (!resource) return sum
              return sum + assignment.hours_actual * resource.hourly_rate
            }, 0)

            return (
              <div key={task.id}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-foreground font-medium">{task.title}</span>
                  <div className="text-right">
                    <div className="text-muted-foreground">
                      {formatCurrency(task.budget_allocated)} ({formatPercentage(percentage)})
                    </div>
                    {taskActualCost > 0 && (
                      <div
                        className={`text-xs ${taskActualCost > task.budget_allocated ? "text-red-500" : "text-green-500"}`}
                      >
                        Real: {formatCurrency(taskActualCost)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percentage, 100)}%` }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

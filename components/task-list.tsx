"use client"

import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TaskCard } from "./task-card"
import type { Task, Resource, ResourceAssignment } from "@/lib/project-types"
import { motion, AnimatePresence } from "framer-motion"

interface TaskListProps {
  tasks: Task[]
  resources: Resource[]
  assignments: ResourceAssignment[]
  filter: "all" | "completed" | "in-progress"
  onFilterChange: (filter: "all" | "completed" | "in-progress") => void
  onAddTask: () => void
  onEditTask: (task: Task) => void
  onDeleteTask: (taskId: number) => void
  isProjectClosed?: boolean // Added prop to disable actions when project is closed
}

export function TaskList({
  tasks,
  resources,
  assignments,
  filter,
  onFilterChange,
  onAddTask,
  onEditTask,
  onDeleteTask,
  isProjectClosed = false, // Default to false
}: TaskListProps) {
  const filteredTasks =
    filter === "completed"
      ? tasks.filter((t) => t.status === "completed")
      : filter === "in-progress"
        ? tasks.filter((t) => t.status === "in_progress" || t.status === "blocked")
        : tasks

  const completedCount = tasks.filter((t) => t.status === "completed").length
  const inProgressCount = tasks.filter((t) => t.status === "in_progress" || t.status === "blocked").length

  return (
    <div>
      <motion.div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex gap-2 flex-wrap">
          <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => onFilterChange("all")}>
            Todas ({tasks.length})
          </Button>
          <Button
            variant={filter === "in-progress" ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange("in-progress")}
          >
            En Progreso ({inProgressCount})
          </Button>
          <Button
            variant={filter === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange("completed")}
          >
            Completadas ({completedCount})
          </Button>
        </div>
        <Button onClick={onAddTask} disabled={isProjectClosed}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Agregar Tarea
        </Button>
      </motion.div>

      <AnimatePresence mode="popLayout">
        <motion.div
          className="space-y-3"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
        >
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              resources={resources}
              assignments={assignments}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              isProjectClosed={isProjectClosed} // Pass closed status to task card
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {filteredTasks.length === 0 && (
        <motion.div
          className="text-center py-12 text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          No se encontraron tareas para este filtro
        </motion.div>
      )}
    </div>
  )
}

"use client"

import { FolderIcon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Project, Task } from "@/lib/project-types"
import { calculateProjectProgress, formatPercentage } from "@/lib/project-utils"
import { motion } from "framer-motion"

interface ProjectListProps {
  projects: Project[]
  tasks: Task[]
  selectedProjectId: number
  onSelectProject: (projectId: number) => void
  onAddProject: () => void
}

export function ProjectList({ projects, tasks, selectedProjectId, onSelectProject, onAddProject }: ProjectListProps) {
  return (
    <aside className="w-72 md:w-80 border-r border-border bg-card overflow-y-auto h-full">
      <div className="p-3 md:p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wide">Proyectos</h2>
          <Button size="sm" onClick={onAddProject} className="h-7 px-2">
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
        <motion.div
          className="space-y-2"
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
          {projects.map((project) => {
            const projectTasks = tasks.filter((t) => t.project_id === project.id)
            const completedTasks = projectTasks.filter((t) => t.completed).length
            const progress = calculateProjectProgress(projectTasks)

            return (
              <motion.button
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className={`w-full text-left p-2.5 md:p-3 rounded-lg border transition-colors ${
                  selectedProjectId === project.id
                    ? "bg-accent border-accent-foreground/20"
                    : "bg-background border-border hover:bg-accent/50"
                }`}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <div className="flex items-start gap-2 md:gap-3">
                  <FolderIcon className="h-4 md:h-5 w-4 md:w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm md:text-base text-foreground truncate">{project.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>
                        {completedTasks}/{projectTasks.length} tareas
                      </span>
                      <span>•</span>
                      <span>{formatPercentage(progress)}</span>
                    </div>
                    <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </motion.div>
      </div>
    </aside>
  )
}

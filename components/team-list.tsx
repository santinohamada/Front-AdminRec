"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { TeamMember, Task } from "@/lib/project-types"

interface TeamListProps {
  teamMembers: TeamMember[]
  tasks: Task[]
}

export function TeamList({ teamMembers, tasks }: TeamListProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-6">Miembros del Equipo</h3>

      <div className="grid gap-4">
        {teamMembers.map((member) => {
          const memberTasks = tasks.filter((t) => t.assignee_id === member.id)
          const completedTasks = memberTasks.filter((t) => t.completed).length

          return (
            <Card key={member.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{member.name}</h4>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                    <p className="text-sm text-muted-foreground mt-1">{member.email}</p>

                    {memberTasks.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-foreground mb-2">
                          Tareas Asignadas ({completedTasks}/{memberTasks.length} completadas):
                        </p>
                        <div className="space-y-1">
                          {memberTasks.map((task) => (
                            <div key={task.id} className="text-sm text-muted-foreground flex items-center gap-2">
                              <div
                                className={`h-2 w-2 rounded-full ${task.completed ? "bg-green-500" : "bg-yellow-500"}`}
                              />
                              {task.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Badge variant="outline">
                  {memberTasks.length} {memberTasks.length === 1 ? "tarea" : "tareas"}
                </Badge>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

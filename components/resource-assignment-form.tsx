"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Task, Resource, ResourceAssignment } from "@/lib/project-types"
import { calculateResourceHoursLeft } from "@/lib/project-utils"

interface ResourceAssignmentFormProps {
  tasks: Task[]
  resources: Resource[]
  assignments: ResourceAssignment[]
  onAssign: (assignment: Omit<ResourceAssignment, "id">) => void
  onCancel: () => void
}

export function ResourceAssignmentForm({
  tasks,
  resources,
  assignments,
  onAssign,
  onCancel,
}: ResourceAssignmentFormProps) {
  const [taskId, setTaskId] = useState<number>(tasks[0]?.id || 0)
  const [resourceId, setResourceId] = useState<number>(resources[0]?.id || 0)
  const [hours, setHours] = useState<number>(0)

  const selectedResource = resources.find((r) => r.id === resourceId)
  const hoursLeft = selectedResource ? calculateResourceHoursLeft(resourceId, selectedResource, assignments) : 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (hours <= 0) {
      alert("Hours must be greater than 0")
      return
    }

    if (hours > hoursLeft) {
      alert(`Resource only has ${hoursLeft} hours available`)
      return
    }

    onAssign({ task_id: taskId, resource_id: resourceId, hours_assigned: hours })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Task</label>
        <select
          className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground"
          value={taskId}
          onChange={(e) => setTaskId(Number(e.target.value))}
        >
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Resource</label>
        <select
          className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground"
          value={resourceId}
          onChange={(e) => setResourceId(Number(e.target.value))}
        >
          {resources.map((resource) => (
            <option key={resource.id} value={resource.id}>
              {resource.name} ({resource.type})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Hours to Assign (Available: {hoursLeft}h)
        </label>
        <Input type="number" min="0" max={hoursLeft} value={hours} onChange={(e) => setHours(Number(e.target.value))} />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1">
          Assign Resource
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
          Cancel
        </Button>
      </div>
    </form>
  )
}

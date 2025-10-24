export interface Project {
  id: number
  name: string
  description: string
  start_date: string
  end_date: string
  total_budget: number
  manager_id: number
  status: "active" | "planning" | "on-hold" | "completed" | "closed" // Added "closed" status
}

export interface Task {
  id: number
  project_id: number
  title: string
  description: string
  assignee: string
  start_date: string
  due_date: string
  status: "not_started" | "in_progress" | "blocked" | "completed"
  progress: number // 0-100
  estimated_hours: number
  budget_allocated: number
}

export interface Resource {
  id: number
  name: string
  type: "Humano" | "Material"
  hourly_rate: number
  availability_hours: number
}

export interface TeamMember {
  id: number
  name: string
  role: string
  email: string
}

export interface ResourceAssignment {
  id: number
  task_id: number
  resource_id: number
  hours_assigned: number
  hours_actual: number
  start_date: string // Added start and end dates for each resource assignment
  end_date: string
}

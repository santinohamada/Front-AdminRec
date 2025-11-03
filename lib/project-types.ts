export type TaskStatus = "not_started" | "in_progress" | "completed" | "blocked";
export type ProjectStatus = "active" | "paused" | "closed";
export type ResourceType = "human" | "infrastructure" | "software";
export type UUID = string; // Usaremos strings para los IDs

export interface TeamMember {
  id: UUID;
  name: string;
  dni: string;
  phone: string;
  email: string;
  domicilio:string;
  password:string
}

// Resuelta la referencia circular: Manager tiene project_ids
export interface Manager {
  id: UUID;
  name: string;
  email: string;
  project_ids: UUID[]; // <- ID en lugar de objeto
}

export interface Project {
  id: UUID;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  total_budget: number;
  manager_id: UUID; // <- ID en lugar de objeto
  status: ProjectStatus;
}

export interface Task {
  id: UUID;
  project_id: UUID; // <- ID en lugar de objeto
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  assignee_id: UUID; // <- ID en lugar de objeto (se busca en TeamMember)
  priority: "low" | "medium" | "high";
  status: TaskStatus;
  completed: boolean;
  progress: number;
  budget_allocated: number;
  estimated_hours: number;
}

export interface Resource {
  id: UUID;
  name: string;
  type: ResourceType;
  hourly_rate: number;
  assigned_hours: number;
  available_hours: number;
  total_hours: number;
  
}

// Entidad "Puente" normalizada. Solo IDs.
export interface ResourceAssignment {
  id: UUID;
  task_id: UUID; // <- ID en lugar de objeto
  resource_id: UUID; // <- ID en lugar de objeto
  hours_assigned: number;
  start_date: string;
  end_date: string;
}

// Tipos para los formularios (sin ID)
// NewResourceAssignment ahora incluye los IDs
export type NewProject = Omit<Project, "id">;
export type NewTask = Omit<Task, "id">;
export type NewResource = Omit<Resource, "id">;
export type NewResourceAssignment = Omit<ResourceAssignment, "id">;
export type NewTeamMember = Omit<TeamMember, "id">


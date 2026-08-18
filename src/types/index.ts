export interface User {
  id: string
  name: string
  email: string
  avatar: string
}

export type ProjectStatus = "active" | "done"

export type Role = "owner" | "member"

export interface ProjectMember {
  userId: string
  role: Role
}

export interface Project {
  id: string
  name: string
  description: string
  ownerId: string
  members: ProjectMember[]
  status: ProjectStatus
  progress: number
  createdAt: string
}

export type TaskStatus = "todo" | "in_progress" | "done"
export type TaskPriority = "low" | "medium" | "high"

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  projectId: string | number
  assigneeId: string | number | null
  dueDate: string | null
  createdAt: string
}

export type ModalName = "createProject" | "createTask" | "editTask" | null

export interface ModalData {
  projectId?: string
  task?: Task
  [key: string]: unknown
}

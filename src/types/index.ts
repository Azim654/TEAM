export interface User {
  id: string
  name: string
  email: string
  avatar: string
}

export type ProjectStatus = "active" | "done"

export type Role = "owner" | "member"

export type Permission =
  | "manage_project"
  | "view_tasks"
  | "create_tasks"
  | "edit_tasks"
  | "delete_tasks"
  | "assign_tasks"
  | "manage_members"
  | "manage_roles"
  | "view_analytics"

export interface ProjectRole {
  id: string
  name: string
  level: number
  permissions: Permission[]
  isBuiltIn?: boolean
}

export interface ProjectMember {
  [x: string]: string
  userId: string
  roleId: string
}

export interface Workspace {
  id: string
  name: string
  description: string
  ownerId: string
  joinCode: string
  createdAt: string
}

export interface Project {
  id: string
  name: string
  description: string
  ownerId: string
  members: ProjectMember[]
  roles: ProjectRole[]
  status: ProjectStatus
  progress: number
  createdAt: string
  joinCode: string
  workspaceId: string | null
}

export interface Board {
  id: string
  projectId: string
  name: string
  description: string
  createdAt: string
}

export type TaskStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "review"
  | "testing"
  | "done"
export type TaskPriority = "low" | "medium" | "high"
export const STORY_POINTS = [1, 2, 3, 5, 8, 13, 21] as const
export type StoryPoint = (typeof STORY_POINTS)[number]

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  storyPoint: StoryPoint | null
  projectId: string | number
  boardId: string
  assigneeId: string | number | null
  dueDate: string | null
  createdAt: string
}

export type ActivityAction =
  | "created"
  | "status_changed"
  | "assignee_changed"
  | "due_date_changed"
  | "story_point_changed"
  | "comment_added"

export interface ActivityLogEntry {
  id: string
  taskId: string
  userId: string
  action: ActivityAction
  meta: Record<string, string | number | null>
  createdAt: string
}

export type ModalName = "createProject" | "createTask" | "editTask" | null

export interface ModalData {
  projectId?: string
  task?: Task
  [key: string]: unknown
}
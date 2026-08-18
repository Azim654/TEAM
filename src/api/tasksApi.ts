import { api } from "./client"
import type { Task, TaskStatus } from "../types"

export const tasksApi = {
  getAll: () => api.get<Task[]>("/tasks"),
  getById: (id: string) => api.get<Task>(`/tasks/${id}`),
  create: (task: Omit<Task, "id" | "createdAt">) =>
    api.post<Task>("/tasks", { ...task, createdAt: new Date().toISOString() }),
  update: (id: string, updates: Partial<Task>) => api.patch<Task>(`/tasks/${id}`, updates),
  updateStatus: (id: string, status: TaskStatus) =>
    api.patch<Task>(`/tasks/${id}`, { status }),
  remove: (id: string) => api.delete<null>(`/tasks/${id}`),
}

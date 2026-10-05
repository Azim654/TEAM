import { api } from "./client"
import type { ActivityLogEntry } from "../types"

export const activityApi = {
  getByTask: (taskId: string) =>
    api.get<ActivityLogEntry[]>(`/activityLog?taskId=${encodeURIComponent(taskId)}`),
  create: (entry: Omit<ActivityLogEntry, "id" | "createdAt">) =>
    api.post<ActivityLogEntry>("/activityLog", {
      ...entry,
      createdAt: new Date().toISOString(),
    }),
}
import { api } from "./client"
import type { Project } from "../types"

export const projectsApi = {
  getAll: () => api.get<Project[]>("/projects"),
  getById: (id: string) => api.get<Project>(`/projects/${id}`),
  create: (project: Pick<Project, "name" | "description" | "ownerId" | "members">) =>
    api.post<Project>("/projects", {
      ...project,
      progress: 0,
      status: "active",
      createdAt: new Date().toISOString(),
    }),
  update: (id: string, updates: Partial<Project>) =>
    api.patch<Project>(`/projects/${id}`, updates),
  remove: (id: string) => api.delete<null>(`/projects/${id}`),
}

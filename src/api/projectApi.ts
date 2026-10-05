import { api } from "./client"
import type { Project } from "../types"

export const projectsApi = {
  getAll: () => api.get<Project[]>("/projects"),
  getById: (id: string) => api.get<Project>(`/projects/${id}`),
  getByJoinCode: async (code: string): Promise<Project | null> => {
    const matches = await api.get<Project[]>(
      `/projects?joinCode=${encodeURIComponent(code)}`
    )
    return matches[0] ?? null
  },
  create: (
  project: Pick<Project,"name" | "description" | "ownerId" | "members" | "roles" | "joinCode" >
  ) =>
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
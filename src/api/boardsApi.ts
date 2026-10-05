import { api } from "./client"
import type { Board } from "../types"

export const boardsApi = {
  getByProject: (projectId: string) =>
    api.get<Board[]>(`/boards?projectId=${encodeURIComponent(projectId)}`),
  getById: (id: string) => api.get<Board>(`/boards/${id}`),
  create: (board: Pick<Board, "projectId" | "name" | "description">) =>
    api.post<Board>("/boards", {
      ...board,
      createdAt: new Date().toISOString(),
    }),
  update: (id: string, updates: Partial<Board>) =>
    api.patch<Board>(`/boards/${id}`, updates),
  remove: (id: string) => api.delete<null>(`/boards/${id}`),
}
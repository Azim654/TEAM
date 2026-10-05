import { create } from "zustand"
import { activityApi } from "../api/activityApi"
import { useAuthStore } from "./useAuthStore"
import type { ActivityAction, ActivityLogEntry } from "../types"

interface ActivityState {
  entries: ActivityLogEntry[]
  loading: boolean
  error: string | null

  fetchByTask: (taskId: string) => Promise<void>
  logAction: (
    taskId: string,
    action: ActivityAction,
    meta?: Record<string, string | number | null>
  ) => Promise<void>
  addComment: (taskId: string, text: string) => Promise<void>
  getByTask: (taskId: string) => ActivityLogEntry[]
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  entries: [],
  loading: false,
  error: null,

  fetchByTask: async (taskId) => {
    set({ loading: true, error: null })
    try {
      const taskEntries = await activityApi.getByTask(taskId)
      set((state) => ({
        entries: [...state.entries.filter((e) => e.taskId !== taskId), ...taskEntries],
        loading: false,
      }))
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  logAction: async (taskId, action, meta = {}) => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) return
    try {
      const entry = await activityApi.create({ taskId, userId, action, meta })
      set((state) => ({ entries: [...state.entries, entry] }))
    } catch {
      // История — вспомогательная функция: если запись лога не удалась,
      // основное действие (смена статуса, создание задачи и т.д.) не должно откатываться.
    }
  },

  addComment: async (taskId, text) => {
    const trimmed = text.trim()
    if (!trimmed) return
    await get().logAction(taskId, "comment_added", { text: trimmed })
  },

  getByTask: (taskId) =>
    get()
      .entries.filter((e) => e.taskId === taskId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
}))
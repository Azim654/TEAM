import { create } from "zustand"
import { tasksApi } from "../api/tasksApi"
import type { Task, TaskStatus } from "../types"

interface TaskState {
  tasks: Task[]
  loading: boolean
  loaded: boolean
  error: string | null

  fetchTasks: (force?: boolean) => Promise<void>
  createTask: (task: Omit<Task, "id" | "createdAt">) => Promise<Task>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>
  removeTask: (id: string) => Promise<void>
  getTasksByStatus: (status: TaskStatus) => Task[]
  getTasksByProject: (projectId: string | number) => Task[]
}

let inFlightFetch: Promise<void> | null = null

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  loaded: false,
  error: null,

  fetchTasks: async (force = false) => {
    if (get().loaded && !force) return
    if (inFlightFetch) return inFlightFetch

    set({ loading: true, error: null })
    inFlightFetch = (async () => {
      try {
        const tasks = await tasksApi.getAll()
        set({ tasks, loading: false, loaded: true })
      } catch (e) {
        set({ error: (e as Error).message, loading: false })
      } finally {
        inFlightFetch = null
      }
    })()
    return inFlightFetch
  },

  createTask: async (task) => {
    // Если начальная загрузка ещё не завершилась — дожидаемся её,
    // чтобы не создать задачу поверх состояния, которое вот-вот
    // будет затёрто пришедшим ответом сервера.
    if (inFlightFetch) await inFlightFetch
    const newTask = await tasksApi.create(task)
    set((state) => ({ tasks: [...state.tasks, newTask] }))
    return newTask
  },

  updateTask: async (id, updates) => {
    if (inFlightFetch) await inFlightFetch
    const prev = get().tasks
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))
    try {
      await tasksApi.update(id, updates)
    } catch (e) {
      set({ tasks: prev, error: (e as Error).message })
    }
  },

  updateTaskStatus: async (id, status) => {
    if (inFlightFetch) await inFlightFetch
    const prev = get().tasks
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
    }))
    try {
      await tasksApi.updateStatus(id, status)
    } catch {
      set({ tasks: prev })
    }
  },

  removeTask: async (id) => {
    if (inFlightFetch) await inFlightFetch
    await tasksApi.remove(id)
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }))
  },

  getTasksByStatus: (status) => get().tasks.filter((t) => t.status === status),

  getTasksByProject: (projectId) =>
    get().tasks.filter((t) => String(t.projectId) === String(projectId)),
}))

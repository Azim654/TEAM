import { create } from "zustand"
import { tasksApi } from "../api/tasksApi"
import { useProjectStore } from "./useProjectStore"
import { useActivityStore } from "./useActivityStore"
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
  getTasksByBoard: (boardId: string) => Task[]
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
        await useProjectStore.getState().fetchProjects()
        const visibleProjectIds = new Set(
          useProjectStore.getState().projects.map((p) => String(p.id))
        )

        const allTasks = await tasksApi.getAll()
        const tasks = allTasks.filter((t) => visibleProjectIds.has(String(t.projectId)))
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
    if (inFlightFetch) await inFlightFetch
    const newTask = await tasksApi.create(task)
    set((state) => ({ tasks: [...state.tasks, newTask] }))
    useActivityStore.getState().logAction(newTask.id, "created")
    return newTask
  },

  updateTask: async (id, updates) => {
    if (inFlightFetch) await inFlightFetch
    const prev = get().tasks
    const prevTask = prev.find((t) => t.id === id)
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))
    try {
      await tasksApi.update(id, updates)
      if (prevTask) {
        const activity = useActivityStore.getState()
        if ("assigneeId" in updates && updates.assigneeId !== prevTask.assigneeId) {
          activity.logAction(id, "assignee_changed", {
            from: prevTask.assigneeId ?? null,
            to: updates.assigneeId ?? null,
          })
        }
        if ("dueDate" in updates && updates.dueDate !== prevTask.dueDate) {
          activity.logAction(id, "due_date_changed", {
            from: prevTask.dueDate,
            to: updates.dueDate ?? null,
          })
        }
        if ("storyPoint" in updates && updates.storyPoint !== prevTask.storyPoint) {
          activity.logAction(id, "story_point_changed", {
            from: prevTask.storyPoint,
            to: updates.storyPoint ?? null,
          })
        }
      }
    } catch (e) {
      set({ tasks: prev, error: (e as Error).message })
    }
  },

  updateTaskStatus: async (id, status) => {
    if (inFlightFetch) await inFlightFetch
    const prev = get().tasks
    const prevTask = prev.find((t) => t.id === id)
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
    }))
    try {
      await tasksApi.updateStatus(id, status)
      if (prevTask && prevTask.status !== status) {
        useActivityStore.getState().logAction(id, "status_changed", {
          from: prevTask.status,
          to: status,
        })
      }
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

  getTasksByBoard: (boardId) =>
    get().tasks.filter((t) => String(t.boardId) === String(boardId)),
}))
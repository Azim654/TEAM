import { create } from "zustand"
import i18n from "../i18n"
import { boardsApi } from "../api/boardsApi"
import { useTaskStore } from "./useTaskStore"
import type { Board } from "../types"

interface BoardState {
  boards: Board[]
  loading: boolean
  error: string | null

  fetchBoardsByProject: (projectId: string) => Promise<void>
  createBoard: (board: Pick<Board, "projectId" | "name" | "description">) => Promise<Board>
  renameBoard: (id: string, updates: Partial<Pick<Board, "name" | "description">>) => Promise<void>
  removeBoard: (id: string) => Promise<void>
  getBoardsByProject: (projectId: string) => Board[]
}

export const useBoardStore = create<BoardState>((set, get) => ({
  boards: [],
  loading: false,
  error: null,

  fetchBoardsByProject: async (projectId) => {
    set({ loading: true, error: null })
    try {
      const projectBoards = await boardsApi.getByProject(projectId)
      set((state) => ({
        boards: [
          ...state.boards.filter((b) => b.projectId !== projectId),
          ...projectBoards,
        ],
        loading: false,
      }))
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  createBoard: async (board) => {
    if (!board.name.trim()) throw new Error(i18n.t("boards.errorNameRequired"))
    const newBoard = await boardsApi.create(board)
    set((state) => ({ boards: [...state.boards, newBoard] }))
    return newBoard
  },

  renameBoard: async (id, updates) => {
    const updated = await boardsApi.update(id, updates)
    set((state) => ({
      boards: state.boards.map((b) => (b.id === id ? updated : b)),
    }))
  },

  removeBoard: async (id) => {
    const boards = get().boards
    if (boards.filter((b) => b.projectId === boards.find((x) => x.id === id)?.projectId).length <= 1) {
      throw new Error(i18n.t("boards.errorLastBoard"))
    }

    const tasksToRemove = useTaskStore.getState().tasks.filter(
      (t) => String(t.boardId) === String(id)
    )
    await Promise.all(
      tasksToRemove.map((t) => useTaskStore.getState().removeTask(String(t.id)))
    )

    await boardsApi.remove(id)
    set((state) => ({ boards: state.boards.filter((b) => b.id !== id) }))
  },

  getBoardsByProject: (projectId) =>
    get().boards.filter((b) => b.projectId === projectId),
}))
import { create } from "zustand"
import { usersApi } from "../api/usersApi"
import type { User } from "../types"

interface UsersState {
  byId: Record<string, User>
  allUsers: User[]
  allUsersLoaded: boolean
  loading: boolean

  fetchUsers: (ids: string[]) => Promise<void>
  fetchAllUsers: () => Promise<void>
  getUser: (id: string) => User | undefined
}

export const useUsersStore = create<UsersState>((set, get) => ({
  byId: {},
  allUsers: [],
  allUsersLoaded: false,
  loading: false,

  fetchUsers: async (ids) => {
    const missing = ids.filter((id) => !get().byId[id])
    if (missing.length === 0) return

    set({ loading: true })
    try {
      const users = await usersApi.getByIds(missing)
      set((state) => ({
        byId: {
          ...state.byId,
          ...Object.fromEntries(users.map((u) => [u.id, u])),
        },
        loading: false,
      }))
    } catch {
      set({ loading: false })
    }
  },

  fetchAllUsers: async () => {
    if (get().allUsersLoaded) return
    try {
      const users = await usersApi.getAll()
      set((state) => ({
        allUsers: users,
        allUsersLoaded: true,
        byId: {
          ...state.byId,
          ...Object.fromEntries(users.map((u) => [u.id, u])),
        },
      }))
    } catch {
      set({ allUsersLoaded: false })
    }
  },

  getUser: (id) => get().byId[id],
}))

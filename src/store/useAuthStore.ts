import { create } from "zustand"
import { persist } from "zustand/middleware"
import { authApi } from "../api/Auth"
import type { User } from "../types"

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null

  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (updates: Partial<User>) => Promise<void>
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      error: null,

      login: async (email, password) => {
        set({ loading: true, error: null })
        try {
          const { user, token } = await authApi.login(email, password)
          localStorage.setItem("auth-token", token)
          set({ user, token, loading: false })
        } catch (e) {
          set({ error: (e as Error).message, loading: false })
        }
      },

      register: async (name, email, password) => {
        set({ loading: true, error: null })
        try {
          const { user, token } = await authApi.register(name, email, password)
          localStorage.setItem("auth-token", token)
          set({ user, token, loading: false })
        } catch (e) {
          set({ error: (e as Error).message, loading: false })
        }
      },

      logout: () => {
        localStorage.removeItem("auth-token")
        set({ user: null, token: null })
      },

      updateUser: async (updates) => {
        const current = get().user
        if (!current) return
        set({ loading: true, error: null })
        try {
          const user = await authApi.updateProfile(current.id, updates)
          set({ user, loading: false })
        } catch (e) {
          set({ error: (e as Error).message, loading: false })
        }
      },

      isAuthenticated: () => !!get().token,
    }),
    { name: "auth-storage" }
  )
)

import { create } from "zustand"
import { persist } from "zustand/middleware"

type Theme = "light" | "dark"

interface ThemeState {
  theme: Theme
  toggleTheme: () => void
  initTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "light",

      toggleTheme: () => {
        const newTheme: Theme = get().theme === "light" ? "dark" : "light"
        document.documentElement.setAttribute("data-theme", newTheme)
        set({ theme: newTheme })
      },

      initTheme: () => {
        document.documentElement.setAttribute("data-theme", get().theme)
      },
    }),
    { name: "theme-storage" }
  )
)

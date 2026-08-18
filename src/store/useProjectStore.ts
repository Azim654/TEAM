import { create } from "zustand"
import i18n from "../i18n"
import { projectsApi } from "../api/projectApi"
import { authApi } from "../api/Auth"
import type { Project, ProjectMember, Role } from "../types"

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  loading: boolean
  loaded: boolean
  error: string | null
  memberError: string | null
  memberLoading: boolean

  fetchProjects: (force?: boolean) => Promise<void>
  fetchProjectById: (id: string) => Promise<void>
  createProject: (
    project: Pick<Project, "name" | "description" | "ownerId" | "members">
  ) => Promise<Project>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  removeProject: (id: string) => Promise<void>

  inviteMember: (projectId: string, email: string) => Promise<void>
  removeMember: (projectId: string, userId: string) => Promise<void>
  changeMemberRole: (projectId: string, userId: string, role: Role) => Promise<void>
  getMemberRole: (project: Project, userId: string) => Role | null
}

let inFlightFetch: Promise<void> | null = null

async function waitForInFlightFetch() {
  if (inFlightFetch) await inFlightFetch
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,
  loaded: false,
  error: null,
  memberError: null,
  memberLoading: false,

  fetchProjects: async (force = false) => {
    if (get().loaded && !force) return
    if (inFlightFetch) return inFlightFetch

    set({ loading: true, error: null })
    inFlightFetch = (async () => {
      try {
        const projects = await projectsApi.getAll()
        set({ projects, loading: false, loaded: true })
      } catch (e) {
        set({ error: (e as Error).message, loading: false })
      } finally {
        inFlightFetch = null
      }
    })()
    return inFlightFetch
  },

  fetchProjectById: async (id) => {
    set({ loading: true, error: null })
    try {
      const project = await projectsApi.getById(id)
      set({ currentProject: project, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  createProject: async (project) => {
    await waitForInFlightFetch()
    const newProject = await projectsApi.create(project)
    set((state) => ({ projects: [...state.projects, newProject] }))
    return newProject
  },

  updateProject: async (id, updates) => {
    await waitForInFlightFetch()
    const updated = await projectsApi.update(id, updates)
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? updated : p)),
      currentProject: state.currentProject?.id === id ? updated : state.currentProject,
    }))
  },

  removeProject: async (id) => {
    await waitForInFlightFetch()
    await projectsApi.remove(id)
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    }))
  },

  inviteMember: async (projectId, email) => {
    set({ memberError: null, memberLoading: true })
    try {
      await waitForInFlightFetch()
      const project = get().currentProject
      if (!project || project.id !== projectId) throw new Error(i18n.t("projects.errorNotFound"))

      const user = await authApi.findByEmail(email.trim())
      if (!user) {
        throw new Error(i18n.t("members.errorUserNotFound"))
      }
      if (project.members.some((m) => m.userId === user.id)) {
        throw new Error(i18n.t("members.errorAlreadyMember"))
      }

      const newMember: ProjectMember = { userId: user.id, role: "member" }
      const updated = await projectsApi.update(projectId, {
        members: [...project.members, newMember],
      })
      set((state) => ({
        currentProject: updated,
        projects: state.projects.map((p) => (p.id === projectId ? updated : p)),
        memberLoading: false,
      }))
    } catch (e) {
      set({ memberError: (e as Error).message, memberLoading: false })
      throw e
    }
  },

  removeMember: async (projectId, userId) => {
    set({ memberError: null, memberLoading: true })
    try {
      await waitForInFlightFetch()
      const project = get().currentProject
      if (!project || project.id !== projectId) throw new Error(i18n.t("projects.errorNotFound"))

      const updated = await projectsApi.update(projectId, {
        members: project.members.filter((m) => m.userId !== userId),
      })
      set((state) => ({
        currentProject: updated,
        projects: state.projects.map((p) => (p.id === projectId ? updated : p)),
        memberLoading: false,
      }))
    } catch (e) {
      set({ memberError: (e as Error).message, memberLoading: false })
      throw e
    }
  },

  changeMemberRole: async (projectId, userId, role) => {
    set({ memberError: null, memberLoading: true })
    try {
      await waitForInFlightFetch()
      const project = get().currentProject
      if (!project || project.id !== projectId) throw new Error(i18n.t("projects.errorNotFound"))

      const updated = await projectsApi.update(projectId, {
        members: project.members.map((m) => (m.userId === userId ? { ...m, role } : m)),
      })
      set((state) => ({
        currentProject: updated,
        projects: state.projects.map((p) => (p.id === projectId ? updated : p)),
        memberLoading: false,
      }))
    } catch (e) {
      set({ memberError: (e as Error).message, memberLoading: false })
      throw e
    }
  },

  getMemberRole: (project, userId) =>
    project.members.find((m) => m.userId === userId)?.role ?? null,
}))

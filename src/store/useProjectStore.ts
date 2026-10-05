import { create } from "zustand"
import i18n from "../i18n"
import { projectsApi } from "../api/projectApi"
import { boardsApi } from "../api/boardsApi"
import { useAuthStore } from "./useAuthStore"
import { createDefaultRoles, OWNER_ROLE_ID, DEFAULT_MEMBER_ROLE_ID } from "../utils/permissions"
import type { Project, ProjectMember, ProjectRole } from "../types"

function isProjectVisibleToUser(project: Project, userId: string | undefined): boolean {
  if (!userId) return false
  return project.ownerId === userId || project.members.some((m) => m.userId === userId)
}

const JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

function generateJoinCode(length = 6): string {
  let code = ""
  for (let i = 0; i < length; i++) {
    code += JOIN_CODE_ALPHABET[Math.floor(Math.random() * JOIN_CODE_ALPHABET.length)]
  }
  return code
}

async function generateUniqueJoinCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateJoinCode()
    const existing = await projectsApi.getByJoinCode(candidate)
    if (!existing) return candidate
  }
  return generateJoinCode(8)
}

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
    project: Pick<Project, "name" | "description" | "ownerId" | "workspaceId">
  ) => Promise<Project>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  removeProject: (id: string) => Promise<void>

  joinProjectByCode: (code: string) => Promise<Project>
  regenerateJoinCode: (projectId: string) => Promise<void>
  removeMember: (projectId: string, userId: string) => Promise<void>
  changeMemberRole: (projectId: string, userId: string, roleId: string) => Promise<void>

  createRole: (
    projectId: string,
    role: Pick<ProjectRole, "name" | "level" | "permissions">
  ) => Promise<ProjectRole>
  updateRole: (
    projectId: string,
    roleId: string,
    updates: Partial<Pick<ProjectRole, "name" | "level" | "permissions">>
  ) => Promise<void>
  removeRole: (projectId: string, roleId: string) => Promise<void>
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
        const allProjects = await projectsApi.getAll()
        const userId = useAuthStore.getState().user?.id
        const projects = allProjects.filter((p) => isProjectVisibleToUser(p, userId))
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
    set({ loading: true, error: null, currentProject: null })
    try {
      const project = await projectsApi.getById(id)
      const userId = useAuthStore.getState().user?.id
      if (!isProjectVisibleToUser(project, userId)) {
        set({ currentProject: null, loading: false, error: i18n.t("projects.errorAccessDenied") })
        return
      }
      set({ currentProject: project, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  createProject: async (project) => {
    await waitForInFlightFetch()
    const joinCode = await generateUniqueJoinCode()
    const roles = createDefaultRoles()
    const members: ProjectMember[] = [{ userId: project.ownerId, roleId: OWNER_ROLE_ID }]
    const newProject = await projectsApi.create({ ...project, joinCode, roles, members })
    set((state) => ({ projects: [...state.projects, newProject] }))
    try {
      await boardsApi.create({
        projectId: newProject.id,
        name: i18n.t("boards.defaultName"),
        description: "",
      })
    } catch {
      // Проект уже создан и виден пользователю — он всегда сможет
      // создать доску вручную, поэтому здесь не бросаем ошибку дальше.
    }
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

  joinProjectByCode: async (code) => {
    set({ memberError: null, memberLoading: true })
    try {
      const trimmed = code.trim().toUpperCase()
      if (!trimmed) throw new Error(i18n.t("projects.errorJoinCodeRequired"))

      const project = await projectsApi.getByJoinCode(trimmed)
      if (!project) throw new Error(i18n.t("projects.errorJoinCodeNotFound"))

      const userId = useAuthStore.getState().user?.id
      if (!userId) throw new Error(i18n.t("projects.errorNotFound"))

      if (project.members.some((m) => m.userId === userId)) {
        set((state) => ({
          projects: state.projects.some((p) => p.id === project.id)
            ? state.projects
            : [...state.projects, project],
          memberLoading: false,
        }))
        return project
      }

      const newMember: ProjectMember = { userId, roleId: DEFAULT_MEMBER_ROLE_ID }
      const updated = await projectsApi.update(project.id, {
        members: [...project.members, newMember],
      })
      set((state) => ({
        projects: state.projects.some((p) => p.id === updated.id)
          ? state.projects.map((p) => (p.id === updated.id ? updated : p))
          : [...state.projects, updated],
        memberLoading: false,
      }))
      return updated
    } catch (e) {
      set({ memberError: (e as Error).message, memberLoading: false })
      throw e
    }
  },

  regenerateJoinCode: async (projectId) => {
    set({ memberError: null, memberLoading: true })
    try {
      await waitForInFlightFetch()
      const project = get().currentProject
      if (!project || project.id !== projectId) throw new Error(i18n.t("projects.errorNotFound"))

      const newCode = await generateUniqueJoinCode()
      const updated = await projectsApi.update(projectId, { joinCode: newCode })
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

  changeMemberRole: async (projectId, userId, roleId) => {
    set({ memberError: null, memberLoading: true })
    try {
      await waitForInFlightFetch()
      const project = get().currentProject
      if (!project || project.id !== projectId) throw new Error(i18n.t("projects.errorNotFound"))

      const updated = await projectsApi.update(projectId, {
        members: project.members.map((m) => (m.userId === userId ? { ...m, roleId } : m)),
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

  createRole: async (projectId, role) => {
    set({ memberError: null, memberLoading: true })
    try {
      await waitForInFlightFetch()
      const project = get().currentProject
      if (!project || project.id !== projectId) throw new Error(i18n.t("projects.errorNotFound"))
      if (!role.name.trim()) throw new Error(i18n.t("roles.errorNameRequired"))

      const newRole: ProjectRole = {
        id: `role_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: role.name.trim(),
        level: role.level,
        permissions: role.permissions,
      }
      const updated = await projectsApi.update(projectId, {
        roles: [...project.roles, newRole],
      })
      set((state) => ({
        currentProject: updated,
        projects: state.projects.map((p) => (p.id === projectId ? updated : p)),
        memberLoading: false,
      }))
      return newRole
    } catch (e) {
      set({ memberError: (e as Error).message, memberLoading: false })
      throw e
    }
  },

  updateRole: async (projectId, roleId, updates) => {
    set({ memberError: null, memberLoading: true })
    try {
      await waitForInFlightFetch()
      const project = get().currentProject
      if (!project || project.id !== projectId) throw new Error(i18n.t("projects.errorNotFound"))

      const target = project.roles.find((r) => r.id === roleId)
      if (!target) throw new Error(i18n.t("roles.errorNotFound"))
      if (target.isBuiltIn) throw new Error(i18n.t("roles.errorBuiltInRole"))

      const updated = await projectsApi.update(projectId, {
        roles: project.roles.map((r) => (r.id === roleId ? { ...r, ...updates } : r)),
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

  removeRole: async (projectId, roleId) => {
    set({ memberError: null, memberLoading: true })
    try {
      await waitForInFlightFetch()
      const project = get().currentProject
      if (!project || project.id !== projectId) throw new Error(i18n.t("projects.errorNotFound"))

      const target = project.roles.find((r) => r.id === roleId)
      if (!target) throw new Error(i18n.t("roles.errorNotFound"))
      if (target.isBuiltIn) throw new Error(i18n.t("roles.errorBuiltInRole"))
      if (project.members.some((m) => m.roleId === roleId)) {
        throw new Error(i18n.t("roles.errorRoleInUse"))
      }

      const updated = await projectsApi.update(projectId, {
        roles: project.roles.filter((r) => r.id !== roleId),
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
}))
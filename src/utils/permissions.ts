import i18n from "../i18n"
import type { Permission, Project, ProjectRole } from "../types"

export const OWNER_ROLE_ID = "owner"
export const DEFAULT_MEMBER_ROLE_ID = "member"

export const ALL_PERMISSIONS: Permission[] = [
  "manage_project",
  "view_tasks",
  "create_tasks",
  "edit_tasks",
  "delete_tasks",
  "assign_tasks",
  "manage_members",
  "manage_roles",
  "view_analytics",
]

export function createDefaultRoles(): ProjectRole[] {
  return [
    {
      id: OWNER_ROLE_ID,
      name: i18n.t("roles.defaultOwnerName"),
      level: 1000,
      isBuiltIn: true,
      permissions: [...ALL_PERMISSIONS],
    },
    {
      id: DEFAULT_MEMBER_ROLE_ID,
      name: i18n.t("roles.defaultMemberName"),
      level: 10,
      permissions: ["view_tasks", "create_tasks", "edit_tasks"],
    },
  ]
}

export function getMemberRole(project: Project, userId: string | undefined): ProjectRole | null {
  if (!userId) return null
  const member = project.members.find((m) => m.userId === userId)
  if (!member) return null
  return project.roles.find((r) => r.id === member.roleId) ?? null
}

export function hasPermission(
  project: Project,
  userId: string | undefined,
  permission: Permission
): boolean {
  const role = getMemberRole(project, userId)
  return role?.permissions.includes(permission) ?? false
}

export function getRoleLevel(project: Project, userId: string | undefined): number {
  return getMemberRole(project, userId)?.level ?? -1
}

export function countMembersAtLevel(project: Project, level: number): number {
  return project.members.filter((m) => {
    const role = project.roles.find((r) => r.id === m.roleId)
    return role?.level === level
  }).length
}

export function getMaxRoleLevelInUse(project: Project): number {
  return project.members.reduce((max, m) => {
    const role = project.roles.find((r) => r.id === m.roleId)
    return role ? Math.max(max, role.level) : max
  }, -Infinity)
}

export function canManageMember(
  project: Project,
  actorUserId: string | undefined,
  targetUserId: string,
  targetRole: ProjectRole | null
): boolean {
  if (!actorUserId || actorUserId === targetUserId) return false
  if (!hasPermission(project, actorUserId, "manage_members")) return false
  const actorLevel = getRoleLevel(project, actorUserId)
  if (!targetRole || targetRole.level >= actorLevel) return false
  if (targetRole.level === getMaxRoleLevelInUse(project) && countMembersAtLevel(project, targetRole.level) === 1) {
    return false
  }
  return true
}

export function assignableRoles(project: Project, actorUserId: string | undefined): ProjectRole[] {
  const actorLevel = getRoleLevel(project, actorUserId)
  return project.roles.filter((r) => r.level < actorLevel).sort((a, b) => b.level - a.level)
}
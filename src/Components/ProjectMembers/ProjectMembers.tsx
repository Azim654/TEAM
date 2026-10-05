import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useProjectStore } from "../../store/useProjectStore"
import { useUsersStore } from "../../store/useUsersStore"
import { useAuthStore } from "../../store/useAuthStore"
import Avatar from "../Avatar/Avatar"
import RoleManager from "../RoleManager/RoleManager"
import {
  getMemberRole,
  hasPermission,
  canManageMember,
  assignableRoles,
} from "../../utils/permissions"
import type { Project } from "../../types"

import "./ProjectMembers.scss"

interface ProjectMembersProps {
  project: Project
}

type Tab = "members" | "roles"

function ProjectMembers({ project }: ProjectMembersProps) {
  const { t } = useTranslation()
  const { getUser, fetchUsers } = useUsersStore()
  const { user: currentUser } = useAuthStore()
  const { regenerateJoinCode, removeMember, changeMemberRole, memberError, memberLoading } =
    useProjectStore()

  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<Tab>("members")

  useEffect(() => {
    fetchUsers(project.members.map((m) => m.userId))
  }, [project.members, fetchUsers])

  const canManageMembers = hasPermission(project, currentUser?.id, "manage_members")
  const canManageRoles = hasPermission(project, currentUser?.id, "manage_roles")
  const rolesICanAssign = assignableRoles(project, currentUser?.id)

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(project.joinCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Буфер обмена недоступен — код всё равно виден на экране
    }
  }

  const handleRegenerateCode = () => {
    regenerateJoinCode(project.id).catch(() => {
      // Ошибка уже отражена в memberError
    })
  }

  return (
    <div className="project-members">
      {canManageRoles && (
        <div className="project-members__tabs">
          <button
            type="button"
            className={`project-members__tab ${tab === "members" ? "project-members__tab--active" : ""}`}
            onClick={() => setTab("members")}
          >
            {t("members.title")}
          </button>
          <button
            type="button"
            className={`project-members__tab ${tab === "roles" ? "project-members__tab--active" : ""}`}
            onClick={() => setTab("roles")}
          >
            {t("members.roles")}
          </button>
        </div>
      )}

      {tab === "roles" ? (
        <RoleManager project={project} />
      ) : (
        <>
          <ul className="project-members__list">
            {project.members.map((member) => {
              const person = getUser(member.userId)
              const role = getMemberRole(project, member.userId)
              const isSelf = member.userId === currentUser?.id
              const canManageThis = canManageMember(project, currentUser?.id, member.userId, role)

              return (
                <li key={member.userId} className="project-members__item">
                  <Avatar src={person?.avatar} alt="" size={36} className="avatar--sm" />

                  <div className="project-members__info">
                    <p className="project-members__name">
                      {person?.name ?? "…"}
                      {isSelf && <span className="you-tag">{t("members.you")}</span>}
                    </p>
                    <p className="project-members__email">{person?.email}</p>
                  </div>

                  {canManageThis ? (
                    <select
                      className="project-members__role-select"
                      value={member.roleId}
                      disabled={memberLoading}
                      onChange={(e) => changeMemberRole(project.id, member.userId, e.target.value)}
                    >
                      <option value={member.roleId}>{role?.name ?? "…"}</option>
                      {rolesICanAssign
                        .filter((r) => r.id !== member.roleId)
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <span className="role-badge">{role?.name ?? "…"}</span>
                  )}

                  {canManageThis && (
                    <button
                      type="button"
                      className="project-members__remove"
                      disabled={memberLoading}
                      onClick={() => removeMember(project.id, member.userId)}
                      title={t("members.remove")}
                      aria-label={t("members.remove")}
                    >
                      ✕
                    </button>
                  )}
                </li>
              )
            })}
          </ul>

          {canManageMembers && (
            <div className="project-members__joincode">
              <span className="project-members__joincode-label">
                {t("members.joinCodeTitle")}
              </span>
              <div className="project-members__joincode-row">
                <span className="project-members__joincode-value">{project.joinCode}</span>
                <button type="button" className="btn btn--outline" onClick={handleCopyCode}>
                  {copied ? t("members.copied") : t("members.copyCode")}
                </button>
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={handleRegenerateCode}
                  disabled={memberLoading}
                  title={t("members.regenerateCodeHint")}
                >
                  {t("members.regenerateCode")}
                </button>
              </div>
            </div>
          )}

          {memberError && <div className="auth-error">{memberError}</div>}
        </>
      )}
    </div>
  )
}

export default ProjectMembers
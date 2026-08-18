import { useEffect, useRef, useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { useProjectStore } from "../../store/useProjectStore"
import { useUsersStore } from "../../store/useUsersStore"
import { useAuthStore } from "../../store/useAuthStore"
import Avatar from "../Avatar/Avatar"
import type { Project } from "../../types"

import "./ProjectMembers.scss"

interface ProjectMembersProps {
  project: Project
}

function ProjectMembers({ project }: ProjectMembersProps) {
  const { t } = useTranslation()
  const { getUser, fetchUsers } = useUsersStore()
  const { user: currentUser } = useAuthStore()
  const { inviteMember, removeMember, changeMemberRole, memberError, memberLoading } =
    useProjectStore()

  const roleLabel: Record<string, string> = {
    owner: t("members.roleOwner"),
    member: t("members.roleMember"),
  }

  const [email, setEmail] = useState("")
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchUsers(project.members.map((m) => m.userId))
  }, [project.members, fetchUsers])

  useEffect(() => {
    if (!openMenuId) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [openMenuId])

  const myRole = project.members.find((m) => m.userId === currentUser?.id)?.role
  const isOwner = myRole === "owner"
  const ownerCount = project.members.filter((m) => m.role === "owner").length

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    try {
      await inviteMember(project.id, email.trim())
      setEmail("")
    } catch {
      // Ошибка уже установлена в сторе, просто не сбрасываем поле ввода
    }
  }

  const runAction = (action: () => void) => {
    action()
    setOpenMenuId(null)
  }

  return (
    <div className="project-members">
      <ul className="project-members__list">
        {project.members.map((member) => {
          const person = getUser(member.userId)
          const isSelf = member.userId === currentUser?.id
          const canDemoteOrRemove = isOwner && !(member.role === "owner" && ownerCount === 1)

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

              <span className={`role-badge role-badge--${member.role}`}>
                {roleLabel[member.role]}
              </span>

              {canDemoteOrRemove && (
                <div className="project-members__menu-wrap" ref={openMenuId === member.userId ? menuRef : null}>
                  <button
                    type="button"
                    className="project-members__menu-trigger"
                    disabled={memberLoading}
                    onClick={() => setOpenMenuId(openMenuId === member.userId ? null : member.userId)}
                    aria-label="Действия"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="3.2" r="1.3" fill="currentColor" />
                      <circle cx="8" cy="8" r="1.3" fill="currentColor" />
                      <circle cx="8" cy="12.8" r="1.3" fill="currentColor" />
                    </svg>
                  </button>

                  {openMenuId === member.userId && (
                    <div className="project-members__menu">
                      {member.role === "member" ? (
                        <button
                          type="button"
                          onClick={() =>
                            runAction(() => changeMemberRole(project.id, member.userId, "owner"))
                          }
                        >
                          {t("members.makeOwner")}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            runAction(() => changeMemberRole(project.id, member.userId, "member"))
                          }
                        >
                          {t("members.demote")}
                        </button>
                      )}
                      <button
                        type="button"
                        className="project-members__menu-danger"
                        onClick={() => runAction(() => removeMember(project.id, member.userId))}
                      >
                        {t("members.remove")}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {isOwner && (
        <form className="project-members__invite" onSubmit={handleInvite}>
          <div className="project-members__invite-field">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 4.5h12v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-7Z"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <path d="M2.3 4.8 8 9l5.7-4.2" stroke="currentColor" strokeWidth="1.3" />
            </svg>
            <input
              type="email"
              placeholder={t("members.invitePlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn--primary" disabled={memberLoading}>
            {memberLoading ? "..." : t("members.invite")}
          </button>
        </form>
      )}

      {memberError && <div className="auth-error">{memberError}</div>}
    </div>
  )
}

export default ProjectMembers

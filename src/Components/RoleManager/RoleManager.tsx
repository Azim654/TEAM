import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { useProjectStore } from "../../store/useProjectStore"
import { useAuthStore } from "../../store/useAuthStore"
import { ALL_PERMISSIONS, getRoleLevel } from "../../utils/permissions"
import type { Permission, Project, ProjectRole } from "../../types"

import "./RoleManager.scss"

interface RoleManagerProps {
  project: Project
}

interface FormState {
  name: string
  level: number
  permissions: Permission[]
}

function emptyForm(maxLevel: number): FormState {
  return { name: "", level: Math.max(1, maxLevel - 1), permissions: [] }
}

function RoleManager({ project }: RoleManagerProps) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { createRole, updateRole, removeRole, memberError, memberLoading } = useProjectStore()

  const myLevel = getRoleLevel(project, user?.id)
  const roles = [...project.roles].sort((a, b) => b.level - a.level)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<FormState>(() => emptyForm(myLevel))
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const permissionLabel: Record<Permission, string> = {
    manage_project: t("roles.permManageProject"),
    view_tasks: t("roles.permViewTasks"),
    create_tasks: t("roles.permCreateTasks"),
    edit_tasks: t("roles.permEditTasks"),
    delete_tasks: t("roles.permDeleteTasks"),
    assign_tasks: t("roles.permAssignTasks"),
    manage_members: t("roles.permManageMembers"),
    manage_roles: t("roles.permManageRoles"),
    view_analytics: t("roles.permViewAnalytics"),
  }

  const startCreate = () => {
    setForm(emptyForm(myLevel))
    setFormError(null)
    setEditingId(null)
    setCreating(true)
  }

  const startEdit = (role: ProjectRole) => {
    setForm({ name: role.name, level: role.level, permissions: role.permissions })
    setFormError(null)
    setCreating(false)
    setEditingId(role.id)
  }

  const cancelForm = () => {
    setCreating(false)
    setEditingId(null)
    setFormError(null)
  }

  const togglePermission = (permission: Permission) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setFormError(t("roles.errorNameRequired"))
      return
    }
    if (form.level >= myLevel) {
      setFormError(t("roles.errorLevelTooHigh"))
      return
    }

    setSubmitting(true)
    setFormError(null)
    try {
      if (editingId) {
        await updateRole(project.id, editingId, {
          name: form.name.trim(),
          level: form.level,
          permissions: form.permissions,
        })
      } else {
        await createRole(project.id, {
          name: form.name.trim(),
          level: form.level,
          permissions: form.permissions,
        })
      }
      cancelForm()
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (roleId: string) => {
    try {
      await removeRole(project.id, roleId)
      if (editingId === roleId) cancelForm()
    } catch {
      // Ошибка уже отражена в memberError
    }
  }

  const formOpen = creating || editingId !== null

  return (
    <div className="role-manager">
      <ul className="role-manager__list">
        {roles.map((role) => {
          const canEdit = !role.isBuiltIn && role.level < myLevel
          return (
            <li key={role.id} className="role-manager__item">
              <div className="role-manager__item-info">
                <span className="role-manager__item-name">
                  {role.name}
                  {role.isBuiltIn && (
                    <span className="role-manager__locked" title={t("roles.builtInHint")}>
                      🔒
                    </span>
                  )}
                </span>
                <span className="role-manager__item-meta">
                  {t("roles.level")} {role.level} · {role.permissions.length}{" "}
                  {t("roles.permissionsCount")}
                </span>
              </div>

              {canEdit && (
                <div className="role-manager__item-actions">
                  <button type="button" className="btn btn--outline" onClick={() => startEdit(role)}>
                    {t("common.edit")}
                  </button>
                  <button
                    type="button"
                    className="role-manager__delete"
                    onClick={() => handleDelete(role.id)}
                    disabled={memberLoading}
                    title={t("roles.delete")}
                  >
                    ✕
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {memberError && !formOpen && <div className="auth-error">{memberError}</div>}

      {formOpen ? (
        <form className="role-manager__form" onSubmit={handleSubmit}>
          <h3>{editingId ? t("roles.editTitle") : t("roles.createTitle")}</h3>

          {formError && <div className="auth-error">{formError}</div>}

          <label className="auth-field">
            <span>{t("roles.nameLabel")}</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={t("roles.namePlaceholder")}
              autoFocus
            />
          </label>

          <label className="auth-field">
            <span>
              {t("roles.levelLabel")} ({t("roles.levelHint", { max: myLevel - 1 })})
            </span>
            <input
              type="number"
              min={1}
              max={myLevel - 1}
              value={form.level}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, level: Number(e.target.value) }))
              }
            />
          </label>

          <div className="role-manager__permissions">
            <span className="auth-field__label">{t("roles.permissionsLabel")}</span>
            <div className="role-manager__permissions-grid">
              {ALL_PERMISSIONS.map((permission) => (
                <label key={permission} className="role-manager__permission">
                  <input
                    type="checkbox"
                    checked={form.permissions.includes(permission)}
                    onChange={() => togglePermission(permission)}
                  />
                  {permissionLabel[permission]}
                </label>
              ))}
            </div>
          </div>

          <div className="buttons">
            <button type="button" className="btn btn--outline" onClick={cancelForm}>
              {t("common.cancel")}
            </button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? t("common.saving") : t("common.save")}
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="role-manager__add" onClick={startCreate}>
          + {t("roles.addRole")}
        </button>
      )}
    </div>
  )
}

export default RoleManager
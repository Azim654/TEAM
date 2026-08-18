import { useAuthStore } from "../../store/useAuthStore"
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { useProjectStore } from "../../store/useProjectStore"
import { useTaskStore } from "../../store/useTaskStore"
import Avatar from "../../Components/Avatar/Avatar"

import "./Profile.scss"

function Profile() {
  const { t } = useTranslation()
  const { projects, fetchProjects } = useProjectStore()
  const { tasks, fetchTasks } = useTaskStore()
  const { user, updateUser, loading } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(user?.name ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchProjects()
    fetchTasks()
  }, [fetchProjects, fetchTasks])

  const projectValue = projects.length
  const doneTasks = tasks.filter((t) => t.status === "done").length
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setAvatarError(t("profile.avatarErrorType"))
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError(t("profile.avatarErrorSize"))
      return
    }

    setAvatarError(null)
    const reader = new FileReader()
    reader.onload = () => {
      updateUser({ avatar: reader.result as string })
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await updateUser({ name: name.trim(), email: email.trim() })
    setIsEditing(false)
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar-wrap">
          <Avatar src={user?.avatar} alt={user?.name} size={96} className="profile-avatar" />
          <button
            type="button"
            className="profile-avatar-edit"
            onClick={handleAvatarClick}
            title={t("profile.changeAvatar")}
          >
            ✎
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleAvatarChange}
          />
        </div>
        <div className="profile-info">
          <h1>{user?.name}</h1>
          <p className="profile-email">{user?.email}</p>
        </div>
        <button
          className="btn btn--outline"
          onClick={() => {
            if (isEditing) {
              setName(user?.name ?? "")
              setEmail(user?.email ?? "")
            }
            setIsEditing(!isEditing)
          }}
        >
          {isEditing ? t("profile.cancel") : t("profile.editorial")}
        </button>
      </div>

      {avatarError && <div className="auth-error">{avatarError}</div>}

      <div className="profile-stats">
        <div className="stat-card">
          <span className="stat-card__value">{projectValue}</span>
          <span className="stat-card__label">{t("profile.stats.projects")}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">{doneTasks}</span>
          <span className="stat-card__label">{t("profile.stats.done")}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">{inProgressTasks}</span>
          <span className="stat-card__label">{t("profile.stats.inProgress")}</span>
        </div>
      </div>

      <div className="profile-section">
        <h2>{t("profile.personalData")}</h2>
        <form className="profile-form" onSubmit={handleSubmit}>
          <label className="profile-field">
            <span>{t("profile.name")}</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isEditing}
            />
          </label>
          <label className="profile-field">
            <span>{t("profile.email")}</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!isEditing}
            />
          </label>
          {isEditing && (
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? t("profile.saving") : t("profile.save")}
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

export default Profile

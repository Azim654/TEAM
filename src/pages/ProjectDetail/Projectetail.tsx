import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useProjectStore } from "../../store/useProjectStore"
import { useTaskStore } from "../../store/useTaskStore"
import { useAuthStore } from "../../store/useAuthStore"
import Board from "../../Components/Board/Board"
import ProjectMembers from "../../Components/ProjectMembers/ProjectMembers"
import Modal from "../../Components/Modal/Modal"

import "./ProjectDetail.scss"

function ProjectDetail() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentProject, loading, error, fetchProjectById, updateProject, removeProject } =
    useProjectStore()
  const { fetchTasks } = useTaskStore()
  const { user } = useAuthStore()

  const [teamOpen, setTeamOpen] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const actionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    fetchProjectById(id)
    fetchTasks()
  }, [id, fetchProjectById, fetchTasks])

  useEffect(() => {
    if (!actionsOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setActionsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [actionsOpen])

  if (loading) return <div className="page-loader">{t("common.loading")}</div>
  if (error) return <div className="page-error">{t("common.error")}: {error}</div>
  if (!id) return null
  if (!currentProject) return null

  const isOwner = currentProject.members.some(
    (m) => m.userId === user?.id && m.role === "owner"
  )

  const toggleStatus = () => {
    updateProject(id, {
      status: currentProject.status === "active" ? "done" : "active",
    })
    setActionsOpen(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await removeProject(id)
      navigate("/projects")
    } catch {
      setDeleting(false)
    }
  }

  return (
    <div className="project">
      <button className="project__back" onClick={() => navigate("/projects")}>
        {t("projects.back")}
      </button>

      <div className="project__header">
        <div className="Name">
          <h2>{currentProject.name}</h2>
          <p className="project__description">{currentProject.description}</p>
        </div>

        <div className="project__header-actions">
          <span className={`badge badge--${currentProject.status}`}>
            {currentProject.status === "active"
              ? t("projects.statusActiveBadge")
              : t("projects.statusDoneBadge")}
          </span>

          <button className="project__team-btn" onClick={() => setTeamOpen(true)}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <circle cx="6" cy="5.5" r="2.3" stroke="currentColor" strokeWidth="1.3" />
              <path
                d="M1.6 13c.4-2.4 2.2-4 4.4-4s4 1.6 4.4 4"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
              <path
                d="M10.5 3.4c1.1.3 1.9 1.2 1.9 2.4 0 1.1-.7 2-1.7 2.4M12 9.3c1.6.5 2.7 1.8 3 3.7"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
            {t("projects.teamButton")}
            <span className="project__team-count">{currentProject.members.length}</span>
          </button>

          {isOwner && (
            <div className="project__actions-wrap" ref={actionsRef}>
              <button
                className="project__actions-trigger"
                onClick={() => setActionsOpen((v) => !v)}
                aria-label={t("projects.actionsMenu")}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="3.2" r="1.3" fill="currentColor" />
                  <circle cx="8" cy="8" r="1.3" fill="currentColor" />
                  <circle cx="8" cy="12.8" r="1.3" fill="currentColor" />
                </svg>
              </button>

              {actionsOpen && (
                <div className="project__actions-menu">
                  <button type="button" onClick={toggleStatus}>
                    {currentProject.status === "active"
                      ? t("projects.markDone")
                      : t("projects.markActive")}
                  </button>
                  <button
                    type="button"
                    className="project__actions-danger"
                    onClick={() => {
                      setActionsOpen(false)
                      setDeleteOpen(true)
                    }}
                  >
                    {t("projects.deleteProject")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="boards">
        <Board projectId={id} />
      </div>

      <Modal isOpen={teamOpen} onClose={() => setTeamOpen(false)}>
        <h1>
          {t("members.title")} · {currentProject.members.length}
        </h1>
        <ProjectMembers project={currentProject} />
      </Modal>

      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <h1>{t("projects.deleteConfirmTitle")}</h1>
        <p className="project__delete-text">
          {t("projects.deleteConfirmText", { name: currentProject.name })}
        </p>
        <div className="project__delete-buttons">
          <button
            type="button"
            className="btn btn--outline"
            onClick={() => setDeleteOpen(false)}
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? t("common.saving") : t("projects.deleteConfirmSubmit")}
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default ProjectDetail

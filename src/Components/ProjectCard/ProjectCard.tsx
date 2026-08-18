import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useTaskStore } from "../../store/useTaskStore"
import { getProjectProgress } from "../../utils/progress"
import type { Project } from "../../types"

import "./ProjectCard.scss"

interface ProjectCardProps {
  project: Project
}

function ProjectCard({ project }: ProjectCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const tasks = useTaskStore((s) => s.tasks)
  const { done, total, percent } = getProjectProgress(tasks, project.id)

  return (
    <div
      className="project-card"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      <div className="project-card__header">
        <h3>{project.name}</h3>
        <span className={`badge badge--${project.status}`}>
          {project.status === "active"
            ? t("projects.statusActiveBadge")
            : t("projects.statusDoneBadge")}
        </span>
      </div>

      <p className="project-card__description">{project.description}</p>

      <div className="project-card__progress">
        <div className="progress-bar">
          <div className="progress-bar__fill" style={{ width: `${percent}%` }} />
        </div>
        <span>
          {total === 0
            ? t("projects.noTasks")
            : `${done} ${t("projects.tasksProgress", { total, percent })}`}
        </span>
      </div>

      <div className="project-card__footer">
        <span className="project-card__members">
          {t("projects.membersCount")}: {project.members?.length || 0}
        </span>
        <span className="date">
          {new Date(project.createdAt).toLocaleDateString("ru-RU")}
        </span>
      </div>
    </div>
  )
}

export default ProjectCard

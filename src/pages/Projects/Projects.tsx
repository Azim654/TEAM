import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useProjectStore } from "../../store/useProjectStore"
import { useTaskStore } from "../../store/useTaskStore"
import ProjectCard from "../../Components/ProjectCard/ProjectCard"
import { getProjectProgress } from "../../utils/progress"
import type { Project, ProjectStatus, Task } from "../../types"

import "./Projects.scss"

type StatusFilter = "all" | ProjectStatus
type SortOption = "newest" | "oldest" | "name" | "progress"

function sortProjects(projects: Project[], sortBy: SortOption, tasks: Task[]): Project[] {
  const sorted = [...projects]
  switch (sortBy) {
    case "newest":
      sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      break
    case "oldest":
      sorted.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      break
    case "name":
      sorted.sort((a, b) => a.name.localeCompare(b.name, "ru"))
      break
    case "progress":
      sorted.sort(
        (a, b) =>
          getProjectProgress(tasks, b.id).percent - getProjectProgress(tasks, a.id).percent
      )
      break
  }
  return sorted
}

function Projects() {
  const { t } = useTranslation()
  const { projects, loading, error, fetchProjects } = useProjectStore()
  const tasks = useTaskStore((s) => s.tasks)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [sortBy, setSortBy] = useState<SortOption>("newest")

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const visibleProjects = useMemo(() => {
    const filtered =
      statusFilter === "all" ? projects : projects.filter((p) => p.status === statusFilter)
    return sortProjects(filtered, sortBy, tasks)
  }, [projects, statusFilter, sortBy, tasks])

  if (loading) return <div className="page-loader">{t("common.loading")}</div>
  if (error) return <div className="page-error">{t("common.error")}: {error}</div>

  return (
    <div className="projects-page">
      <div className="page-header">
        <h1>{t("projects.title")}</h1>

        {projects.length > 0 && (
          <div className="projects-toolbar">
            <label className="projects-toolbar__field">
              <span>{t("projects.status")}</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              >
                <option value="all">{t("projects.statusAll")}</option>
                <option value="active">{t("projects.statusActive")}</option>
                <option value="done">{t("projects.statusDone")}</option>
              </select>
            </label>

            <label className="projects-toolbar__field">
              <span>{t("projects.sort")}</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                <option value="newest">{t("projects.sortNewest")}</option>
                <option value="oldest">{t("projects.sortOldest")}</option>
                <option value="name">{t("projects.sortName")}</option>
                <option value="progress">{t("projects.sortProgress")}</option>
              </select>
            </label>
          </div>
        )}
      </div>

      <div className="projects-grid">
        {projects.length === 0 ? (
          <div className="empty-state">
            <p>{t("projects.empty")}</p>
            <p className="empty-state__hint">{t("projects.emptyHint")}</p>
          </div>
        ) : visibleProjects.length === 0 ? (
          <div className="empty-state">
            <p>{t("projects.emptyFiltered")}</p>
            <p className="empty-state__hint">{t("projects.emptyFilteredHint")}</p>
          </div>
        ) : (
          visibleProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))
        )}
      </div>
    </div>
  )
}

export default Projects

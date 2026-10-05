import { useEffect, useMemo } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "../../store/useAuthStore"
import { useProjectStore } from "../../store/useProjectStore"
import { useTaskStore } from "../../store/useTaskStore"
import ProjectCard from "../../Components/ProjectCard/ProjectCard"
import CreateProject from "../../Components/CreateProject/CreateProject"
import JoinProject from "../../Components/JoinProject/JoinProject"

import "./Main.scss"

const RECENT_PROJECTS_COUNT = 3

function Dashboard() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { projects, fetchProjects } = useProjectStore()
  const { tasks, fetchTasks } = useTaskStore()

  useEffect(() => {
    fetchProjects()
    fetchTasks()
  }, [fetchProjects, fetchTasks])

  const stats = useMemo(() => {
    const activeProjects = projects.filter((p) => p.status === "active").length
    const inProgress = tasks.filter((task) => task.status === "in_progress").length
    const done = tasks.filter((task) => task.status === "done").length
    const overdue = tasks.filter(
      (task) => task.dueDate && task.status !== "done" && new Date(task.dueDate) < new Date()
    ).length
    return { activeProjects, inProgress, done, overdue }
  }, [projects, tasks])

  const recentProjects = useMemo(
    () =>
      [...projects]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, RECENT_PROJECTS_COUNT),
    [projects]
  )

  return (
    <div className="dashboard">
      <div className="dashboard__greeting">
        <h1>{t("main.greeting", { name: user?.name?.split(" ")[0] ?? "" })}</h1>
        <p>{t("main.greetingSubtitle")}</p>
      </div>

      <div className="dashboard__stats">
        <div className="stat-card">
          <span className="stat-card__value">{stats.activeProjects}</span>
          <span className="stat-card__label">{t("main.statActiveProjects")}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">{stats.inProgress}</span>
          <span className="stat-card__label">{t("main.statInProgress")}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">{stats.done}</span>
          <span className="stat-card__label">{t("main.statDone")}</span>
        </div>
        <div className={`stat-card ${stats.overdue > 0 ? "stat-card--warning" : ""}`}>
          <span className="stat-card__value">{stats.overdue}</span>
          <span className="stat-card__label">{t("main.statOverdue")}</span>
        </div>
      </div>

      <div className="dashboard__section">
        <div className="dashboard__section-header">
          <h2>{t("main.recentProjects")}</h2>
          {projects.length > 0 && (
            <Link to="/projects" className="dashboard__see-all">
              {t("main.seeAll")}
            </Link>
          )}
        </div>

        {projects.length === 0 ? (
          <div className="dashboard__empty">
            <p>{t("main.emptyDashboard")}</p>
            <p className="dashboard__empty-hint">{t("main.emptyDashboardHint")}</p>
            <CreateProject />
            <JoinProject />
          </div>
        ) : (
          <div className="dashboard__projects">
            {recentProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Landing() {
  const { t } = useTranslation()

  return (
    <div className="landing">
      <section className="hero">
        <span className="hero__badge">{t("main.badge")}</span>
        <h1>
          {t("main.titleBefore")}
          <span>{t("main.titleHighlight")}</span>
          {t("main.titleAfter")}
        </h1>
        <p className="hero__subtitle">{t("main.subtitle")}</p>

        <div className="hero__actions">
          <Link to="/register" className="btn btn--primary btn--lg">
            {t("main.startFree")}
          </Link>
          <Link to="/login" className="btn btn--outline btn--lg">
            {t("main.haveAccount")}
          </Link>
        </div>
      </section>
    </div>
  )
}

function Main() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  return isAuthenticated ? <Dashboard /> : <Landing />
}

export default Main

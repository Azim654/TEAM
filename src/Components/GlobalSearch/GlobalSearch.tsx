import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useProjectStore } from "../../store/useProjectStore"
import { useTaskStore } from "../../store/useTaskStore"
import { useUsersStore } from "../../store/useUsersStore"
import { useAuthStore } from "../../store/useAuthStore"
import Avatar from "../Avatar/Avatar"
import type { Project, Task, User } from "../../types"

import "./GlobalSearch.scss"

const MAX_PER_GROUP = 5

function matches(query: string, ...fields: (string | undefined | null)[]) {
  const q = query.trim().toLocaleLowerCase("ru")
  if (!q) return false
  return fields.some((f) => f?.toLocaleLowerCase("ru").includes(q))
}

function GlobalSearch() {
  const { t } = useTranslation()
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const { user: currentUser } = useAuthStore()
  const { projects, fetchProjects } = useProjectStore()
  const { tasks, fetchTasks } = useTaskStore()
  const { allUsers, fetchAllUsers } = useUsersStore()

  useEffect(() => {
    if (!currentUser) return
    fetchProjects()
    fetchTasks()
    fetchAllUsers()
  }, [currentUser, fetchProjects, fetchTasks, fetchAllUsers])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const results = useMemo(() => {
    if (!query.trim()) return { projects: [], tasks: [], people: [] }

    const matchedProjects: Project[] = projects
      .filter((p) => matches(query, p.name, p.description))
      .slice(0, MAX_PER_GROUP)

    const matchedTasks: Task[] = tasks
      .filter((task) => matches(query, task.title, task.description))
      .slice(0, MAX_PER_GROUP)

    const matchedPeople: User[] = allUsers
      .filter((u) => u.id !== currentUser?.id)
      .filter((u) => matches(query, u.name, u.email))
      .slice(0, MAX_PER_GROUP)

    return { projects: matchedProjects, tasks: matchedTasks, people: matchedPeople }
  }, [query, projects, tasks, allUsers, currentUser])

  const hasResults =
    results.projects.length > 0 || results.tasks.length > 0 || results.people.length > 0

  const goToProject = (id: string) => {
    navigate(`/projects/${id}`)
    setIsOpen(false)
    setQuery("")
  }

  const findProjectName = (projectId: string | number) =>
    projects.find((p) => String(p.id) === String(projectId))?.name

  return (
    <div className="global-search" ref={wrapRef}>
      <input
        type="text"
        placeholder={t("header.searchPlaceholder")}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
      />

      {isOpen && query.trim() && (
        <div className="global-search__dropdown">
          {!hasResults ? (
            <div className="global-search__empty">{t("common.notFound")}</div>
          ) : (
            <>
              {results.projects.length > 0 && (
                <div className="global-search__group">
                  <span className="global-search__group-title">{t("search.projects")}</span>
                  {results.projects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="global-search__item"
                      onClick={() => goToProject(p.id)}
                    >
                      <span className="global-search__item-title">{p.name}</span>
                      <span className={`badge badge--${p.status}`}>
                        {p.status === "active" ? t("projects.statusActiveBadge") : t("projects.statusDoneBadge")}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {results.tasks.length > 0 && (
                <div className="global-search__group">
                  <span className="global-search__group-title">{t("search.tasks")}</span>
                  {results.tasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      className="global-search__item"
                      onClick={() => goToProject(String(task.projectId))}
                    >
                      <span className="global-search__item-title">{task.title}</span>
                      <span className="global-search__item-hint">
                        {findProjectName(task.projectId) ?? t("search.openInProject")}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {results.people.length > 0 && (
                <div className="global-search__group">
                  <span className="global-search__group-title">{t("search.people")}</span>
                  {results.people.map((p) => (
                    <div key={p.id} className="global-search__item global-search__item--static">
                      <Avatar src={p.avatar} alt={p.name} size={24} />
                      <span className="global-search__item-title">{p.name}</span>
                      <span className="global-search__item-hint">{p.email}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default GlobalSearch

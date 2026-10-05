import { useEffect, useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import Avatar from "../Avatar/Avatar"
import { useActivityStore } from "../../store/useActivityStore"
import { useUsersStore } from "../../store/useUsersStore"
import { useAuthStore } from "../../store/useAuthStore"
import type { ActivityLogEntry, TaskStatus } from "../../types"

import "./ActivityLog.scss"

interface ActivityLogProps {
  taskId: string
}

function formatDateTime(dateString: string, locale: string) {
  return new Date(dateString).toLocaleString(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function ActivityLog({ taskId }: ActivityLogProps) {
  const { t, i18n } = useTranslation()
  const { fetchByTask, getByTask, addComment } = useActivityStore()
  const { fetchUsers, getUser } = useUsersStore()
  const { user: currentUser } = useAuthStore()

  const entries = getByTask(taskId)
  const [commentText, setCommentText] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchByTask(taskId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId])

  useEffect(() => {
    const ids = [...new Set(entries.map((e) => e.userId))]
    if (ids.length > 0) fetchUsers(ids)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.length])

  const locale = i18n.language.startsWith("en") ? "en-US" : "ru-RU"

  const statusLabel: Record<TaskStatus, string> = {
    backlog: t("board.columnBacklog"),
    todo: t("board.columnTodo"),
    in_progress: t("board.columnInProgress"),
    review: t("board.columnReview"),
    testing: t("board.columnTesting"),
    done: t("board.columnDone"),
  }

  const userName = (id: string | number | null) => {
    if (id === null || id === undefined || id === "") return t("activity.unassigned")
    return getUser(String(id))?.name ?? t("activity.unknownUser")
  }

  const describeEntry = (entry: ActivityLogEntry) => {
    switch (entry.action) {
      case "created":
        return t("activity.created")
      case "status_changed":
        return t("activity.statusChanged", {
          from: statusLabel[entry.meta.from as TaskStatus] ?? entry.meta.from,
          to: statusLabel[entry.meta.to as TaskStatus] ?? entry.meta.to,
        })
      case "assignee_changed":
        return t("activity.assigneeChanged", {
          from: userName(entry.meta.from as string | number | null),
          to: userName(entry.meta.to as string | number | null),
        })
      case "due_date_changed":
        return t("activity.dueDateChanged", {
          from: entry.meta.from
            ? formatDateTime(String(entry.meta.from), locale)
            : t("activity.none"),
          to: entry.meta.to ? formatDateTime(String(entry.meta.to), locale) : t("activity.none"),
        })
      case "story_point_changed":
        return t("activity.storyPointChanged", {
          from: entry.meta.from ?? t("activity.none"),
          to: entry.meta.to ?? t("activity.none"),
        })
      default:
        return ""
    }
  }

  const handleSubmitComment = async (e: FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setSubmitting(true)
    try {
      await addComment(taskId, commentText)
      setCommentText("")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="activity-log">
      <h2 className="activity-log__title">{t("activity.title")}</h2>

      <form className="activity-log__form" onSubmit={handleSubmitComment}>
        <Avatar src={currentUser?.avatar} size={28} />
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={t("activity.commentPlaceholder")}
        />
        <button
          type="submit"
          className="btn btn--outline"
          disabled={submitting || !commentText.trim()}
        >
          {t("activity.send")}
        </button>
      </form>

      <div className="activity-log__list">
        {entries.length === 0 && (
          <div className="activity-log__empty">{t("activity.empty")}</div>
        )}

        {entries.map((entry) =>
          entry.action === "comment_added" ? (
            <div key={entry.id} className="activity-log__comment">
              <Avatar src={getUser(entry.userId)?.avatar} size={28} />
              <div className="activity-log__comment-body">
                <div className="activity-log__comment-head">
                  <span className="activity-log__author">{userName(entry.userId)}</span>
                  <span className="activity-log__time">
                    {formatDateTime(entry.createdAt, locale)}
                  </span>
                </div>
                <p className="activity-log__comment-text">{String(entry.meta.text ?? "")}</p>
              </div>
            </div>
          ) : (
            <div key={entry.id} className="activity-log__entry">
              <span className="activity-log__dot" />
              <span className="activity-log__author">{userName(entry.userId)}</span>
              <span className="activity-log__text">{describeEntry(entry)}</span>
              <span className="activity-log__time">
                {formatDateTime(entry.createdAt, locale)}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default ActivityLog
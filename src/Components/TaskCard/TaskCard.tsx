import type { DragEvent } from "react"
import { useTranslation } from "react-i18next"
import Avatar from "../Avatar/Avatar"
import { useUsersStore } from "../../store/useUsersStore"
import type { Task } from "../../types"

import "./TaskCard.scss"

interface TaskCardProps {
  task: Task
  draggable?: boolean
  onClick: () => void
  onDragStart: (e: DragEvent<HTMLDivElement>) => void
  onDragEnd: () => void
}

function formatDate(dateString: string | null, locale: string) {
  if (!dateString) return null
  return new Date(dateString).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
  })
}

function TaskCard({ task, draggable = true, onClick, onDragStart, onDragEnd }: TaskCardProps) {
  const { t, i18n } = useTranslation()
  const { getUser } = useUsersStore()

  const priorityLabel: Record<Task["priority"], string> = {
    low: t("board.priorityLow"),
    medium: t("board.priorityMedium"),
    high: t("board.priorityHigh"),
  }

  const locale = i18n.language.startsWith("en") ? "en-US" : "ru-RU"
  const dueDate = formatDate(task.dueDate, locale)
  const overdue =
    task.dueDate && task.status !== "done" && new Date(task.dueDate) < new Date()
  const assignee = task.assigneeId !== null ? getUser(String(task.assigneeId)) : null

  return (
    <div
      className="task-card"
      draggable = {draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
    >
      <div className="task-card__top">
        <span className={`priority priority--${task.priority}`}>
          {priorityLabel[task.priority]}
        </span>
        {task.storyPoint !== null && (
          <span className="task-card__story-point">{task.storyPoint}</span>
        )}
      </div>

      <h4 className="task-card__title">{task.title}</h4>

      {task.description && (
        <p className="task-card__description">{task.description}</p>
      )}

      {(dueDate || assignee) && (
        <div className="task-card__footer">
          {dueDate ? (
            <div className={`task-card__due ${overdue ? "task-card__due--overdue" : ""}`}>
              {dueDate}
            </div>
          ) : (
            <span />
          )}
          {assignee && (
            <div className="task-card__assignee" title={assignee.name}>
              <Avatar src={assignee.avatar} alt={assignee.name} size={22} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TaskCard
import type { DragEvent } from "react"
import { useTranslation } from "react-i18next"
import type { Task } from "../../types"

import "./TaskCard.scss"

interface TaskCardProps {
  task: Task
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

function TaskCard({ task, onClick, onDragStart, onDragEnd }: TaskCardProps) {
  const { t, i18n } = useTranslation()

  const priorityLabel: Record<Task["priority"], string> = {
    low: t("board.priorityLow"),
    medium: t("board.priorityMedium"),
    high: t("board.priorityHigh"),
  }

  const locale = i18n.language.startsWith("en") ? "en-US" : "ru-RU"
  const dueDate = formatDate(task.dueDate, locale)
  const overdue =
    task.dueDate && task.status !== "done" && new Date(task.dueDate) < new Date()

  return (
    <div
      className="task-card"
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
    >
      <div className="task-card__top">
        <span className={`priority priority--${task.priority}`}>
          {priorityLabel[task.priority]}
        </span>
      </div>

      <h4 className="task-card__title">{task.title}</h4>

      {task.description && (
        <p className="task-card__description">{task.description}</p>
      )}

      {dueDate && (
        <div className={`task-card__due ${overdue ? "task-card__due--overdue" : ""}`}>
          {dueDate}
        </div>
      )}
    </div>
  )
}

export default TaskCard

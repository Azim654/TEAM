import { useEffect, useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import Modal from "../Modal/Modal"
import ActivityLog from "../ActivityLog/ActivityLog"
import { useTaskStore } from "../../store/useTaskStore"
import { useAuthStore } from "../../store/useAuthStore"
import { useProjectStore } from "../../store/useProjectStore"
import { useUsersStore } from "../../store/useUsersStore"
import { STORY_POINTS } from "../../types"
import type { StoryPoint, Task, TaskPriority, TaskStatus } from "../../types"
import { hasPermission } from "../../utils/permissions"

import "./TaskModal.scss"

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  boardId: string
  status: TaskStatus
  task?: Task | null
}

interface FormState {
  title: string
  description: string
  priority: TaskPriority
  storyPoint: "" | StoryPoint
  dueDate: string
  assigneeId: string
}

function toDateInputValue(dateString: string | null) {
  if (!dateString) return ""
  return dateString.slice(0, 10)
}

function buildInitialForm(task: Task | null | undefined, defaultAssigneeId: string): FormState {
  if (!task) {
    return {
      title: "",
      description: "",
      priority: "medium",
      storyPoint: "",
      dueDate: "",
      assigneeId: defaultAssigneeId,
    }
  }
  return {
    title: task.title,
    description: task.description,
    priority: task.priority,
    storyPoint: task.storyPoint ?? "",
    dueDate: toDateInputValue(task.dueDate),
    assigneeId: task.assigneeId !== null ? String(task.assigneeId) : "",
  }
}

function TaskModal({ isOpen, onClose, projectId, boardId, status, task }: TaskModalProps) {
  const { t } = useTranslation()
  const { createTask, updateTask, removeTask } = useTaskStore()
  const { user } = useAuthStore()
  const { currentProject } = useProjectStore()
  const { getUser, fetchUsers } = useUsersStore()
  const [form, setForm] = useState<FormState>(() => buildInitialForm(task, user?.id ?? ""))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditMode = Boolean(task)

  const project = currentProject?.id === projectId ? currentProject : null
  const canAssign = project ? hasPermission(project, user?.id, "assign_tasks") : false
  const canEdit = project ? hasPermission(project, user?.id, "edit_tasks") : true
  const canDelete = project ? hasPermission(project, user?.id, "delete_tasks") : true
  const members = project?.members ?? []

  useEffect(() => {
    if (members.length > 0) fetchUsers(members.map((m) => m.userId))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members.length])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setError(t("task.errorTitleRequired"))
      return
    }

    const storyPoint = form.storyPoint === "" ? null : (Number(form.storyPoint) as StoryPoint)

    setSubmitting(true)
    setError(null)
    try {
      if (isEditMode && task) {
        await updateTask(task.id, {
          title: form.title.trim(),
          description: form.description.trim(),
          priority: form.priority,
          storyPoint,
          assigneeId: form.assigneeId || null,
          dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        })
      } else {
        await createTask({
          title: form.title.trim(),
          description: form.description.trim(),
          priority: form.priority,
          storyPoint,
          status,
          projectId,
          boardId,
          assigneeId: form.assigneeId || null,
          dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        })
      }
      onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!task) return
    setSubmitting(true)
    try {
      await removeTask(task.id)
      onClose()
    } catch (err) {
      setError((err as Error).message)
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h1>{isEditMode ? t("task.editTitle") : t("task.createTitle")}</h1>

      {error && <div className="auth-error">{error}</div>}

      <form className="task-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span>{t("task.titleLabel")}</span>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder={t("task.titlePlaceholder")}
            autoFocus
          />
        </label>

        <label className="auth-field">
          <span>{t("task.description")}</span>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder={t("task.descriptionPlaceholder")}
            rows={3}
          />
        </label>

        <label className="auth-field">
          <span>{t("task.assignee")}</span>
          <select
            name="assigneeId"
            value={form.assigneeId}
            onChange={handleChange}
            disabled={!canAssign}
            title={!canAssign ? t("task.assigneeOwnerOnly") : undefined}
          >
            <option value="">{t("task.unassigned")}</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {getUser(m.userId)?.name ?? "…"}
              </option>
            ))}
          </select>
        </label>

        <div className="task-form__row">
          <label className="auth-field">
            <span>{t("task.priority")}</span>
            <select name="priority" value={form.priority} onChange={handleChange}>
              <option value="low">{t("board.priorityLow")}</option>
              <option value="medium">{t("board.priorityMedium")}</option>
              <option value="high">{t("board.priorityHigh")}</option>
            </select>
          </label>

          <label className="auth-field">
            <span>{t("task.storyPoint")}</span>
            <select name="storyPoint" value={form.storyPoint} onChange={handleChange}>
              <option value="">{t("task.storyPointNone")}</option>
              {STORY_POINTS.map((sp) => (
                <option key={sp} value={sp}>
                  {sp}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="auth-field">
          <span>{t("task.dueDate")}</span>
          <input
            type="date"
            name="dueDate"
            value={form.dueDate}
            onChange={handleChange}
          />
        </label>

        <div className="task-form__buttons">
          {isEditMode && (
            <button
              type="button"
              className="btn btn--danger"
              onClick={handleDelete}
              disabled={submitting || !canDelete}
              title={!canDelete ? t("roles.errorDeleteTasksDenied") : undefined}
            >
              {t("common.delete")}
            </button>
          )}
          <div className="task-form__buttons-right">
            <button type="button" className="btn btn--outline" onClick={onClose}>
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={submitting || (isEditMode && !canEdit)}
              title={isEditMode && !canEdit ? t("roles.errorEditTasksDenied") : undefined}
            >
              {submitting ? t("common.saving") : isEditMode ? t("common.save") : t("common.create")}
            </button>
          </div>
        </div>
      </form>

      {isEditMode && task && <ActivityLog taskId={task.id} />}
    </Modal>
  )
}

export default TaskModal
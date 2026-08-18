import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import Modal from "../Modal/Modal"
import { useTaskStore } from "../../store/useTaskStore"
import { useAuthStore } from "../../store/useAuthStore"
import type { Task, TaskPriority, TaskStatus } from "../../types"

import "./TaskModal.scss"

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  status: TaskStatus
  task?: Task | null
}

interface FormState {
  title: string
  description: string
  priority: TaskPriority
  dueDate: string
}

const emptyForm: FormState = {
  title: "",
  description: "",
  priority: "medium",
  dueDate: "",
}

function toDateInputValue(dateString: string | null) {
  if (!dateString) return ""
  return dateString.slice(0, 10)
}

function buildInitialForm(task?: Task | null): FormState {
  if (!task) return emptyForm
  return {
    title: task.title,
    description: task.description,
    priority: task.priority,
    dueDate: toDateInputValue(task.dueDate),
  }
}

function TaskModal({ isOpen, onClose, projectId, status, task }: TaskModalProps) {
  const { t } = useTranslation()
  const { createTask, updateTask, removeTask } = useTaskStore()
  const { user } = useAuthStore()
  const [form, setForm] = useState<FormState>(() => buildInitialForm(task))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditMode = Boolean(task)

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

    setSubmitting(true)
    setError(null)
    try {
      if (isEditMode && task) {
        await updateTask(task.id, {
          title: form.title.trim(),
          description: form.description.trim(),
          priority: form.priority,
          dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        })
      } else {
        await createTask({
          title: form.title.trim(),
          description: form.description.trim(),
          priority: form.priority,
          status,
          projectId,
          assigneeId: user?.id ?? null,
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
            <span>{t("task.dueDate")}</span>
            <input
              type="date"
              name="dueDate"
              value={form.dueDate}
              onChange={handleChange}
            />
          </label>
        </div>

        <div className="task-form__buttons">
          {isEditMode && (
            <button
              type="button"
              className="btn btn--danger"
              onClick={handleDelete}
              disabled={submitting}
            >
              {t("common.delete")}
            </button>
          )}
          <div className="task-form__buttons-right">
            <button type="button" className="btn btn--outline" onClick={onClose}>
              {t("common.cancel")}
            </button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? t("common.saving") : isEditMode ? t("common.save") : t("common.create")}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default TaskModal

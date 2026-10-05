import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import Modal from "../Modal/Modal"
import { useProjectStore } from "../../store/useProjectStore"
import { useAuthStore } from "../../store/useAuthStore"

import "./CreateProject.scss"

interface FormState {
  name: string
  description: string
  workspaceId: string | null
}

const emptyForm: FormState = { name: "", description: "", workspaceId: null }

function CreateProject() {
  const { t } = useTranslation()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { createProject } = useProjectStore()
  const { user } = useAuthStore()

  const [open, setOpen] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleClose = () => {
    setOpen(false)
    setForm(emptyForm)
    setError(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError(t("projects.errorNameRequired"))
      return
    }
    if (!user) return

    setSubmitting(true)
    setError(null)
    try {
    await createProject({
      name: form.name.trim(),
      description: form.description.trim(),
      ownerId: user.id,
      workspaceId: form.workspaceId || null,
    })
      handleClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button type="button" className="btn btn--primary" onClick={() => setOpen(true)}>
        {t("common.create")}
      </button>
      <Modal isOpen={open} onClose={handleClose}>
        <h1>{t("projects.createTitle")}</h1>

        {error && <div className="auth-error">{error}</div>}

        <form className="create-project" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>{t("projects.nameLabel")}</span>
            <input
              type="text"
              name="name"
              onChange={handleChange}
              value={form.name}
              placeholder={t("projects.namePlaceholder")}
              autoFocus
            />
          </label>

          <label className="auth-field">
            <span>{t("projects.description")}</span>
            <textarea
              name="description"
              onChange={handleChange}
              value={form.description}
              placeholder={t("projects.descriptionPlaceholder")}
              rows={4}
            />
          </label>

          <div className="buttons">
            <button type="button" className="btn btn--outline" onClick={handleClose}>
              {t("common.cancel")}
            </button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? t("common.creating") : t("common.create")}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}

export default CreateProject

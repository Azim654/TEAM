import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import Modal from "../Modal/Modal"
import { useProjectStore } from "../../store/useProjectStore"
import { Router_Path } from "../../routes/Router_Path"

import "./JoinProject.scss"

function JoinProject() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { joinProjectByCode } = useProjectStore()

  const [open, setOpen] = useState(false)
  const [code, setCode] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    setOpen(false)
    setCode("")
    setError(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!code.trim()) {
      setError(t("projects.errorJoinCodeRequired"))
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const project = await joinProjectByCode(code)
      handleClose()
      navigate(`${Router_Path.projects}/${project.id}`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button type="button" className="btn btn--outline" onClick={() => setOpen(true)}>
        {t("projects.joinByCode")}
      </button>

      <Modal isOpen={open} onClose={handleClose}>
        <h1>{t("projects.joinTitle")}</h1>

        {error && <div className="auth-error">{error}</div>}

        <form className="join-project" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>{t("projects.joinCodeLabel")}</span>
            <input
              type="text"
              className="join-project__code-input"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={t("projects.joinCodePlaceholder")}
              maxLength={8}
              autoFocus
            />
          </label>

          <div className="buttons">
            <button type="button" className="btn btn--outline" onClick={handleClose}>
              {t("common.cancel")}
            </button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? t("common.loading") : t("projects.join")}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}

export default JoinProject
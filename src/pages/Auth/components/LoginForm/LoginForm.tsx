import { useState, type FormEvent } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "../../../../store/useAuthStore"

interface FormState {
  email: string
  password: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

function LoginForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { login, loading, error } = useAuthStore()

  const [form, setForm] = useState<FormState>({ email: "", password: "" })
  const [validationErrors, setValidationErrors] = useState<FormErrors>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target as { name: keyof FormState; value: string }
    setForm((prev) => ({ ...prev, [name]: value }))
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const validate = () => {
    const errors: FormErrors = {}
    if (!form.email.trim()) errors.email = t("auth.errorEmailRequired")
    if (!form.password) errors.password = t("auth.errorPasswordRequired")
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    await login(form.email, form.password)

    if (useAuthStore.getState().isAuthenticated()) {
      const state = location.state as { from?: { pathname?: string } } | null
      const redirectTo = state?.from?.pathname || "/"
      navigate(redirectTo, { replace: true })
    }
  }

  return (
    <>
      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <label className="auth-field">
          <span>{t("auth.email")}</span>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className={validationErrors.email ? "input--error" : ""}
            autoFocus
          />
          {validationErrors.email && (
            <span className="field-error">{validationErrors.email}</span>
          )}
        </label>

        <label className="auth-field">
          <span>{t("auth.password")}</span>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder={t("auth.passwordPlaceholderLogin")}
            className={validationErrors.password ? "input--error" : ""}
          />
          {validationErrors.password && (
            <span className="field-error">{validationErrors.password}</span>
          )}
        </label>

        <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
          {loading ? t("auth.loginSubmitting") : t("auth.loginSubmit")}
        </button>
      </form>
    </>
  )
}

export default LoginForm

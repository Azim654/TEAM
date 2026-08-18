import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "../../../../store/useAuthStore"

interface FormState {
  name: string
  email: string
  password: string
  confirmPassword: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

function RegisterForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { register, loading, error } = useAuthStore()

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
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
    if (!form.name.trim()) errors.name = t("auth.errorNameRequired")

    if (!form.email.trim()) {
      errors.email = t("auth.errorEmailRequired")
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = t("auth.errorEmailInvalid")
    }

    if (!form.password) {
      errors.password = t("auth.errorPasswordRequired")
    } else if (form.password.length < 6) {
      errors.password = t("auth.errorPasswordShort")
    }

    if (form.confirmPassword !== form.password) {
      errors.confirmPassword = t("auth.errorPasswordMismatch")
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    await register(form.name, form.email, form.password)

    if (useAuthStore.getState().isAuthenticated()) {
      navigate("/", { replace: true })
    }
  }

  return (
    <>
      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <label className="auth-field">
          <span>{t("auth.name")}</span>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder={t("auth.namePlaceholder")}
            className={validationErrors.name ? "input--error" : ""}
            autoFocus
          />
          {validationErrors.name && (
            <span className="field-error">{validationErrors.name}</span>
          )}
        </label>

        <label className="auth-field">
          <span>{t("auth.email")}</span>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className={validationErrors.email ? "input--error" : ""}
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
            placeholder={t("auth.passwordPlaceholderRegister")}
            className={validationErrors.password ? "input--error" : ""}
          />
          {validationErrors.password && (
            <span className="field-error">{validationErrors.password}</span>
          )}
        </label>

        <label className="auth-field">
          <span>{t("auth.confirmPassword")}</span>
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder={t("auth.confirmPasswordPlaceholder")}
            className={validationErrors.confirmPassword ? "input--error" : ""}
          />
          {validationErrors.confirmPassword && (
            <span className="field-error">{validationErrors.confirmPassword}</span>
          )}
        </label>

        <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
          {loading ? t("auth.registerSubmitting") : t("auth.registerSubmit")}
        </button>
      </form>
    </>
  )
}

export default RegisterForm

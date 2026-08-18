import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import LoginForm from "./components/LoginForm/LoginForm"
import RegisterForm from "./components/RegisterForm/RegisterFrom"

import "./Auth.scss"

type AuthMode = "login" | "register"

function Auth() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const [mode, setMode] = useState<AuthMode>(
    location.pathname === "/register" ? "register" : "login"
  )

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    navigate(newMode === "register" ? "/register" : "/login", { replace: true })
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo">
          <span className="auth-logo__icon">👥</span>
          <span>TEAM</span>
        </Link>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === "login" ? "auth-tab--active" : ""}`}
            onClick={() => switchMode("login")}
            type="button"
          >
            {t("auth.login")}
          </button>
          <button
            className={`auth-tab ${mode === "register" ? "auth-tab--active" : ""}`}
            onClick={() => switchMode("register")}
            type="button"
          >
            {t("auth.register")}
          </button>
        </div>

        {mode === "login" ? <LoginForm /> : <RegisterForm />}
      </div>
    </div>
  )
}

export default Auth

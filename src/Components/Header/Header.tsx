import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import closeIcon from "../../assets/images/free-icon-font-cross-3917759 (1).png"
import menuIcon from "../../assets/images/free-icon-font-menu-burger.png"
import logo from "../../assets/images/logo.png"
import CreateProject from "../CreateProject/CreateProject"
import Avatar from "../Avatar/Avatar"
import GlobalSearch from "../GlobalSearch/GlobalSearch"
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher"
import { useAuthStore } from "../../store/useAuthStore"
import { useThemeStore } from "../../store/useThemeStore"
import { Router_Path } from "../../routes/Router_Path"

import "./Header.scss"
import JoinProject from "../JoinProject/JoinProject"

interface HeaderProps {
  isOpen: boolean
  toggleSidebar: () => void
}

function Header({ isOpen, toggleSidebar }: HeaderProps) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()

  return (
    <header>
      <div className="header__left">
        <img
          src={isOpen ? closeIcon : menuIcon}
          alt=""
          onClick={toggleSidebar}
          className="header__burger-icon"
        />
        <Link to="/" className="header__logo">
          <img src={logo} alt="" />
          <span>TEAM</span>
        </Link>
      </div>

      <div className="header__center">
        <div className="search-input">
          {user ? <GlobalSearch /> : <div className="search-input__placeholder" />}
          {user && <CreateProject />}
          {user && <JoinProject />}
        </div>
      </div>

      <div className="header__right">
        <LanguageSwitcher />

        <button
          type="button"
          className="icon-btn theme-toggle"
          onClick={toggleTheme}
          title={theme === "light" ? t("header.darkTheme") : t("header.lightTheme")}
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>

        {user ? (
          <div className="header__user" onClick={() => navigate(Router_Path.profile)}>
            <Avatar src={user.avatar} alt={user.name} size={36} className="avatar" />
          </div>
        ) : (
          <div className="header__auth">
            <Link to="/register" className="link">{t("header.register")}</Link>
            <Link to="/login" className="btn btn--outline">{t("header.login")}</Link>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header

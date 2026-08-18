import { NavLink } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Router_Path } from "../../routes/Router_Path"

import "./Aside.scss"

interface AsideProps {
  isOpen: boolean
  toggleSidebar: () => void
}

function Aside({ isOpen, toggleSidebar }: AsideProps) {
  const { t } = useTranslation()

  const items = [
    { to: Router_Path.main, icon: "🏠", label: t("aside.main") },
    { to: Router_Path.projects, icon: "📁", label: t("aside.projects") },
    { to: Router_Path.profile, icon: "👤", label: t("aside.profile") },
  ]

  return (
    <aside className={`aside ${isOpen ? "open" : ""}`}>
      <ul className="aside__menu">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === Router_Path.main}
              className={({ isActive }) =>
                `aside__link ${isActive ? "aside__link--active" : ""}`
              }
              onClick={() => {
                // На узком экране закрываем сайдбар после перехода
                if (window.innerWidth < 900) toggleSidebar()
              }}
            >
              <span className="aside__icon">{item.icon}</span>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  )
}

export default Aside

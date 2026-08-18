import { useTranslation } from "react-i18next"

import "./LanguageSwitcher.scss"

const LANGUAGES = [
  { code: "ru", label: "RU" },
  { code: "en", label: "EN" },
]

function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.language.startsWith("en") ? "en" : "ru"

  const setLang = (code: string) => {
    i18n.changeLanguage(code)
  }

  return (
    <div className="lang-switch" role="group" aria-label={i18n.t("header.language")}>
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          type="button"
          className={`lang-switch__option ${current === lang.code ? "lang-switch__option--active" : ""}`}
          onClick={() => setLang(lang.code)}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}

export default LanguageSwitcher

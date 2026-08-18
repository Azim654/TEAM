import { useState } from "react"
import { Outlet } from "react-router-dom"
import Header from "../Components/Header/Header"
import Aside from "../Components/Aside/Aside"

import "./App-container.scss"

function Layout() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleSidebar = () => {
    setIsOpen((prev) => !prev)
  }

  return (
    <div className="layout">
      <Aside isOpen={isOpen} toggleSidebar={toggleSidebar} />

      <div className="layout__wrapper">
        <Header isOpen={isOpen} toggleSidebar={toggleSidebar} />

        <main className={`layout__content ${isOpen ? "shift" : ""}`}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout

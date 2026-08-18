import { RouterProvider } from "react-router-dom"
import { routes } from './routes/routes'
import { Suspense, useEffect } from "react"

import './Styles/global.scss'
import { useThemeStore } from "./store/useThemeStore"

function App() {
  const initTheme = useThemeStore((s) => s.initTheme)

  useEffect(() => {
    initTheme()
  }, [initTheme])

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RouterProvider router={routes} />
    </Suspense>
  )
}

export default App

import { Navigate, useLocation, Outlet } from "react-router-dom"
import { useAuthStore } from "../store/useAuthStore"

function PrivateRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

export default PrivateRoute

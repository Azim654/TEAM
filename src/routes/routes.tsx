import { createBrowserRouter } from 'react-router-dom'
import { Router_Path } from './Router_Path'
import { lazy } from 'react'

const Layout = lazy(() => import('../Layout/Layout'))
const Main = lazy(() => import('../pages/Main/Main'))
const Projects = lazy(() => import('../pages/Projects/Projects'))
const ProjectDetail = lazy(() => import('../pages/ProjectDetail/Projectetail'))
const Auth = lazy(() => import('../pages/Auth/Auth'))
const Profile = lazy(() => import('../pages/Profile/Profile'))

const PrivateRoute = lazy(() => import('../Layout/PrivateRoute'))
const PublicRoute = lazy(() => import('../Layout/PublicRoute'))

export const routes = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      {
        element: <Auth />,
        path: Router_Path.login,
      },
      {
        element: <Auth />,
        path: Router_Path.register,
      },
    ],
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: Router_Path.main,
        element: <Main />,
      },
      {
        element: <PrivateRoute />,
        children: [
          {
            path: Router_Path.projects,
            element: <Projects />,
          },
          {
            path: Router_Path.projectDetail,
            element: <ProjectDetail />,
          },
          {
            path: Router_Path.profile,
            element: <Profile />,
          },
        ],
      },
    ],
  },
])

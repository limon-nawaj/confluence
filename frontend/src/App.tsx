import { useEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { AppShell } from '@/components/layout/AppShell'

import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import SpaceListPage from '@/pages/SpaceListPage'
import SpacePage from '@/pages/SpacePage'
import PageViewPage from '@/pages/PageViewPage'
import PageEditPage from '@/pages/PageEditPage'
import NewPagePage from '@/pages/NewPagePage'
import NewSpacePage from '@/pages/NewSpacePage'
import SearchPage from '@/pages/SearchPage'
import TeamsPage from '@/pages/TeamsPage'
import TicketProjectsPage from '@/pages/TicketProjectsPage'
import TicketBoardPage from '@/pages/TicketBoardPage'

function RequireAuth() {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />
  return <Outlet />
}

export default function App() {
  const { isHydrating, hydrate } = useAuthStore()

  useEffect(() => {
    hydrate()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (isHydrating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/spaces" element={<SpaceListPage />} />
          <Route path="/spaces/new" element={<NewSpacePage />} />
          <Route path="/spaces/:spaceKey" element={<SpacePage />} />
          <Route path="/spaces/:spaceKey/new" element={<NewPagePage />} />
          <Route path="/spaces/:spaceKey/edit/*" element={<PageEditPage />} />
          <Route path="/spaces/:spaceKey/*" element={<PageViewPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/projects" element={<TicketProjectsPage />} />
          <Route path="/projects/:projectId" element={<TicketBoardPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

import { Outlet, useParams, useNavigate } from 'react-router-dom'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { useSpacePages } from '@/hooks/useSpaces'
import { useSpace } from '@/hooks/useSpaces'

export function AppShell() {
  const { spaceKey } = useParams<{ spaceKey?: string }>()
  const navigate = useNavigate()
  const { data: pages = [] } = useSpacePages(spaceKey ?? '')
  const { data: space } = useSpace(spaceKey ?? '')

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        {spaceKey && (
          <Sidebar
            spaceKey={spaceKey}
            space={space}
            spaceName={space?.name}
            pages={pages}
            onNewPage={() => navigate(`/spaces/${spaceKey}/new`)}
          />
        )}
        <main className="flex-1 overflow-auto" style={{ background: '#f9fafb' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

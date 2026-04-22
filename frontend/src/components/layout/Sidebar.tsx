import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronDown, FileText, Plus, FilePlus, Settings } from 'lucide-react'
import type { Page, Space } from '@/types/models'
import { useAuthStore } from '@/store/authStore'
import { pageSegment } from '@/utils/pageSlug'
import { SpaceSettingsModal } from '@/components/spaces/SpaceSettingsModal'

interface PageNodeProps {
  page: Page
  spaceKey: string
  parentPath?: string
  depth?: number
}

function PageNode({ page, spaceKey, parentPath = '', depth = 0 }: PageNodeProps) {
  const [open, setOpen] = useState(depth < 2)
  const [hovered, setHovered] = useState(false)
  const navigate = useNavigate()
  const hasChildren = page.children && page.children.length > 0

  const seg = pageSegment(page.id, page.title)
  const fullPath = parentPath ? `${parentPath}/${seg}` : seg
  const pageUrl = `/spaces/${spaceKey}/${fullPath}`

  return (
    <div className="sidebar-page-node">
      <div
        className="flex items-center gap-0.5 group"
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Expand/collapse toggle */}
        <button
          onClick={(e) => { e.preventDefault(); setOpen(!open) }}
          className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors
            ${hasChildren ? 'text-white/30 hover:text-white/70 hover:bg-white/10' : 'invisible'}`}
        >
          {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        </button>

        {/* Page link */}
        <NavLink
          to={pageUrl}
          end
          className={({ isActive }) =>
            `flex-1 flex items-center gap-1.5 py-1 px-1.5 rounded-lg text-sm truncate transition-all
            ${isActive
              ? 'text-white font-medium'
              : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`
          }
          style={({ isActive }) => isActive ? { background: 'rgba(99,102,241,0.25)', color: '#a5b4fc' } : {}}
        >
          <FileText size={12} className="flex-shrink-0 opacity-60" />
          <span className="truncate">{page.title}</span>
          {!page.is_published && (
            <span className="ml-auto flex-shrink-0 text-xs bg-amber-500/20 text-amber-400 px-1.5 py-px rounded-full leading-none">
              Draft
            </span>
          )}
        </NavLink>

        {/* Add child button (visible on hover) */}
        <button
          onClick={() => navigate(`/spaces/${spaceKey}/new?parent_id=${page.id}`)}
          title="Add child page"
          className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-indigo-400 hover:bg-white/10 transition-all ${
            hovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <FilePlus size={11} />
        </button>
      </div>

      {/* Children */}
      {open && hasChildren && (
        <div>
          {page.children!.map((child) => (
            <PageNode key={child.id} page={child} spaceKey={spaceKey} parentPath={fullPath} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

interface Props {
  spaceKey: string
  pages: Page[]
  space?: Space
  spaceName?: string
  onNewPage?: () => void
}

export function Sidebar({ spaceKey, pages, space, spaceName, onNewPage }: Props) {
  const { user } = useAuthStore()
  const [showSettings, setShowSettings] = useState(false)
  const isOwner = !!space && !!user && space.owner_id === user.id

  return (
    <aside
      className="w-60 flex-shrink-0 flex flex-col h-full overflow-hidden"
      style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
    >
      {/* Space header */}
      <div
        className="flex items-center gap-1 px-3 py-2.5"
        style={{ borderBottom: '1px solid var(--sidebar-border)' }}
      >
        <NavLink
          to={`/spaces/${spaceKey}`}
          className="flex items-center gap-2 group flex-1 min-w-0"
        >
          <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow shadow-indigo-500/40">
            {(spaceName || spaceKey)[0].toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-white/70 group-hover:text-white/90 truncate transition-colors">
            {spaceName || spaceKey.toUpperCase()}
          </span>
        </NavLink>

        {/* Space settings — owner only */}
        {isOwner && (
          <button
            onClick={() => setShowSettings(true)}
            title="Space settings"
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-white/30 hover:text-indigo-400 hover:bg-white/10 transition-all"
          >
            <Settings size={13} />
          </button>
        )}

        {onNewPage && (
          <button
            onClick={onNewPage}
            title="New page"
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-white/30 hover:text-indigo-400 hover:bg-white/10 transition-all"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {/* Page tree */}
      <nav className="flex-1 overflow-y-auto py-2">
        {pages.length === 0 ? (
          <p className="text-xs text-white/25 px-4 py-3">No pages yet</p>
        ) : (
          pages.map((page) => (
            <PageNode key={page.id} page={page} spaceKey={spaceKey} />
          ))
        )}
      </nav>

      {/* Bottom action */}
      <div
        className="px-3 py-2"
        style={{ borderTop: '1px solid var(--sidebar-border)' }}
      >
        <button
          onClick={onNewPage}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
        >
          <Plus size={14} />
          <span>New page</span>
        </button>
      </div>

      {/* Space settings modal */}
      {showSettings && space && (
        <SpaceSettingsModal space={space} onClose={() => setShowSettings(false)} />
      )}
    </aside>
  )
}

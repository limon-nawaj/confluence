import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, FileText, ChevronRight, FolderOpen, Settings } from 'lucide-react'
import { useSpace, useSpacePages } from '@/hooks/useSpaces'
import { SpaceSettingsModal } from '../components/spaces/SpaceSettingsModal'
import { useAuthStore } from '@/store/authStore'
import { pageSegment } from '@/utils/pageSlug'
import type { Page } from '@/types/models'

interface PageTreeNodeProps {
  page: Page
  spaceKey: string
  parentPath?: string
  depth?: number
}

function PageTreeNode({ page, spaceKey, parentPath = '', depth = 0 }: PageTreeNodeProps) {
  const navigate = useNavigate()
  const hasChildren = page.children && page.children.length > 0
  const seg = pageSegment(page.id, page.title)
  const fullPath = parentPath ? `${parentPath}/${seg}` : seg

  return (
    <div>
      <div
        className="group flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-indigo-50 border border-transparent hover:border-indigo-100 cursor-pointer transition-all"
        style={{ marginLeft: `${depth * 20}px` }}
        onClick={() => navigate(`/spaces/${spaceKey}/${fullPath}`)}
      >
        {hasChildren
          ? <FolderOpen size={15} className="text-indigo-400 flex-shrink-0" />
          : <FileText size={15} className="text-gray-400 flex-shrink-0" />
        }
        <span className="flex-1 text-sm font-medium text-gray-800 group-hover:text-indigo-700">{page.title}</span>
        {!page.is_published && (
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
            Draft
          </span>
        )}
        {hasChildren && (
          <span className="text-xs text-gray-400 font-medium">{page.children!.length} child{page.children!.length !== 1 ? 'ren' : ''}</span>
        )}
        <ChevronRight size={14} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
      </div>
      {hasChildren && page.children!.map((child) => (
        <PageTreeNode key={child.id} page={child} spaceKey={spaceKey} parentPath={fullPath} depth={depth + 1} />
      ))}
    </div>
  )
}

export default function SpacePage() {
  const { spaceKey } = useParams<{ spaceKey: string }>()
  const { data: space } = useSpace(spaceKey!)
  const { data: pages = [], isLoading } = useSpacePages(spaceKey!)
  const navigate = useNavigate()
  const { user: currentUser } = useAuthStore()
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 animate-fade-in">
      {space && (
        <>
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-500/30">
                {space.name[0].toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{space.name}</h1>
                {space.description && (
                  <p className="text-sm text-gray-500 mt-0.5">{space.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-0.5 font-mono">{space.key}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {space.owner_id === currentUser?.id && (
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg shadow-sm transition-colors"
                  title="Space Settings"
                >
                  <Settings size={18} />
                </button>
              )}
              <button
                onClick={() => navigate(`/spaces/${spaceKey}/new`)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm shadow-indigo-500/30 transition-all"
              >
                <Plus size={15} /> New Page
              </button>
            </div>
          </div>

          {/* Pages */}
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Pages ({pages.length})
            </h2>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : pages.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                  <FileText size={24} className="text-indigo-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">No pages yet</p>
                <p className="text-xs text-gray-400 mt-1 mb-4">Create the first page in this space</p>
                <button
                  onClick={() => navigate(`/spaces/${spaceKey}/new`)}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  <Plus size={14} /> Create page
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {pages.map((page) => (
                  <PageTreeNode key={page.id} page={page} spaceKey={spaceKey!} />
                ))}
              </div>
            )}
          </div>
          
          {showSettings && (
            <SpaceSettingsModal space={space} onClose={() => setShowSettings(false)} />
          )}
        </>
      )}
    </div>
  )
}

import { RotateCcw, Eye, EyeOff } from 'lucide-react'
import { useVersions, useRestoreVersion } from '@/hooks/useVersions'
import { format } from 'date-fns'
import type { PageVersion } from '@/types/models'
import { useState } from 'react'
import { TiptapEditor } from '@/components/editor/TiptapEditor'

interface Props {
  pageId: number
  /** When provided, Restore navigates to the edit page instead of staying on view page. */
  onRestore?: (version: PageVersion) => void
  /** Highlight the currently loaded version in the edit page panel. */
  activeVersionId?: number
}

export function VersionHistory({ pageId, onRestore, activeVersionId }: Props) {
  const { data: versions = [], isLoading } = useVersions(pageId)
  const restore = useRestoreVersion(pageId)
  const [previewing, setPreviewing] = useState<number | null>(null)

  const handleRestore = async (version: PageVersion) => {
    if (!confirm(`Restore to version ${version.version_number} "${version.title}"?`)) return
    await restore.mutateAsync(version.id)
    onRestore?.(version)
  }

  if (isLoading) return <p className="text-sm text-gray-400">Loading history...</p>
  if (versions.length === 0) return <p className="text-sm text-gray-400">No version history yet.</p>

  return (
    <div className="space-y-1.5">
      {versions.map((v) => {
        const isActive = activeVersionId === v.id
        const isOpen = previewing === v.id
        return (
          <div
            key={v.id}
            className={`border rounded-xl overflow-hidden transition-colors ${
              isActive ? 'border-indigo-300 bg-indigo-50/40' : 'border-gray-200 bg-white'
            }`}
          >
            {/* Row */}
            <div className="flex items-center gap-3 px-3 py-2.5">
              <span className="text-xs font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded flex-shrink-0">
                v{v.version_number}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{v.title}</p>
                <p className="text-xs text-gray-400 truncate">
                  {v.change_summary}
                  {' · '}
                  {format(new Date(v.created_at), 'MMM d, yyyy HH:mm')}
                  {v.author && ` · ${v.author.full_name || v.author.username}`}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => setPreviewing(isOpen ? null : v.id)}
                  className={`p-1.5 rounded transition-colors ${
                    isOpen ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  title={isOpen ? 'Hide preview' : 'Preview content'}
                >
                  {isOpen ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
                <button
                  onClick={() => handleRestore(v)}
                  disabled={restore.isPending || isActive}
                  className="flex items-center gap-1 px-2 py-1 text-xs border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 disabled:opacity-40 transition-colors"
                  title={isActive ? 'Currently loaded' : 'Restore this version'}
                >
                  <RotateCcw size={11} />
                  {isActive ? 'Current' : 'Restore'}
                </button>
              </div>
            </div>

            {/* Preview */}
            {isOpen && (
              <div className="border-t border-gray-100 bg-white px-4 py-3 max-h-72 overflow-y-auto">
                {v.content ? (
                  <TiptapEditor content={v.content} onChange={() => {}} editable={false} />
                ) : (
                  <p className="text-xs text-gray-400 italic">(empty)</p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { Save, X, Clock, ChevronRight, Home, History } from 'lucide-react'
import { usePage, useUpdatePage } from '@/hooks/usePages'
import { useSpace, useSpacePages } from '@/hooks/useSpaces'
import { TiptapEditor } from '@/components/editor/TiptapEditor'
import { VersionHistory } from '@/components/versions/VersionHistory'
import { useEditorStore } from '@/store/editorStore'
import { format } from 'date-fns'
import { findPageByPath, pagePathUrl, pageSegment } from '@/utils/pageSlug'

const AUTOSAVE_MS = 30_000

export default function PageEditPage() {
  const { spaceKey, '*': pagePath } = useParams<{ spaceKey: string; '*': string }>()
  const [searchParams] = useSearchParams()
  const { data: space } = useSpace(spaceKey!)
  const { data: allPages = [] } = useSpacePages(spaceKey!)
  const navigate = useNavigate()
  const { hasUnsavedChanges, lastSaved, markSaved } = useEditorStore()

  // Resolve page from path segments
  const segments = (pagePath ?? '').split('/').filter(Boolean)
  const page = allPages.length ? findPageByPath(allPages, segments) : null

  // Fallback for bare numeric ID bookmarks
  const bareId = segments.length === 1 && /^\d+$/.test(segments[0])
    ? parseInt(segments[0], 10) : null
  const { data: legacyPage } = usePage(bareId ?? 0)
  const resolvedPage = page ?? (bareId ? (legacyPage ?? null) : null)
  const id = resolvedPage?.id ?? 0

  const updatePage = useUpdatePage(spaceKey)
  const [title, setTitle] = useState(resolvedPage?.title ?? '')
  const [content, setContent] = useState(resolvedPage?.content ?? '')
  const [showHistory, setShowHistory] = useState(searchParams.get('history') === '1')

  const contentRef = useRef(content)
  const titleRef = useRef(title)

  useEffect(() => {
    if (resolvedPage) {
      setTitle(resolvedPage.title)
      setContent(resolvedPage.content ?? '')
    }
  }, [resolvedPage?.id])

  useEffect(() => { contentRef.current = content }, [content])
  useEffect(() => { titleRef.current = title }, [title])

  const viewUrl = (newTitle?: string) => {
    if (!resolvedPage) return `/spaces/${spaceKey}`
    const pathSegments = pagePathUrl(allPages, resolvedPage.id).split('/')
    // Replace last segment with updated ID+title segment (title may have changed on save)
    const lastSeg = pageSegment(resolvedPage.id, newTitle ?? resolvedPage.title)
    const updated = [...pathSegments.slice(0, -1), lastSeg].join('/')
    return `/spaces/${spaceKey}/${updated || lastSeg}`
  }

  const save = useCallback(async (summary = 'Auto-saved') => {
    if (!id) return
    await updatePage.mutateAsync({
      id,
      data: { title: titleRef.current, content: contentRef.current, change_summary: summary },
    })
    markSaved()
  }, [id, updatePage, markSaved])

  useEffect(() => {
    const t = setInterval(() => {
      if (useEditorStore.getState().hasUnsavedChanges) save('Auto-saved')
    }, AUTOSAVE_MS)
    return () => clearInterval(t)
  }, [save])

  const handleSave = async () => {
    await save('Manual save')
    navigate(viewUrl(titleRef.current))
  }
  const handleDiscard = () => navigate(viewUrl())

  // Breadcrumb: parent segments
  const parentSegments = segments.slice(0, -1)
  const ancestorCrumbs = parentSegments.map((_, i) => {
    const seg = segments[i]
    const segId = parseInt(seg)
    const flatPage = allPages.flatMap(function flat(p): import('@/types/models').Page[] { return [p, ...(p.children ?? []).flatMap(flat)] })
      .find(p => p.id === segId)
    const title = flatPage?.title ?? seg.replace(/^\d+-/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    return { title, path: segments.slice(0, i + 1).join('/') }
  })

  return (
    <div className="px-8 py-6 animate-fade-in h-full flex flex-col">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-4 flex-wrap flex-shrink-0">
        <Link to="/" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
          <Home size={11} /> Home
        </Link>
        <ChevronRight size={11} className="text-gray-300" />
        <Link to={`/spaces/${spaceKey}`} className="hover:text-indigo-600 transition-colors">
          {space?.name || spaceKey}
        </Link>
        {ancestorCrumbs.map((crumb) => (
          <>
            <ChevronRight key={`sep-${crumb.path}`} size={11} className="text-gray-300" />
            <Link
              key={crumb.path}
              to={`/spaces/${spaceKey}/${crumb.path}`}
              className="hover:text-indigo-600 transition-colors truncate max-w-[140px]"
            >
              {crumb.title}
            </Link>
          </>
        ))}
        {resolvedPage && (
          <>
            <ChevronRight size={11} className="text-gray-300" />
            <Link
              to={viewUrl()}
              className="hover:text-indigo-600 transition-colors truncate max-w-[140px]"
            >
              {resolvedPage.title}
            </Link>
          </>
        )}
        <ChevronRight size={11} className="text-gray-300" />
        <span className="text-gray-600">Editing</span>
      </nav>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {lastSaved && (
            <span className="flex items-center gap-1 bg-green-50 text-green-600 border border-green-200 px-2 py-1 rounded-lg">
              <Clock size={11} /> Saved {format(lastSaved, 'HH:mm:ss')}
            </span>
          )}
          {hasUnsavedChanges && (
            <span className="flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-200 px-2 py-1 rounded-lg">
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory((s) => !s)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
              showHistory
                ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <History size={13} /> History
          </button>
          <button
            onClick={handleDiscard}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <X size={13} /> Discard
          </button>
          <button
            onClick={handleSave}
            disabled={updatePage.isPending}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 font-medium shadow-sm shadow-indigo-500/30 transition-all"
          >
            <Save size={13} /> {updatePage.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Editor + History side-by-side */}
      <div className="flex gap-4 flex-1 min-h-0">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex-1 min-w-0 overflow-y-auto">
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); useEditorStore.getState().setUnsaved(true) }}
            className="w-full text-3xl font-bold text-gray-900 border-none outline-none mb-4 placeholder-gray-300 bg-transparent"
            placeholder="Page title"
          />
          <div className="border border-gray-100 rounded-xl p-1">
            <TiptapEditor
              content={content}
              onChange={(c) => { setContent(c); useEditorStore.getState().setUnsaved(true) }}
              editable
            />
          </div>
        </div>

        {showHistory && (
          <div className="w-80 flex-shrink-0 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <History size={14} className="text-indigo-500" /> Version History
              </h3>
              <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X size={14} />
              </button>
            </div>
            <p className="px-4 py-2 text-xs text-gray-400 border-b border-gray-50">
              Restore a version to load it into the editor.
            </p>
            <div className="flex-1 overflow-y-auto p-3">
              <VersionHistory pageId={id} onRestore={(version) => { void version }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

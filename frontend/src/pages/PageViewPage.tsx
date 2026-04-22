import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  Edit, History, MessageSquare, Paperclip, Globe, Lock, BookOpen,
  ChevronRight, FileText, Home, Settings, Trash2
} from 'lucide-react'
import { useTogglePublish, usePublishTree, useDeletePage } from '@/hooks/usePages'
import { useSpace, useSpacePages } from '@/hooks/useSpaces'
import { useAuthStore } from '@/store/authStore'
import { TiptapEditor } from '@/components/editor/TiptapEditor'
import { CommentThread } from '@/components/comments/CommentThread'
import { VersionHistory } from '@/components/versions/VersionHistory'
import { AttachmentList } from '@/components/attachments/AttachmentList'
import { format } from 'date-fns'
import { findPageByPath, pagePathUrl } from '@/utils/pageSlug'
import { usePage } from '@/hooks/usePages'
import type { Page } from '@/types/models'

type Tab = 'comments' | 'versions' | 'attachments'

export default function PageViewPage() {
  const { spaceKey, '*': pagePath } = useParams<{ spaceKey: string; '*': string }>()
  const { data: space } = useSpace(spaceKey!)
  const { data: allPages = [], isLoading: pagesLoading } = useSpacePages(spaceKey!)
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('comments')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Split the wildcard path into segments and find the page in the tree
  const segments = (pagePath ?? '').split('/').filter(Boolean)
  const page = allPages.length ? findPageByPath(allPages, segments) : null

  // Fallback: bare numeric ID (very old bookmark with no slug at all)
  const bareId = segments.length === 1 && /^\d+$/.test(segments[0])
    ? parseInt(segments[0], 10) : null
  const { data: legacyPage } = usePage(bareId ?? 0)

  const resolvedPage: Page | null = page ?? (bareId ? (legacyPage ?? null) : null)
  const id = resolvedPage?.id ?? 0

  // Redirect bare-ID URLs to the full path URL once tree loads
  useEffect(() => {
    if (bareId && legacyPage && allPages.length) {
      const path = pagePathUrl(allPages, legacyPage.id)
      navigate(`/spaces/${spaceKey}/${path}`, { replace: true })
    }
  }, [bareId, legacyPage, allPages, spaceKey, navigate])

  const togglePublish = useTogglePublish(spaceKey)
  const publishTree = usePublishTree(spaceKey)
  const deletePage = useDeletePage(spaceKey)

  const isSpaceOwner = !!space && !!user && space.owner_id === user.id
  const isAuthor = !!user && !!resolvedPage && user.id === resolvedPage.author_id
  const canEdit = !!user
  const canPublish = isAuthor || isSpaceOwner
  const canDelete = isAuthor || isSpaceOwner
  const hasMenu = canPublish || canDelete

  // Build breadcrumb ancestors from the page path segments
  const parentSegments = segments.slice(0, -1)
  const ancestorCrumbs = parentSegments.map((_, i) => {
    const seg = segments[i]
    const segId = parseInt(seg)
    const flatPage = allPages.flatMap(function flat(p): Page[] { return [p, ...(p.children ?? []).flatMap(flat)] })
      .find(p => p.id === segId)
    const title = flatPage?.title ?? seg.replace(/^\d+-/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    return { title, path: segments.slice(0, i + 1).join('/') }
  })

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const editUrl = resolvedPage
    ? `/spaces/${spaceKey}/edit/${pagePathUrl(allPages, resolvedPage.id) || segments.join('/')}`
    : '#'

  if (pagesLoading || (!resolvedPage && !bareId)) {
    return (
      <div className="px-8 py-8">
        <div className="space-y-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-48" />
          <div className="h-8 bg-gray-100 rounded w-80" />
          <div className="h-64 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }
  if (!resolvedPage) return <div className="p-8 text-sm text-red-500">Page not found.</div>

  return (
    <div className="px-8 py-6 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-4 flex-wrap">
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
              className="hover:text-indigo-600 transition-colors truncate max-w-[160px]"
            >
              {crumb.title}
            </Link>
          </>
        ))}
        <ChevronRight size={11} className="text-gray-300" />
        <span className="text-gray-600 font-medium truncate max-w-[160px]">{resolvedPage.title}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="min-w-0 flex-1 pt-1">
          <h1 className="text-2xl font-bold text-gray-900 mb-1 leading-tight">{resolvedPage.title}</h1>
          <div className="flex items-center gap-3 flex-wrap">
            {!resolvedPage.is_published && (
              <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full flex-shrink-0 font-medium">
                <Lock size={10} /> Draft
              </span>
            )}
            <p className="text-xs text-gray-400">
              Last updated {format(new Date(resolvedPage.updated_at), 'MMM d, yyyy')}
              {resolvedPage.author && ` · by ${resolvedPage.author.full_name || resolvedPage.author.username}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {canEdit && (
            <button
              onClick={() => navigate(editUrl)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm shadow-indigo-500/30 transition-all"
            >
              <Edit size={13} /> Edit
            </button>
          )}

          {hasMenu && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-700 shadow-sm transition-all"
                title="Page settings"
              >
                <Settings size={15} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in py-1">
                  {canPublish && (
                    <>
                      <button
                        onClick={() => { togglePublish.mutate(id); setMenuOpen(false) }}
                        disabled={togglePublish.isPending}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors text-left"
                      >
                        {resolvedPage.is_published
                          ? <><Lock size={14} className="text-gray-400 flex-shrink-0" /><span>Unpublish page</span></>
                          : <><BookOpen size={14} className="text-indigo-500 flex-shrink-0" /><span>Publish page</span></>}
                      </button>
                      <button
                        onClick={() => { publishTree.mutate(id); setMenuOpen(false) }}
                        disabled={publishTree.isPending}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors text-left"
                      >
                        <Globe size={14} className="text-indigo-500 flex-shrink-0" /><span>Publish page &amp; children</span>
                      </button>
                      {canDelete && <div className="border-t border-gray-100 mx-1 my-1" />}
                    </>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => {
                        if (!confirm(`Delete "${resolvedPage.title}"? This cannot be undone.`)) return
                        deletePage.mutate(id, {
                          onSuccess: () => navigate(`/spaces/${spaceKey}`),
                        })
                        setMenuOpen(false)
                      }}
                      disabled={deletePage.isPending}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors text-left"
                    >
                      <Trash2 size={14} className="flex-shrink-0" /><span>Delete page</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Page content */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
        <div className="p-6">
          {resolvedPage.content ? (
            <TiptapEditor content={resolvedPage.content} onChange={() => {}} editable={false} />
          ) : (
            <div className="border border-dashed border-gray-200 rounded-xl p-10 text-center text-gray-400">
              <FileText size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">This page has no content yet.</p>
              {canEdit && (
                <button
                  onClick={() => navigate(editUrl)}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <Edit size={13} /> Add content
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {([
            { key: 'comments', icon: MessageSquare, label: 'Comments' },
            { key: 'versions', icon: History, label: 'Version History' },
            { key: 'attachments', icon: Paperclip, label: 'Attachments' },
          ] as const).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm border-b-2 transition-all
                ${tab === key
                  ? 'border-indigo-600 text-indigo-600 font-semibold bg-indigo-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {tab === 'comments' && <CommentThread pageId={id} />}
          {tab === 'versions' && (
            <VersionHistory
              pageId={id}
              onRestore={() => navigate(`${editUrl}?history=1`)}
            />
          )}
          {tab === 'attachments' && <AttachmentList pageId={id} />}
        </div>
      </div>
    </div>
  )
}

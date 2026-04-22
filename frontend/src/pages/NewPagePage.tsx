import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { TiptapEditor } from '@/components/editor/TiptapEditor'
import { useCreatePage } from '@/hooks/useSpaces'
import { useSpacePages } from '@/hooks/useSpaces'
import { templatesApi } from '@/api/templates'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, FileText, X, Plus } from 'lucide-react'
import type { Page } from '@/types/models'
import { pagePathUrl, pageSegment } from '@/utils/pageSlug'

function flattenPages(pages: Page[], depth = 0): { page: Page; depth: number }[] {
  const result: { page: Page; depth: number }[] = []
  for (const p of pages) {
    result.push({ page: p, depth })
    if (p.children && p.children.length > 0) {
      result.push(...flattenPages(p.children, depth + 1))
    }
  }
  return result
}

export default function NewPagePage() {
  const { spaceKey } = useParams<{ spaceKey: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const createPage = useCreatePage(spaceKey!)
  const { data: templates = [] } = useQuery({ queryKey: ['templates'], queryFn: templatesApi.list })
  const { data: allPages = [] } = useSpacePages(spaceKey!)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [parentId, setParentId] = useState<number | undefined>(() => {
    const raw = searchParams.get('parent_id')
    return raw ? Number(raw) : undefined
  })
  const [parentDropdownOpen, setParentDropdownOpen] = useState(false)

  // Keep parentId in sync with the URL param — guards against React strict-mode
  // double-renders where searchParams isn't populated on the very first render.
  useEffect(() => {
    const raw = searchParams.get('parent_id')
    if (raw) setParentId(Number(raw))
  }, [searchParams])

  const flatPages = flattenPages(allPages)

  const selectedParent = flatPages.find((fp) => fp.page.id === parentId)?.page

  const handleTemplateSelect = (templateContent: string) => setContent(templateContent)

  const handleCreate = async () => {
    if (!title.trim()) return
    const page = await createPage.mutateAsync({
      title,
      content,
      is_published: false,
      parent_id: parentId ?? null,
    })
    const p = page as { id: number; title: string }
    const parentPath = parentId ? pagePathUrl(allPages, parentId) : ''
    const seg = pageSegment(p.id, p.title)
    const fullPath = parentPath ? `${parentPath}/${seg}` : seg
    navigate(`/spaces/${spaceKey}/${fullPath}`)
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-in">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Create New Page</h1>
        <p className="text-sm text-gray-500 mt-0.5">in <span className="font-semibold text-indigo-600">{spaceKey}</span></p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        {/* Templates */}
        {templates.length > 0 && (
          <div className="px-6 pt-5 pb-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">Start from template</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setContent('')}
                className="px-3 py-1.5 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                Blank page
              </button>
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTemplateSelect(t.content)}
                  className="px-3 py-1.5 text-xs border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-all"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="px-6 py-5">
          {/* Parent page selector */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Parent page
            </label>
            <div className="relative">
              <button
                onClick={() => setParentDropdownOpen(!parentDropdownOpen)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-left hover:border-indigo-300 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {selectedParent ? (
                  <>
                    <FileText size={13} className="text-indigo-400 flex-shrink-0" />
                    <span className="flex-1 text-gray-700 truncate">{selectedParent.title}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setParentId(undefined) }}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </>
                ) : (
                  <>
                    <Plus size={13} className="text-gray-400 flex-shrink-0" />
                    <span className="flex-1 text-gray-400">No parent (root page)</span>
                    <ChevronDown size={13} className="text-gray-300" />
                  </>
                )}
              </button>

              {parentDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto animate-fade-in">
                  <button
                    onClick={() => { setParentId(undefined); setParentDropdownOpen(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
                  >
                    No parent (root page)
                  </button>
                  {flatPages.map(({ page: p, depth }) => (
                    <button
                      key={p.id}
                      onClick={() => { setParentId(p.id); setParentDropdownOpen(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                      style={{ paddingLeft: `${12 + depth * 16}px` }}
                    >
                      <FileText size={12} className="flex-shrink-0 text-gray-400" />
                      <span className="truncate">{p.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Title input */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-3xl font-bold text-gray-900 border-none outline-none mb-4 placeholder-gray-200 bg-transparent"
            placeholder="Page title"
            autoFocus
          />

          {/* Editor */}
          <div className="border border-gray-100 rounded-xl p-1">
            <TiptapEditor content={content} onChange={setContent} editable />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            onClick={() => navigate(`/spaces/${spaceKey}`)}
            className="px-4 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!title.trim() || createPage.isPending}
            className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 font-medium shadow-sm shadow-indigo-500/30 transition-all"
          >
            {createPage.isPending ? 'Creating...' : 'Create page'}
          </button>
        </div>
      </div>
    </div>
  )
}

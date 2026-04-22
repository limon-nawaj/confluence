import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, FileText } from 'lucide-react'
import { useSearch } from '@/hooks/useSearch'
import { slugifyTitle } from '@/utils/pageSlug'

export default function SearchPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [q, setQ] = useState(params.get('q') ?? '')
  const { data: results = [], isFetching } = useSearch(q)

  useEffect(() => { setQ(params.get('q') ?? '') }, [params])

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Search all pages..."
            autoFocus
          />
        </div>
      </div>

      {isFetching && <p className="text-sm text-gray-400">Searching...</p>}

      {!isFetching && q.trim().length >= 2 && results.length === 0 && (
        <p className="text-sm text-gray-500">No results for "{q}"</p>
      )}

      <div className="space-y-3">
        {results.map((r) => (
          <button
            key={r.page_id}
            onClick={() => navigate(`/spaces/${r.space_key}/${r.page_id}-${slugifyTitle(r.title)}`)}
            className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-200 hover:shadow-sm transition-all bg-white"
          >
            <div className="flex items-center gap-2 mb-1">
              <FileText size={14} className="text-blue-500 flex-shrink-0" />
              <span className="font-medium text-gray-900 text-sm">{r.title}</span>
            </div>
            {r.snippet && (
              <p
                className="text-xs text-gray-500 line-clamp-2"
                dangerouslySetInnerHTML={{ __html: r.snippet }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import { searchApi } from '@/api/search'

export function useSearch(q: string, space?: string) {
  return useQuery({
    queryKey: ['search', q, space],
    queryFn: () => searchApi.search(q, space),
    enabled: q.trim().length >= 2,
  })
}

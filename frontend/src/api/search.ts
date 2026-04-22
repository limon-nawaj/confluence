import client from './client'
import type { SearchResult } from '@/types/models'

export const searchApi = {
  search: (q: string, space?: string, limit = 20, offset = 0) =>
    client
      .get<SearchResult[]>('/search', { params: { q, space, limit, offset } })
      .then((r) => r.data),
}

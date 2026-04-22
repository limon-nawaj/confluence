import client from './client'
import type { Page } from '@/types/models'

export const pagesApi = {
  get: (id: number) => client.get<Page>(`/pages/${id}`).then((r) => r.data),
  update: (id: number, data: { title?: string; content?: string; is_published?: boolean; change_summary?: string }) =>
    client.put<Page>(`/pages/${id}`, data).then((r) => r.data),
  delete: (id: number) => client.delete(`/pages/${id}`),
  move: (id: number, data: { parent_id?: number; space_id?: number }) =>
    client.patch<Page>(`/pages/${id}/move`, data).then((r) => r.data),
  togglePublish: (id: number) => client.post<Page>(`/pages/${id}/publish`).then((r) => r.data),
  publishTree: (id: number) => client.post<Page[]>(`/pages/${id}/publish-tree`).then((r) => r.data),
  getChildren: (id: number) => client.get<Page[]>(`/pages/${id}/children`).then((r) => r.data),
}

import client from './client'
import type { Comment } from '@/types/models'

export const commentsApi = {
  list: (pageId: number) => client.get<Comment[]>(`/comments/pages/${pageId}`).then((r) => r.data),
  create: (pageId: number, data: { content: string; parent_id?: number }) =>
    client.post<Comment>(`/comments/pages/${pageId}`, data).then((r) => r.data),
  reply: (commentId: number, content: string) =>
    client.post<Comment>(`/comments/${commentId}/reply`, { content }).then((r) => r.data),
  update: (id: number, content: string) =>
    client.put<Comment>(`/comments/${id}`, { content }).then((r) => r.data),
  delete: (id: number) => client.delete(`/comments/${id}`),
  resolve: (id: number) => client.patch<Comment>(`/comments/${id}/resolve`).then((r) => r.data),
}

import client from './client'
import type { Template } from '@/types/models'

export const templatesApi = {
  list: () => client.get<Template[]>('/templates').then((r) => r.data),
  get: (id: number) => client.get<Template>(`/templates/${id}`).then((r) => r.data),
  create: (data: { name: string; description?: string; category?: string; content: string }) =>
    client.post<Template>('/templates', data).then((r) => r.data),
  delete: (id: number) => client.delete(`/templates/${id}`),
}

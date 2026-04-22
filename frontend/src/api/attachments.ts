import client from './client'
import type { Attachment } from '@/types/models'

export const attachmentsApi = {
  list: (pageId: number) =>
    client.get<Attachment[]>(`/attachments/pages/${pageId}`).then((r) => r.data),
  upload: (pageId: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return client.post<Attachment>(`/attachments/pages/${pageId}`, form).then((r) => r.data)
  },
  delete: (id: number) => client.delete(`/attachments/${id}`),
  downloadUrl: (id: number) => `/api/v1/attachments/${id}/download`,
}

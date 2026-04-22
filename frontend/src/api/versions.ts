import client from './client'
import type { Page, PageVersion } from '@/types/models'

export const versionsApi = {
  list: (pageId: number) =>
    client.get<PageVersion[]>(`/versions/pages/${pageId}`).then((r) => r.data),
  get: (versionId: number) =>
    client.get<PageVersion>(`/versions/${versionId}`).then((r) => r.data),
  restore: (versionId: number) =>
    client.post<Page>(`/versions/${versionId}/restore`).then((r) => r.data),
  diff: (v1: number, v2: number) =>
    client.get(`/versions/diff?v1=${v1}&v2=${v2}`).then((r) => r.data),
}

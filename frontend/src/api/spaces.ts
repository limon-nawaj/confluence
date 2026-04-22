import client from './client'
import type { Page, Space, SpaceTeamAccess } from '@/types/models'

export const spacesApi = {
  list: () => client.get<Space[]>('/spaces').then((r) => r.data),
  get: (key: string) => client.get<Space>(`/spaces/${key}`).then((r) => r.data),
  create: (data: { key: string; name: string; description?: string; is_public?: boolean }) =>
    client.post<Space>('/spaces', data).then((r) => r.data),
  update: (key: string, data: Partial<{ name: string; description: string; is_public: boolean }>) =>
    client.put<Space>(`/spaces/${key}`, data).then((r) => r.data),
  delete: (key: string) => client.delete(`/spaces/${key}`),
  getPages: (key: string) => client.get<Page[]>(`/spaces/${key}/pages`).then((r) => r.data),
  createPage: (key: string, data: object) =>
    client.post<Page>(`/spaces/${key}/pages`, data).then((r) => r.data),
  addTeam: (key: string, teamId: number, permission: string) =>
    client.post<SpaceTeamAccess>(`/spaces/${key}/teams`, { team_id: teamId, permission }).then((r) => r.data),
  removeTeam: (key: string, teamId: number) =>
    client.delete(`/spaces/${key}/teams/${teamId}`),
  addUserAccess: (key: string, email: string, level: string) =>
    client.post(`/spaces/${key}/members`, { email, level }).then((r) => r.data),
  removeUserAccess: (key: string, userId: number) =>
    client.delete(`/spaces/${key}/members/${userId}`),
}

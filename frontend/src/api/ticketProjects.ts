import client from './client'
import type { TicketProject, ProjectPermission } from '@/types/models'

export const getTicketProjects = async (): Promise<TicketProject[]> => {
  const { data } = await client.get('/ticket-projects/')
  return data
}

export const createTicketProject = async (payload: {
  name: string
  key: string
  description?: string
  team_id?: number
  icon_color?: string
  icon_emoji?: string
}): Promise<TicketProject> => {
  const { data } = await client.post('/ticket-projects/', payload)
  return data
}

export const getTicketProject = async (id: number | string): Promise<TicketProject> => {
  const { data } = await client.get(`/ticket-projects/${id}`)
  return data
}

export const updateTicketProject = async (
  id: number,
  payload: Partial<{ name: string; description: string; icon_color: string; icon_emoji: string }>
): Promise<TicketProject> => {
  const { data } = await client.put(`/ticket-projects/${id}`, payload)
  return data
}

export const deleteTicketProject = async (id: number): Promise<void> => {
  await client.delete(`/ticket-projects/${id}`)
}

export const getProjectMembers = async (projectId: number): Promise<ProjectPermission[]> => {
  const { data } = await client.get(`/ticket-projects/${projectId}/members`)
  return data
}

export const addProjectMember = async (projectId: number, userId: number, role: 'member' | 'admin'): Promise<ProjectPermission> => {
  const { data } = await client.post(`/ticket-projects/${projectId}/members`, { user_id: userId, role })
  return data
}

export const removeProjectMember = async (projectId: number, userId: number): Promise<void> => {
  await client.delete(`/ticket-projects/${projectId}/members/${userId}`)
}

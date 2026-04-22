import client from './client'
import type { Sprint } from '@/types/models'

export const getSprints = async (projectId: number): Promise<Sprint[]> => {
  const { data } = await client.get('/sprints/', { params: { project_id: projectId } })
  return data
}

export const createSprint = async (payload: {
  project_id: number
  name: string
  goal?: string
  start_date?: string
  end_date?: string
}): Promise<Sprint> => {
  const { data } = await client.post('/sprints/', payload)
  return data
}

export const updateSprint = async (id: number, payload: Partial<Sprint>): Promise<Sprint> => {
  const { data } = await client.put(`/sprints/${id}`, payload)
  return data
}

export const startSprint = async (id: number): Promise<Sprint> => {
  const { data } = await client.patch(`/sprints/${id}/start`)
  return data
}

export const completeSprint = async (id: number): Promise<Sprint> => {
  const { data } = await client.patch(`/sprints/${id}/complete`)
  return data
}

export const addTicketToSprint = async (sprintId: number, ticketId: number): Promise<void> => {
  await client.post(`/sprints/${sprintId}/tickets/${ticketId}`)
}

export const removeTicketFromSprint = async (sprintId: number, ticketId: number): Promise<void> => {
  await client.delete(`/sprints/${sprintId}/tickets/${ticketId}`)
}

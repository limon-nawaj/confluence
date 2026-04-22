import client from './client'
import type {
  Ticket, TicketDetail, TicketComment, TicketLink, TicketLabel,
  TicketStatus, TicketType, TicketPriority, LinkType,
} from '@/types/models'

// ─── Tickets ──────────────────────────────────────────────────────────────────

export interface ListTicketsParams {
  project_id?: number
  status?: TicketStatus
  priority?: TicketPriority
  assignee_id?: number
  sprint_id?: number
  type?: TicketType
  search?: string
}

export const getTickets = async (params: ListTicketsParams): Promise<Ticket[]> => {
  const { data } = await client.get('/tickets/', { params })
  return data
}

export const createTicket = async (payload: {
  project_id: number
  title: string
  description?: string
  type?: TicketType
  priority?: TicketPriority
  story_points?: number
  due_date?: string
  parent_id?: number
  sprint_id?: number
  assignee_ids?: number[]
  label_ids?: number[]
}): Promise<Ticket> => {
  const { data } = await client.post('/tickets/', payload)
  return data
}

export const getTicketDetail = async (ticketId: number): Promise<TicketDetail> => {
  const { data } = await client.get(`/tickets/${ticketId}`)
  return data
}

export const updateTicket = async (
  ticketId: number,
  payload: Partial<{
    title: string
    description: string
    type: TicketType
    priority: TicketPriority
    story_points: number
    due_date: string
    parent_id: number
    created_by: number
    assignee_ids: number[]
    label_ids: number[]
  }>
): Promise<Ticket> => {
  const { data } = await client.put(`/tickets/${ticketId}`, payload)
  return data
}

export const patchTicketStatus = async (ticketId: number, status: TicketStatus): Promise<Ticket> => {
  const { data } = await client.patch(`/tickets/${ticketId}/status`, { status })
  return data
}

export const deleteTicket = async (ticketId: number): Promise<void> => {
  await client.delete(`/tickets/${ticketId}`)
}

// ─── Assignees ───────────────────────────────────────────────────────────────

export const addAssignee = async (ticketId: number, userId: number): Promise<void> => {
  await client.post(`/tickets/${ticketId}/assignees/${userId}`)
}

export const removeAssignee = async (ticketId: number, userId: number): Promise<void> => {
  await client.delete(`/tickets/${ticketId}/assignees/${userId}`)
}

// ─── Watchers ────────────────────────────────────────────────────────────────

export const watchTicket = async (ticketId: number): Promise<void> => {
  await client.post(`/tickets/${ticketId}/watch`)
}

export const unwatchTicket = async (ticketId: number): Promise<void> => {
  await client.delete(`/tickets/${ticketId}/watch`)
}

// ─── Comments ────────────────────────────────────────────────────────────────

export const getComments = async (ticketId: number): Promise<TicketComment[]> => {
  const { data } = await client.get(`/tickets/${ticketId}/comments`)
  return data
}

export const addComment = async (
  ticketId: number, content: string, parentId?: number
): Promise<TicketComment> => {
  const { data } = await client.post(`/tickets/${ticketId}/comments`, {
    content, parent_id: parentId,
  })
  return data
}

export const updateComment = async (
  ticketId: number, commentId: number, content: string
): Promise<TicketComment> => {
  const { data } = await client.put(`/tickets/${ticketId}/comments/${commentId}`, { content })
  return data
}

export const deleteComment = async (ticketId: number, commentId: number): Promise<void> => {
  await client.delete(`/tickets/${ticketId}/comments/${commentId}`)
}

// ─── Links ───────────────────────────────────────────────────────────────────

export const addLink = async (
  ticketId: number, targetTicketId: number, linkType: LinkType
): Promise<TicketLink> => {
  const { data } = await client.post(`/tickets/${ticketId}/links`, {
    target_ticket_id: targetTicketId, link_type: linkType,
  })
  return data
}

export const deleteLink = async (linkId: number): Promise<void> => {
  await client.delete(`/tickets/links/${linkId}`)
}

// ─── Labels ──────────────────────────────────────────────────────────────────

export const getLabels = async (projectId: number): Promise<TicketLabel[]> => {
  const { data } = await client.get(`/tickets/projects/${projectId}/labels`)
  return data
}

export const createLabel = async (
  projectId: number, name: string, color: string
): Promise<TicketLabel> => {
  const { data } = await client.post(`/tickets/projects/${projectId}/labels`, { name, color })
  return data
}

export const deleteLabel = async (labelId: number): Promise<void> => {
  await client.delete(`/tickets/labels/${labelId}`)
}

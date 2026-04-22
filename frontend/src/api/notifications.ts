import client from './client'
import type { Notification } from '@/types/models'

export const notificationsApi = {
  getAll: () => client.get<Notification[]>('/notifications').then((r) => r.data),
  
  getUnreadCount: () => 
    client.get<{ count: number }>('/notifications/unread-count').then((r) => r.data),

  markRead: (id: number) =>
    client.put<Notification>(`/notifications/${id}/read`).then((r) => r.data),

  markAllRead: () => client.put('/notifications/read-all'),
}

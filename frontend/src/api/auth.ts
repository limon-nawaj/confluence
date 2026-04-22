import client from './client'
import type { TokenResponse, User } from '@/types/models'

export const authApi = {
  register: (data: { email: string; username: string; password: string; full_name?: string }) =>
    client.post<User>('/auth/register', data).then((r) => r.data),

  login: (email: string, password: string) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    return client.post<TokenResponse>('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }).then((r) => r.data)
  },

  refresh: () =>
    client.post<TokenResponse>('/auth/refresh').then((r) => r.data),

  logout: () => client.post('/auth/logout'),

  me: () => client.get<User>('/auth/me').then((r) => r.data),
}

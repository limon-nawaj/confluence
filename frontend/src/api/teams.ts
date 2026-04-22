import client from './client'
import type { Team, TeamMember } from '@/types/models'

export const teamsApi = {
  getTeams: () => client.get<Team[]>('/teams').then((r) => r.data),
  
  getTeam: (id: number) => client.get<Team>(`/teams/${id}`).then((r) => r.data),
  
  createTeam: (data: { name: string; description?: string }) => 
    client.post<Team>('/teams', data).then((r) => r.data),
    
  deleteTeam: (id: number) => client.delete(`/teams/${id}`),

  addMember: (teamId: number, email: string, role: string = 'member') => 
    client.post<TeamMember>(`/teams/${teamId}/members`, { email, role }).then((r) => r.data),
    
  removeMember: (teamId: number, userId: number) =>
    client.delete(`/teams/${teamId}/members/${userId}`),

  updateMemberRole: (teamId: number, userId: number, role: 'member' | 'admin') =>
    client.patch<TeamMember>(`/teams/${teamId}/members/${userId}`, { role }).then((r) => r.data),
}

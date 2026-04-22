import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, UserPlus, Shield, X, ShieldAlert } from 'lucide-react'
import { teamsApi } from '@/api/teams'
import type { Team } from '@/types/models'
import { useAuthStore } from '@/store/authStore'

export default function TeamsPage() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuthStore()
  const [activeTeamId, setActiveTeamId] = useState<number | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [memberEmail, setMemberEmail] = useState('')

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: teamsApi.getTeams,
  })

  const createTeam = useMutation({
    mutationFn: () => teamsApi.createTeam({ name: newTeamName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      setIsCreating(false)
      setNewTeamName('')
    },
  })

  const addMember = useMutation({
    mutationFn: ({ teamId, email }: { teamId: number; email: string }) => 
      teamsApi.addMember(teamId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      setMemberEmail('')
    },
  })

  const removeMember = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: number; userId: number }) =>
      teamsApi.removeMember(teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })

  const updateRole = useMutation({
    mutationFn: ({ teamId, userId, role }: { teamId: number; userId: number; role: 'member' | 'admin' }) =>
      teamsApi.updateMemberRole(teamId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })

  const activeTeam = teams.find((t) => t.id === activeTeamId) || teams[0]
  const isOwnerOrAdmin = activeTeam && (
    activeTeam.owner_id === currentUser?.id || 
    activeTeam.members.some(m => m.user_id === currentUser?.id && m.role === 'admin')
  )

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-t-2 border-indigo-600 animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center py-12 px-6">
      <div className="w-full max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Teams</h1>
            <p className="mt-1 text-gray-500">Manage your groups and workspace access</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={16} /> Create Team
          </button>
        </div>

        {isCreating && (
          <div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-gray-200 animate-fade-in">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create a new Team</h3>
            <div className="flex gap-3">
              <input
                autoFocus
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Engineering, Marketing, HR..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none"
                onKeyDown={(e) => e.key === 'Enter' && newTeamName.trim() && createTeam.mutate()}
              />
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!newTeamName.trim() || createTeam.isPending}
                onClick={() => createTeam.mutate()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {createTeam.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        )}

        {teams.length === 0 && !isCreating ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No teams yet</h3>
            <p className="text-gray-500 mt-2">Create your first team to start collaborating</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Team List Sidebar */}
            <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Your Teams</div>
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => setActiveTeamId(team.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                    (activeTeamId === team.id || (!activeTeamId && activeTeam?.id === team.id))
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0
                    ${(activeTeamId === team.id || (!activeTeamId && activeTeam?.id === team.id))
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'bg-gray-200 text-gray-600'}`}>
                    {team.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate">{team.name}</span>
                </button>
              ))}
            </div>

            {/* Team Details View */}
            {activeTeam && (
              <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-fade-in w-full">
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{activeTeam.name}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{activeTeam.members.length} member{activeTeam.members.length !== 1 && 's'}</p>
                  </div>
                  {activeTeam.owner_id === currentUser?.id && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                      <ShieldAlert size={12} /> Owner
                    </span>
                  )}
                </div>

                <div className="p-6">
                  {/* Add Member form */}
                  {isOwnerOrAdmin && (
                    <div className="mb-8">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Add member by email</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <UserPlus size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            value={memberEmail}
                            onChange={(e) => setMemberEmail(e.target.value)}
                            placeholder="user@example.com"
                            autoComplete="off"
                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all"
                            onKeyDown={(e) => e.key === 'Enter' && memberEmail && addMember.mutate({ teamId: activeTeam.id, email: memberEmail })}
                          />
                        </div>
                        <button
                          disabled={!memberEmail.trim() || addMember.isPending}
                          onClick={() => addMember.mutate({ teamId: activeTeam.id, email: memberEmail.trim() })}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                          {addMember.isPending ? 'Adding...' : 'Add'}
                        </button>
                      </div>
                      {addMember.isError && (
                        <p className="text-sm text-red-500 mt-2 font-medium">User not found. Check the email address.</p>
                      )}
                    </div>
                  )}

                  {/* Member List */}
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Team Members</div>
                    <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                      {activeTeam.members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                              {member.user.full_name?.[0] || member.user.username[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{member.user.full_name || member.user.username}</p>
                              <p className="text-xs text-gray-500">{member.user.email}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {/* Role badge — clickable for admins to toggle */}
                            {isOwnerOrAdmin && activeTeam.owner_id !== member.user_id ? (
                              <button
                                onClick={() => updateRole.mutate({
                                  teamId: activeTeam.id,
                                  userId: member.user_id,
                                  role: member.role === 'admin' ? 'member' : 'admin',
                                })}
                                title={member.role === 'admin' ? 'Demote to Member' : 'Promote to Admin'}
                                className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md transition-colors ${
                                  member.role === 'admin'
                                    ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                                    : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
                                }`}
                              >
                                <Shield size={12} />
                                {member.role === 'admin' ? 'Admin' : 'Member'}
                              </button>
                            ) : (
                              <span className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md ${
                                member.role === 'admin'
                                  ? 'text-indigo-600 bg-indigo-50'
                                  : 'text-gray-500 bg-gray-100'
                              }`}>
                                <Shield size={12} />
                                {member.role === 'admin' ? 'Admin' : 'Member'}
                              </span>
                            )}

                            {isOwnerOrAdmin && member.user_id !== currentUser?.id && activeTeam.owner_id !== member.user_id && (
                              <button
                                onClick={() => removeMember.mutate({ teamId: activeTeam.id, userId: member.user_id })}
                                title="Remove member"
                                className="text-gray-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <X size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

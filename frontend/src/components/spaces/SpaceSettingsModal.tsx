import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { X, Globe, Lock, Shield, Trash2, Plus, UserPlus } from 'lucide-react'
import { spacesApi } from '@/api/spaces'
import { teamsApi } from '@/api/teams'
import type { Space } from '@/types/models'

interface Props {
  space: Space
  onClose: () => void
}

export function SpaceSettingsModal({ space, onClose }: Props) {
  const queryClient = useQueryClient()
  const [isPublic, setIsPublic] = useState(space.is_public)
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [permission, setPermission] = useState('read')
  const [userEmail, setUserEmail] = useState('')
  const [userLevel, setUserLevel] = useState('view')

  const { data: userTeams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: teamsApi.getTeams,
  })

  const updateVisibility = useMutation({
    mutationFn: (publicState: boolean) => spacesApi.update(space.key, { is_public: publicState }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces', space.key] })
      queryClient.invalidateQueries({ queryKey: ['spaces'] })
    },
  })

  const addTeam = useMutation({
    mutationFn: () => spacesApi.addTeam(space.key, parseInt(selectedTeam), permission),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces', space.key] })
      setSelectedTeam('')
    },
  })

  const removeTeam = useMutation({
    mutationFn: (teamId: number) => spacesApi.removeTeam(space.key, teamId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['spaces', space.key] }),
  })

  const addUser = useMutation({
    mutationFn: () => spacesApi.addUserAccess(space.key, userEmail.trim(), userLevel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces', space.key] })
      setUserEmail('')
    },
  })

  const removeUser = useMutation({
    mutationFn: (userId: number) => spacesApi.removeUserAccess(space.key, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['spaces', space.key] }),
  })

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col animate-slide-up" style={{ maxHeight: 'min(90vh, 700px)' }}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Space Settings</h2>
            <p className="text-xs text-gray-500 font-mono mt-0.5">{space.key}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto flex-1">
          {/* Visibility Section */}
          <section>
            <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Visibility</h3>
            <div className="flex gap-4">
              <button
                onClick={() => { setIsPublic(true); updateVisibility.mutate(true) }}
                className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  isPublic 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                    : 'border-gray-200 bg-white text-gray-500 hover:border-indigo-300'
                }`}
              >
                <Globe size={24} className={isPublic ? 'text-indigo-600' : 'text-gray-400'} />
                <span className="font-bold mt-2 text-sm">Public</span>
                <span className="text-xs text-center mt-1 opacity-80">Anyone can read</span>
              </button>
              
              <button
                onClick={() => { setIsPublic(false); updateVisibility.mutate(false) }}
                className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  !isPublic 
                    ? 'border-amber-600 bg-amber-50 text-amber-700' 
                    : 'border-gray-200 bg-white text-gray-500 hover:border-amber-300'
                }`}
              >
                <Lock size={24} className={!isPublic ? 'text-amber-600' : 'text-gray-400'} />
                <span className="font-bold mt-2 text-sm">Private</span>
                <span className="text-xs text-center mt-1 opacity-80">Only members</span>
              </button>
            </div>
          </section>

          {/* User Access Section */}
          <section>
            <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">User Access</h3>

            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <UserPlus size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  autoComplete="off"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && userEmail.trim() && addUser.mutate()}
                />
              </div>
              <select
                value={userLevel}
                onChange={(e) => setUserLevel(e.target.value)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none text-sm bg-gray-50 font-medium"
              >
                <option value="view">View</option>
                <option value="edit">Edit</option>
                <option value="admin">Admin</option>
              </select>
              <button
                disabled={!userEmail.trim() || addUser.isPending}
                onClick={() => addUser.mutate()}
                className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center"
              >
                <Plus size={18} />
              </button>
            </div>
            {addUser.isError && (
              <p className="text-sm text-red-500 mb-3 font-medium">User not found. Check the email address.</p>
            )}

            <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
              {(!space.user_permissions || space.user_permissions.length === 0) && (
                <div className="p-4 text-center text-sm text-gray-500">No individual users added</div>
              )}
              {space.user_permissions?.map((perm) => (
                <div key={perm.id} className="flex items-center justify-between p-3 bg-white hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      {(perm.user.full_name?.[0] || perm.user.username[0]).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm leading-tight">{perm.user.full_name || perm.user.username}</p>
                      <p className="text-xs text-gray-500">{perm.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md ${
                      perm.level === 'admin' ? 'text-indigo-600 bg-indigo-50'
                      : perm.level === 'edit' ? 'text-emerald-600 bg-emerald-50'
                      : 'text-gray-500 bg-gray-100'
                    }`}>
                      <Shield size={10} /> {perm.level.charAt(0).toUpperCase() + perm.level.slice(1)}
                    </span>
                    <button
                      onClick={() => removeUser.mutate(perm.user_id)}
                      className="text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove access"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Team Access Section */}
          <section>
            <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Team Access</h3>
            
            <div className="flex gap-2 mb-4">
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none text-sm"
              >
                <option value="">Select a team to add...</option>
                {userTeams
                  .filter(t => !space.team_access?.some(ta => ta.team_id === t.id))
                  .map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none text-sm bg-gray-50 font-medium"
              >
                <option value="read">Read</option>
                <option value="write">Write</option>
              </select>
              <button
                disabled={!selectedTeam || addTeam.isPending}
                onClick={() => addTeam.mutate()}
                className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
              {space.team_access?.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-500">No teams assigned</div>
              )}
              {space.team_access?.map((access) => (
                <div key={access.id} className="flex items-center justify-between p-3 bg-white hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      {access.team.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm leading-tight">{access.team.name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Shield size={10} /> {access.permission === 'write' ? 'Can edit pages' : 'Can view pages'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeTeam.mutate(access.team_id)}
                    className="text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove access"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end flex-shrink-0 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

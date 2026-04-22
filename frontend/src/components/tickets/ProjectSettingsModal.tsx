import React, { useState, useEffect } from 'react'
import { X, Search as SearchIcon, Shield, User as UserIcon } from 'lucide-react'
import { getProjectMembers, addProjectMember, removeProjectMember, updateTicketProject } from '@/api/ticketProjects'
import { searchApi } from '@/api/search'
import type { TicketProject, ProjectPermission, UserMini } from '@/types/models'
import { useAuthStore } from '@/store/authStore'

interface Props {
  project: TicketProject
  onClose: () => void
  onUpdated?: () => void
}

export function ProjectSettingsModal({ project, onClose, onUpdated }: Props) {
  const { user: currentUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'general' | 'members'>('general')
  const [members, setMembers] = useState<ProjectPermission[]>([])
  const [loading, setLoading] = useState(true)

  // General tab state
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description || '')
  const [savingGeneral, setSavingGeneral] = useState(false)

  // Members tab state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserMini[]>([])
  const [selectedUser, setSelectedUser] = useState<UserMini | null>(null)
  const [selectedRole, setSelectedRole] = useState<'member' | 'admin'>('member')

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    try {
      const data = await getProjectMembers(project.id)
      setMembers(data)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateGeneral = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingGeneral(true)
    try {
      await updateTicketProject(project.id, { name, description })
      if (onUpdated) onUpdated()
      onClose()
    } finally {
      setSavingGeneral(false)
    }
  }

  const handleSearchUsers = async (q: string) => {
    setSearchQuery(q)
    if (q.length > 2) {
      const data = await searchApi.searchUsers(q)
      setSearchResults(data)
    } else {
      setSearchResults([])
    }
  }

  const handleAddMember = async () => {
    if (!selectedUser) return
    try {
      await addProjectMember(project.id, selectedUser.id, selectedRole)
      setSelectedUser(null)
      setSearchQuery('')
      setSearchResults([])
      await loadMembers()
    } catch {}
  }

  const handleRemoveMember = async (userId: number) => {
    if (!confirm('Are you sure you want to remove this user?')) return
    try {
      await removeProjectMember(project.id, userId)
      await loadMembers()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error removing member')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{project.icon_emoji}</span>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Project Settings</h2>
              <p className="text-xs text-gray-500 font-mono">{project.key}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex px-6 border-b border-gray-100 pt-2 gap-6 bg-white">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'general' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
          >
            General Options
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'members' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
          >
            User Access
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          
          {activeTab === 'general' && (
            <form onSubmit={handleUpdateGeneral} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={savingGeneral} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 text-sm font-medium rounded-lg disabled:opacity-50">
                  {savingGeneral ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'members' && (
            <div className="space-y-6">
              {/* Member Add Row */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h3 className="text-sm font-bold text-gray-800 mb-3 block">Invite User</h3>
                <div className="flex flex-col md:flex-row gap-3 items-end">
                  <div className="flex-1 w-full relative">
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Search Users</label>
                    <div className="relative">
                      <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={selectedUser ? selectedUser.full_name || selectedUser.username : searchQuery}
                        onChange={e => {
                          setSelectedUser(null)
                          handleSearchUsers(e.target.value)
                        }}
                        placeholder="Search by name or @username..."
                        className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                      />
                    </div>
                    {searchResults.length > 0 && !selectedUser && (
                      <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto py-1">
                        {searchResults.map(u => (
                          <button
                            key={u.id}
                            className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-sm flex flex-col"
                            onClick={() => { setSelectedUser(u); setSearchResults([]) }}
                          >
                            <span className="font-semibold text-gray-800">{u.full_name || '@'+u.username}</span>
                            <span className="text-xs text-gray-500">@{u.username}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="w-full md:w-40">
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Role</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as 'member' | 'admin')}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-indigo-500 outline-none"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button
                    onClick={handleAddMember}
                    disabled={!selectedUser}
                    className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-5 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                  >
                    Add User
                  </button>
                </div>
              </div>

              {/* Members List */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-gray-700">Access List ({members.length + 1})</h3>
                </div>
                {loading ? (
                  <div className="p-8 text-center text-gray-400 text-sm">Loading members...</div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                    {/* Explicitly show owner, since owner might not exist in ProjectPermissions unless explicitly added */}
                    <div className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                          {(project.owner?.username || 'O')[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 leading-tight">
                            {project.owner?.username} 
                            <span className="ml-2 text-xs text-amber-600 font-medium bg-amber-100 px-2 py-0.5 rounded">Owner</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">Project Creator</p>
                        </div>
                      </div>
                    </div>
                
                    {members.map(member => (
                      <div key={member.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                            {(member.user.full_name || member.user.username)[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 leading-tight">
                              {member.user.full_name || member.user.username}
                              {currentUser?.id === member.user.id && <span className="ml-2 text-[10px] text-gray-500 font-medium bg-gray-200 px-1.5 py-0.5 rounded">You</span>}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                              {member.role === 'admin' ? <Shield size={10} className="text-indigo-500"/> : <UserIcon size={10} />}
                              {member.role === 'admin' ? 'Project Admin' : 'Member'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(member.user_id)}
                          className="text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  )
}

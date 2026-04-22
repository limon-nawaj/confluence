import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Shield } from 'lucide-react'
import client from '@/api/client'
import type { User } from '@/types/models'

export default function AdminPage() {
  const qc = useQueryClient()
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['admin', 'users'],
    queryFn: () => client.get('/users').then((r) => r.data),
  })

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      client.patch(`/users/${id}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })

  const deactivate = useMutation({
    mutationFn: (id: number) => client.delete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Shield size={20} className="text-blue-600" />
        <h1 className="text-xl font-bold text-gray-900">Admin — User Management</h1>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : (
        <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              {['Username', 'Email', 'Role', 'Status', 'Actions'].map((h) => (
                <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-100">
                <td className="px-3 py-2 font-medium">{u.username}</td>
                <td className="px-3 py-2 text-gray-500">{u.email}</td>
                <td className="px-3 py-2">
                  <select
                    value={u.role}
                    onChange={(e) => updateRole.mutate({ id: u.id, role: e.target.value })}
                    className="border border-gray-200 rounded px-1.5 py-0.5 text-xs"
                  >
                    <option value="viewer">viewer</option>
                    <option value="editor">editor</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {u.is_active ? 'active' : 'inactive'}
                  </span>
                </td>
                <td className="px-3 py-2">
                  {u.is_active && (
                    <button
                      onClick={() => { if (confirm(`Deactivate ${u.username}?`)) deactivate.mutate(u.id) }}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Deactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

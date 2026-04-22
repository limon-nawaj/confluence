import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'

export default function RegisterPage() {
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', username: '', full_name: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.register(form)
      await login(form.email, form.password)
      navigate('/')
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      const msg = Array.isArray(detail) ? detail[0]?.msg : detail
      setError(typeof msg === 'string' ? msg : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center gap-2 mb-6">
          <img src="/logo.png" alt="UniDocs" className="w-9 h-9 rounded-lg object-cover shadow-md" />
          <span className="text-2xl font-bold text-gray-900">UniDocs</span>
        </div>
        <h1 className="text-lg font-semibold text-gray-800 mb-4 text-center">Create your account</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { label: 'Full name', field: 'full_name', type: 'text', placeholder: 'Jane Smith', autoComplete: 'name' },
            { label: 'Email', field: 'email', type: 'email', placeholder: 'you@university.edu', autoComplete: 'email' },
            { label: 'Username', field: 'username', type: 'text', placeholder: 'jsmith', autoComplete: 'username' },
            { label: 'Password', field: 'password', type: 'password', placeholder: '', autoComplete: 'new-password' },
          ].map(({ label, field, type, placeholder, autoComplete }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                id={`register-${field}`} name={field}
                type={type} value={(form as Record<string, string>)[field]}
                onChange={set(field)} required={field !== 'full_name'} placeholder={placeholder}
                autoComplete={autoComplete}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          ))}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

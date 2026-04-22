import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowRight, FileText, Layers, Search } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function LoginPage() {
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { icon: Layers, label: 'Organized spaces', desc: 'Group docs by team or project' },
    { icon: FileText, label: 'Rich page editor', desc: 'Tables, code blocks, and more' },
    { icon: Search, label: 'Instant search', desc: 'Find anything across all spaces' },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left panel — hero */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f111a 0%, #1e1b4b 60%, #312e81 100%)' }}
      >
        {/* Background decoration */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 70% 30%, rgba(99,102,241,0.15) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(139,92,246,0.12) 0%, transparent 50%)',
          }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <img src="/logo.png" alt="UniDocs" className="w-10 h-10 rounded-xl object-cover shadow-xl" />
          <span className="text-xl font-bold text-white tracking-tight">UniDocs</span>
        </div>

        {/* Tagline */}
        <div className="relative">
          <h2 className="text-4xl font-bold text-white leading-tight tracking-tight mb-4">
            Your team's<br />
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(90deg, #818cf8, #a78bfa)' }}
            >
              knowledge hub
            </span>
          </h2>
          <p className="text-indigo-200/60 text-sm leading-relaxed mb-8">
            Write, organize, and share documentation with your entire team — in one beautiful place.
          </p>

          <div className="space-y-4">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-indigo-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/80">{label}</p>
                  <p className="text-xs text-white/40">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/20">© 2026 UniDocs. All rights reserved.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <img src="/logo.png" alt="UniDocs" className="w-9 h-9 rounded-xl object-cover shadow-md" />
            <span className="text-xl font-bold text-gray-900">UniDocs</span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
            <p className="text-sm text-gray-500 mb-6">Sign in to continue to UniDocs</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                  placeholder="you@university.edu"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">Password</label>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2.5">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 shadow-md shadow-indigo-500/30 transition-all"
              >
                {loading ? 'Signing in...' : <>Sign in <ArrowRight size={15} /></>}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-500">
              No account?{' '}
              <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

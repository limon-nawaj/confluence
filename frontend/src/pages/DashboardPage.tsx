import { useNavigate } from 'react-router-dom'
import { Plus, BookOpen, ArrowRight, Clock, Users } from 'lucide-react'
import { useSpaces } from '@/hooks/useSpaces'
import { useAuthStore } from '@/store/authStore'

// Deterministic color palette for space icons
const SPACE_COLORS = [
  ['#6366f1', '#8b5cf6'], // indigo → violet
  ['#0ea5e9', '#06b6d4'], // sky → cyan
  ['#10b981', '#059669'], // emerald → green
  ['#f59e0b', '#d97706'], // amber → orange
  ['#ef4444', '#dc2626'], // red
  ['#ec4899', '#db2777'], // pink
]

function spaceColor(key: string): string[] {
  const idx = key.charCodeAt(0) % SPACE_COLORS.length
  return SPACE_COLORS[idx]
}

export default function DashboardPage() {
  const { data: spaces = [], isLoading } = useSpaces()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="animate-fade-in">
      {/* Hero / Welcome Banner */}
      <div
        className="px-8 py-10 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1a1d27 0%, #1e1b4b 50%, #312e81 100%)',
        }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)', transform: 'translate(20%, -30%)' }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-60 h-60 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)', transform: 'translateY(40%)' }}
        />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-indigo-300/70 text-sm font-medium mb-1">{greeting()},</p>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {user?.full_name || user?.username}
            </h1>
            <p className="text-indigo-200/50 mt-2 text-sm">
              {spaces.length > 0
                ? `You have ${spaces.length} space${spaces.length !== 1 ? 's' : ''} in your documentation hub`
                : 'Welcome to your documentation hub — create a space to get started'}
            </p>
          </div>
          <button
            onClick={() => navigate('/spaces/new')}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-xl text-sm font-medium transition-all backdrop-blur-sm"
          >
            <Plus size={15} /> New Space
          </button>
        </div>

        {/* Quick stats */}
        <div className="relative mt-8 flex gap-6">
          {[
            { icon: BookOpen, label: 'Spaces', value: spaces.length },
            { icon: Users, label: 'Team', value: '—' },
            { icon: Clock, label: 'Updated', value: 'Just now' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Icon size={15} className="text-indigo-300" />
              </div>
              <div>
                <p className="text-xs text-white/40">{label}</p>
                <p className="text-sm font-semibold text-white/80">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Spaces</h2>
          <button
            onClick={() => navigate('/spaces/new')}
            className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <Plus size={14} /> New
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : spaces.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
              <BookOpen size={28} className="text-indigo-300" />
            </div>
            <p className="text-base font-semibold text-gray-500">No spaces yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-5">Create a space to organize your documentation</p>
            <button
              onClick={() => navigate('/spaces/new')}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow shadow-indigo-500/30 transition-all"
            >
              <Plus size={15} /> Create your first space
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {spaces.map((space) => {
              const [from, to] = spaceColor(space.key)
              return (
                <button
                  key={space.id}
                  onClick={() => navigate(`/spaces/${space.key}`)}
                  className="group text-left p-5 bg-white border border-gray-200 rounded-2xl hover:shadow-md hover:border-gray-300 transition-all relative overflow-hidden"
                >
                  {/* Gradient accent line */}
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{ background: `linear-gradient(90deg, ${from}, ${to})` }}
                  />

                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-bold mb-4 shadow-md"
                    style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                  >
                    {space.name[0].toUpperCase()}
                  </div>
                  <p className="font-semibold text-gray-800 text-sm group-hover:text-indigo-700 transition-colors">
                    {space.name}
                  </p>
                  {space.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{space.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-gray-400 font-mono">{space.key}</span>
                    <ArrowRight size={14} className="text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              )
            })}

            {/* Add new space card */}
            <button
              onClick={() => navigate('/spaces/new')}
              className="text-left p-5 border-2 border-dashed border-gray-200 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex flex-col items-center justify-center gap-2 min-h-36"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-indigo-100 flex items-center justify-center">
                <Plus size={18} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-400 font-medium">New space</p>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

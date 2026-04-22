import { useState, useRef, useEffect } from 'react'
import { UniDocsLogo } from '@/components/ui/UniDocsLogo'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, LogOut, User, Settings, ChevronDown, Bell, CheckCheck, FileText, Ticket, FolderKanban } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { notificationsApi } from '@/api/notifications'
import { searchApi } from '@/api/search'
import { getTicketProjects } from '@/api/ticketProjects'
import type { Notification, SearchResult, TicketProject } from '@/types/models'
import { slugifyTitle } from '@/utils/pageSlug'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function TopBar() {
  const { user, logout } = useAuthStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1)
  const menuRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const projDropRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [projMenuOpen, setProjMenuOpen] = useState(false)
  const { data: ticketProjects = [] } = useQuery<TicketProject[]>({
    queryKey: ['ticket-projects'],
    queryFn: getTicketProjects,
    staleTime: 60000,
  })

  const { data: suggestions = [] } = useQuery<SearchResult[]>({
    queryKey: ['search-suggestions', q],
    queryFn: () => searchApi.search(q.trim(), undefined, 6),
    enabled: q.trim().length >= 2 && searchFocused,
    staleTime: 1000 * 10,
  })

  const showSuggestions = searchFocused && q.trim().length >= 2 && suggestions.length > 0

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.getAll,
    refetchInterval: 30000, // poll every 30s
  })

  const unreadCount = notifications.filter((n: Notification) => !n.is_read).length

  const markRead = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllRead = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  // Close dropdowns when clicking outside
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false)
      if (projDropRef.current && !projDropRef.current.contains(e.target as Node)) setProjMenuOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false)
        setSelectedSuggestion(-1)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  // Keyboard shortcut: Ctrl+K or / to focus search
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA')) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (q.trim()) {
      navigate(`/search?q=${encodeURIComponent(q.trim())}`)
      setQ('')
      setSearchFocused(false)
      setSelectedSuggestion(-1)
      inputRef.current?.blur()
    }
  }

  const handleSuggestionClick = (result: SearchResult) => {
    if (result.type === 'project' || result.type === 'ticket') {
      navigate(`/projects/${result.space_key}`)
    } else {
      navigate(`/spaces/${result.space_key}/${result.page_id}-${slugifyTitle(result.title)}`)
    }
    setQ('')
    setSearchFocused(false)
    setSelectedSuggestion(-1)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedSuggestion((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedSuggestion((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Escape') {
      setSearchFocused(false)
      setSelectedSuggestion(-1)
      inputRef.current?.blur()
    } else if (e.key === 'Enter' && selectedSuggestion >= 0) {
      e.preventDefault()
      handleSuggestionClick(suggestions[selectedSuggestion])
    }
  }

  const handleNotificationClick = (n: Notification) => {
    if (!n.is_read) markRead.mutate(n.id)
    if (n.page?.id) {
      if (n.page.space_key) {
        // Use ID-prefixed slug — PageViewPage legacy redirect will resolve the full path
        navigate(`/spaces/${n.page.space_key}/${n.page.id}-${slugifyTitle(n.page.title)}`)
      }
    }
    setBellOpen(false)
  }

  const initials = (user?.full_name || user?.username || 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const hue = (user?.username || 'U').charCodeAt(0) * 17 % 360

  return (
    <header
      className="h-12 flex items-center gap-3 px-4 flex-shrink-0 border-b"
      style={{ background: 'var(--topbar-bg)', borderColor: 'var(--topbar-border)' }}
    >
      {/* Logo */}
      <button onClick={() => navigate('/')} className="flex items-center gap-2 font-bold text-sm flex-shrink-0">
        <UniDocsLogo size={28} />
        <span className="text-white/90 tracking-tight hidden sm:block">UniDocs</span>
      </button>

      <div className="h-5 w-px bg-white/10 mx-2 hidden sm:block" />

      {/* Main Nav */}
      <nav className="hidden sm:flex items-center gap-1">
        <button onClick={() => navigate('/spaces')} className="px-3 py-1.5 text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-md transition-all">
          Spaces
        </button>
        <button onClick={() => navigate('/teams')} className="px-3 py-1.5 text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-md transition-all">
          Teams
        </button>
        <div className="relative" ref={projDropRef}>
          <button
            onClick={() => setProjMenuOpen(!projMenuOpen)}
            className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1 rounded-md transition-all ${projMenuOpen ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
          >
            🎫 Projects <ChevronDown size={14} className={`transition-transform ${projMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {projMenuOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 rounded-xl shadow-2xl z-50 overflow-hidden py-1 border border-white/10" style={{ background: '#1e2130' }}>
              <div className="px-3 py-2 text-xs font-semibold text-white/40 uppercase tracking-widest border-b border-white/5 mb-1">
                Recent Projects
              </div>
              {ticketProjects.length === 0 ? (
                <div className="px-4 py-3 text-sm text-white/50 italic">No projects available</div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {ticketProjects.slice(0, 5).map(proj => (
                    <button
                      key={proj.id}
                      onClick={() => { navigate(`/projects/${proj.key}`); setProjMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white flex items-center gap-2"
                    >
                      <span>{proj.icon_emoji}</span>
                      <span className="truncate">{proj.name}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="border-t border-white/5 mt-1 pt-1">
                <button
                  onClick={() => { navigate('/projects'); setProjMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-indigo-400 hover:bg-white/5 hover:text-indigo-300 font-medium"
                >
                  View all Projects...
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="h-5 w-px bg-white/10 mx-2 hidden sm:block" />

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-lg">
        <div className="relative group" ref={searchRef}>
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-indigo-400 transition-colors z-10" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setSelectedSuggestion(-1) }}
            onFocus={() => setSearchFocused(true)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search pages..."
            className="w-full pl-8 pr-14 py-1.5 text-sm rounded-lg text-white/80 placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            autoComplete="off"
          />
          {!showSuggestions && (
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 text-xs font-mono hidden sm:block">⌃K</kbd>
          )}

          {/* Suggestions dropdown */}
          {showSuggestions && (
            <div
              className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-2xl z-50 overflow-hidden"
              style={{ background: '#1e2130', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {suggestions.map((result, idx) => (
                <button
                  key={result.page_id}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(result) }}
                  className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors ${
                    idx === selectedSuggestion ? 'bg-indigo-600/20' : 'hover:bg-white/5'
                  }`}
                >
                  {result.type === 'project' ? (
                    <FolderKanban size={13} className="flex-shrink-0 text-indigo-400/70 mt-0.5" />
                  ) : result.type === 'ticket' ? (
                    <Ticket size={13} className="flex-shrink-0 text-indigo-400/70 mt-0.5" />
                  ) : (
                    <FileText size={13} className="flex-shrink-0 text-indigo-400/70 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 truncate font-medium">{result.title}</p>
                    {result.snippet && (
                      <p className="text-xs text-white/35 truncate mt-0.5">
                        {result.snippet.replace(/<\/?mark>/g, '')}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-white/25 flex-shrink-0 mt-0.5">{result.space_key}</span>
                </button>
              ))}
              <div
                className="px-4 py-2 border-t"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <button
                  type="submit"
                  className="text-xs text-indigo-400/80 hover:text-indigo-300 transition-colors w-full text-left"
                >
                  Press Enter to see all results for "{q}"
                </button>
              </div>
            </div>
          )}
        </div>
      </form>

      <div className="ml-auto flex items-center gap-2">
        {/* Notification Bell */}
        <div className="relative hidden sm:block" ref={bellRef}>
          <button
            id="notification-bell"
            onClick={() => setBellOpen(!bellOpen)}
            className="relative p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 transition-all"
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in"
              style={{ background: '#1e2130', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <p className="text-sm font-bold text-white/80">Notifications</p>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead.mutate()}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                    title="Mark all as read"
                  >
                    <CheckCheck size={13} /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-white/30">No notifications yet</div>
                ) : (
                  notifications.map((n: Notification) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/5 ${
                        !n.is_read ? 'bg-indigo-600/10' : ''
                      }`}
                    >
                      {/* Actor avatar */}
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                        style={{ background: `hsl(${(n.actor?.username || 'U').charCodeAt(0) * 17 % 360}, 65%, 55%)` }}
                      >
                        {(n.actor?.full_name || n.actor?.username || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/75 leading-snug">{n.message}</p>
                        {n.page && (
                          <p className="text-xs text-indigo-400/80 mt-0.5 truncate">📄 {n.page.title}</p>
                        )}
                        <p className="text-xs text-white/30 mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                      {!n.is_read && (
                        <div className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0 mt-2" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/10 transition-all"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md"
              style={{ background: `hsl(${hue}, 70%, 55%)` }}
            >
              {initials}
            </div>
            <span className="text-sm text-white/60 hidden md:block">{user?.username}</span>
            <ChevronDown size={13} className="text-white/30 hidden md:block" />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-52 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in"
              style={{ background: '#1e2130', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <p className="text-sm font-semibold text-white/80">{user?.full_name || user?.username}</p>
                <p className="text-xs text-white/40 mt-0.5 truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { setMenuOpen(false); navigate('/profile') }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-white/60 hover:text-white/90 hover:bg-white/5 transition-colors"
                >
                  <User size={14} /> Profile
                </button>
                <button
                  onClick={() => { setMenuOpen(false); navigate('/admin') }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-white/60 hover:text-white/90 hover:bg-white/5 transition-colors"
                >
                  <Settings size={14} /> Settings
                </button>
              </div>
              <div className="py-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <button
                  onClick={() => { setMenuOpen(false); logout() }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

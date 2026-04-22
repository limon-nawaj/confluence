import type { TicketType, TicketStatus, TicketPriority } from '@/types/models'

// ─── Type Display ─────────────────────────────────────────────────────────────

export const TICKET_TYPE_META: Record<TicketType, { icon: string; label: string; color: string }> = {
  bug:         { icon: '🐛', label: 'Bug',         color: '#ef4444' },
  feature:     { icon: '🚀', label: 'Feature',     color: '#8b5cf6' },
  task:        { icon: '✅', label: 'Task',         color: '#3b82f6' },
  improvement: { icon: '📈', label: 'Improvement', color: '#10b981' },
  epic:        { icon: '🏔️', label: 'Epic',        color: '#f59e0b' },
}

// ─── Status Display ───────────────────────────────────────────────────────────

export const TICKET_STATUS_META: Record<TicketStatus, { label: string; color: string; bg: string }> = {
  backlog:     { label: 'Backlog',     color: '#6b7280', bg: '#f3f4f6' },
  todo:        { label: 'To Do',       color: '#3b82f6', bg: '#eff6ff' },
  in_progress: { label: 'In Progress', color: '#f59e0b', bg: '#fffbeb' },
  in_review:   { label: 'In Review',   color: '#8b5cf6', bg: '#f5f3ff' },
  done:        { label: 'Done',        color: '#10b981', bg: '#ecfdf5' },
  cancelled:   { label: 'Cancelled',   color: '#ef4444', bg: '#fef2f2' },
}

export const KANBAN_COLUMNS: TicketStatus[] = ['backlog', 'todo', 'in_progress', 'in_review', 'done']

// ─── Priority Display ─────────────────────────────────────────────────────────

export const TICKET_PRIORITY_META: Record<TicketPriority, { label: string; color: string; icon: string }> = {
  critical: { label: 'Critical', color: '#ef4444', icon: '🔴' },
  high:     { label: 'High',     color: '#f97316', icon: '🟠' },
  medium:   { label: 'Medium',   color: '#eab308', icon: '🟡' },
  low:      { label: 'Low',      color: '#22c55e', icon: '🟢' },
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────

export const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const isOverdue = (dateStr?: string | null): boolean => {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

// ─── Avatar Initials ──────────────────────────────────────────────────────────

export const getInitials = (name?: string, username?: string): string => {
  const src = name || username || '?'
  return src.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

// ─── Pastel Colors ────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
]

export const getAvatarColor = (id: number): string =>
  AVATAR_COLORS[id % AVATAR_COLORS.length]

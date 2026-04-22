import React, { useEffect, useState, useRef } from 'react'
import type { TicketDetail, TicketComment, TicketStatus, TicketPriority, TicketType, UserMini } from '@/types/models'
import { getTicketDetail, addComment, patchTicketStatus, updateTicket, watchTicket, unwatchTicket, addAssignee, removeAssignee } from '@/api/tickets'
import { searchApi } from '@/api/search'
import { X, Search as SearchIcon, Plus } from 'lucide-react'
import {
  TICKET_TYPE_META, TICKET_STATUS_META, TICKET_PRIORITY_META,
  KANBAN_COLUMNS, formatDate, isOverdue, getInitials, getAvatarColor,
} from '@/utils/ticketUtils'
import { useAuthStore } from '@/store/authStore'

interface Props {
  ticketId: number
  onClose: () => void
  onUpdated: () => void
}

export const TicketDetailModal: React.FC<Props> = ({ ticketId, onClose, onUpdated }) => {
  const { user } = useAuthStore()
  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const titleRef = useRef<HTMLInputElement>(null)

  // Assignee Search
  const [showAssigneeSearch, setShowAssigneeSearch] = useState(false)
  const [assigneeQuery, setAssigneeQuery] = useState('')
  const [assigneeResults, setAssigneeResults] = useState<UserMini[]>([])

  // Reporter Search
  const [showReporterSearch, setShowReporterSearch] = useState(false)
  const [reporterQuery, setReporterQuery] = useState('')
  const [reporterResults, setReporterResults] = useState<UserMini[]>([])

  const load = async () => {
    setLoading(true)
    try {
      const t = await getTicketDetail(ticketId)
      setTicket(t)
      setTitleDraft(t.title)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [ticketId])

  const handleStatusChange = async (status: TicketStatus) => {
    if (!ticket) return
    await patchTicketStatus(ticket.id, status)
    setTicket(prev => prev ? { ...prev, status } : prev)
    onUpdated()
  }

  const handlePriorityChange = async (priority: TicketPriority) => {
    if (!ticket) return
    await updateTicket(ticket.id, { priority })
    setTicket(prev => prev ? { ...prev, priority } : prev)
    onUpdated()
  }

  const handleTitleSave = async () => {
    if (!ticket || !titleDraft.trim() || titleDraft === ticket.title) {
      setEditingTitle(false)
      return
    }
    await updateTicket(ticket.id, { title: titleDraft.trim() })
    setTicket(prev => prev ? { ...prev, title: titleDraft.trim() } : prev)
    setEditingTitle(false)
    onUpdated()
  }

  const handleWatch = async () => {
    if (!ticket || !user) return
    const isWatching = ticket.watchers.some(w => w.id === user.id)
    if (isWatching) {
      await unwatchTicket(ticket.id)
      setTicket(prev => prev ? { ...prev, watchers: prev.watchers.filter(w => w.id !== user.id) } : prev)
    } else {
      await watchTicket(ticket.id)
      setTicket(prev => prev ? { ...prev, watchers: [...prev.watchers, { id: user.id, username: user.username, full_name: user.full_name }] } : prev)
    }
  }

  const handleAddComment = async () => {
    if (!ticket || !commentText.trim()) return
    setSubmittingComment(true)
    try {
      const comment = await addComment(ticket.id, commentText.trim())
      setTicket(prev => prev ? { ...prev, comments: [...prev.comments, comment] } : prev)
      setCommentText('')
    } finally {
      setSubmittingComment(false)
    }
  }

  const doAssigneeSearch = async (q: string) => {
    setAssigneeQuery(q)
    if (q.length > 2) {
      const data = await searchApi.searchUsers(q)
      setAssigneeResults(data)
    } else {
      setAssigneeResults([])
    }
  }

  const doReporterSearch = async (q: string) => {
    setReporterQuery(q)
    if (q.length > 2) {
      const data = await searchApi.searchUsers(q)
      setReporterResults(data)
    } else {
      setReporterResults([])
    }
  }

  const handleAddAssignee = async (u: UserMini) => {
    if (!ticket) return
    await addAssignee(ticket.id, u.id)
    setTicket(prev => prev ? { ...prev, assignees: [...prev.assignees, u] } : prev)
    setShowAssigneeSearch(false)
    setAssigneeQuery('')
    setAssigneeResults([])
    onUpdated()
  }

  const handleRemoveAssignee = async (userId: number) => {
    if (!ticket) return
    await removeAssignee(ticket.id, userId)
    setTicket(prev => prev ? { ...prev, assignees: prev.assignees.filter(a => a.id !== userId) } : prev)
    onUpdated()
  }

  const handleChangeReporter = async (u: UserMini) => {
    if (!ticket) return
    await updateTicket(ticket.id, { created_by: u.id })
    setTicket(prev => prev ? { ...prev, creator: u } : prev)
    setShowReporterSearch(false)
    setReporterQuery('')
    setReporterResults([])
    onUpdated()
  }

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="ticket-detail-panel" onClick={e => e.stopPropagation()}>
          <div className="ticket-detail-panel__loading">
            <div className="spinner" />
          </div>
        </div>
      </div>
    )
  }

  if (!ticket) return null

  const typeMeta = TICKET_TYPE_META[ticket.type]
  const statusMeta = TICKET_STATUS_META[ticket.status]
  const priorityMeta = TICKET_PRIORITY_META[ticket.priority]
  const isWatching = user ? ticket.watchers.some(w => w.id === user.id) : false

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="ticket-detail-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="ticket-detail-panel__header">
          <div className="ticket-detail-panel__meta">
            <span className="ticket-detail-panel__type-icon">{typeMeta.icon}</span>
            <span className="ticket-detail-panel__key">{ticket.ticket_key}</span>
          </div>
          <div className="ticket-detail-panel__actions">
            <button
              className={`btn btn--xs ${isWatching ? 'btn--ghost-active' : 'btn--ghost'}`}
              onClick={handleWatch}
              title={isWatching ? 'Stop watching' : 'Watch ticket'}
            >
              {isWatching ? '👁️ Watching' : '👁️ Watch'}
            </button>
            <button className="modal-panel__close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="ticket-detail-panel__body">
          {/* Left: Main content */}
          <div className="ticket-detail-panel__main">
            {/* Title */}
            {editingTitle ? (
              <input
                ref={titleRef}
                className="ticket-detail-panel__title-input"
                value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={e => { if (e.key === 'Enter') handleTitleSave(); if (e.key === 'Escape') setEditingTitle(false) }}
                autoFocus
              />
            ) : (
              <h1 className="ticket-detail-panel__title" onClick={() => setEditingTitle(true)}>
                {ticket.title}
                <span className="ticket-detail-panel__title-edit-hint">✏️</span>
              </h1>
            )}

            {/* Description */}
            <div className="ticket-detail-panel__section">
              <h3 className="ticket-detail-panel__section-title">Description</h3>
              {ticket.description ? (
                <div className="ticket-detail-panel__description">{ticket.description}</div>
              ) : (
                <p className="ticket-detail-panel__empty">No description provided.</p>
              )}
            </div>

            {/* Comments */}
            <div className="ticket-detail-panel__section">
              <h3 className="ticket-detail-panel__section-title">
                Activity <span className="badge">{ticket.comments.length}</span>
              </h3>

              <div className="ticket-comments">
                {ticket.comments.map(c => (
                  <CommentItem key={c.id} comment={c} />
                ))}
              </div>

              {/* Add comment */}
              <div className="ticket-comments__add">
                <div
                  className="ticket-comments__avatar"
                  style={{ background: user ? getAvatarColor(user.id) : '#6366f1' }}
                >
                  {user ? getInitials(user.full_name, user.username) : '?'}
                </div>
                <div className="ticket-comments__input-wrap">
                  <textarea
                    className="ticket-comments__input"
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Add a comment…"
                    rows={3}
                  />
                  <div className="ticket-comments__submit-row">
                    <button
                      className="btn btn--primary btn--sm"
                      onClick={handleAddComment}
                      disabled={!commentText.trim() || submittingComment}
                    >
                      {submittingComment ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Sidebar */}
          <div className="ticket-detail-panel__sidebar">
            {/* Status */}
            <div className="ticket-sidebar__field">
              <label className="ticket-sidebar__label">Status</label>
              <select
                className="ticket-sidebar__select"
                value={ticket.status}
                onChange={e => handleStatusChange(e.target.value as TicketStatus)}
                style={{ color: statusMeta.color }}
              >
                {KANBAN_COLUMNS.map(s => (
                  <option key={s} value={s}>{TICKET_STATUS_META[s].label}</option>
                ))}
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Priority */}
            <div className="ticket-sidebar__field">
              <label className="ticket-sidebar__label">Priority</label>
              <select
                className="ticket-sidebar__select"
                value={ticket.priority}
                onChange={e => handlePriorityChange(e.target.value as TicketPriority)}
                style={{ color: priorityMeta.color }}
              >
                {(['critical', 'high', 'medium', 'low'] as TicketPriority[]).map(p => (
                  <option key={p} value={p}>{TICKET_PRIORITY_META[p].icon} {TICKET_PRIORITY_META[p].label}</option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div className="ticket-sidebar__field">
              <label className="ticket-sidebar__label">Type</label>
              <div className="ticket-sidebar__value">
                {typeMeta.icon} {typeMeta.label}
              </div>
            </div>

            {/* Story Points */}
            {ticket.story_points != null && (
              <div className="ticket-sidebar__field">
                <label className="ticket-sidebar__label">Story Points</label>
                <div className="ticket-sidebar__value">{ticket.story_points} pts</div>
              </div>
            )}

            {/* Due Date */}
            {ticket.due_date && (
              <div className="ticket-sidebar__field">
                <label className="ticket-sidebar__label">Due Date</label>
                <div
                  className="ticket-sidebar__value"
                  style={{ color: isOverdue(ticket.due_date) ? '#ef4444' : undefined }}
                >
                  📅 {formatDate(ticket.due_date)}
                  {isOverdue(ticket.due_date) && <span style={{ fontWeight: 600 }}> Overdue</span>}
                </div>
              </div>
            )}

            {/* Reporter */}
            <div className="ticket-sidebar__field">
              <label className="ticket-sidebar__label flex justify-between items-center">
                Reporter 
                <button onClick={() => setShowReporterSearch(!showReporterSearch)} className="text-gray-400 hover:text-indigo-600 transition-colors">
                  ✏️
                </button>
              </label>
              
              {showReporterSearch ? (
                <div className="relative mt-1 mb-2">
                  <div className="relative">
                    <SearchIcon size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      autoFocus
                      value={reporterQuery}
                      onChange={e => doReporterSearch(e.target.value)}
                      placeholder="Search to change..."
                      className="w-full border border-gray-300 rounded text-xs pl-6 pr-2 py-1.5 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  {reporterResults.length > 0 && (
                    <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded shadow-lg z-20 max-h-40 overflow-y-auto">
                      {reporterResults.map(u => (
                        <button key={u.id} className="w-full text-left px-3 py-1.5 hover:bg-indigo-50 text-xs flex items-center gap-2" onClick={() => handleChangeReporter(u)}>
                          <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[9px] uppercase">
                            {(u.full_name || u.username)[0]}
                          </div>
                          <span className="truncate">{u.full_name || u.username}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="ticket-sidebar__user mt-1">
                  <div
                    className="ticket-sidebar__avatar"
                    style={{ background: ticket.creator ? getAvatarColor(ticket.creator.id) : '#6366f1' }}
                  >
                    {getInitials(ticket.creator?.full_name, ticket.creator?.username)}
                  </div>
                  <span>{ticket.creator?.full_name || ticket.creator?.username || '—'}</span>
                </div>
              )}
            </div>

            {/* Assignees */}
            <div className="ticket-sidebar__field">
              <label className="ticket-sidebar__label flex justify-between items-center">
                Assignees
                <button onClick={() => setShowAssigneeSearch(!showAssigneeSearch)} className="text-gray-400 hover:text-indigo-600 transition-colors">
                  <Plus size={14} />
                </button>
              </label>

              {showAssigneeSearch && (
                <div className="relative mt-1 mb-2">
                  <div className="relative">
                    <SearchIcon size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      autoFocus
                      value={assigneeQuery}
                      onChange={e => doAssigneeSearch(e.target.value)}
                      placeholder="Search user..."
                      className="w-full border border-gray-300 rounded text-xs pl-6 pr-2 py-1.5 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  {assigneeResults.length > 0 && (
                    <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded shadow-lg z-20 max-h-40 overflow-y-auto">
                      {assigneeResults.filter(u => !ticket.assignees.some(a => a.id === u.id)).map(u => (
                        <button key={u.id} className="w-full text-left px-3 py-1.5 hover:bg-indigo-50 text-xs flex items-center gap-2" onClick={() => handleAddAssignee(u)}>
                          <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[9px] uppercase">
                            {(u.full_name || u.username)[0]}
                          </div>
                          <span className="truncate">{u.full_name || u.username}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {ticket.assignees.length === 0 ? (
                <span className="ticket-sidebar__empty mt-1 block">Unassigned</span>
              ) : (
                <div className="ticket-sidebar__assignees mt-1">
                  {ticket.assignees.map(a => (
                    <div key={a.id} className="ticket-sidebar__user group relative pr-6">
                      <div
                        className="ticket-sidebar__avatar"
                        style={{ background: getAvatarColor(a.id) }}
                      >
                        {getInitials(a.full_name, a.username)}
                      </div>
                      <span className="truncate">{a.full_name || a.username}</span>
                      <button onClick={() => handleRemoveAssignee(a.id)} className="absolute right-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all bg-white rounded-full p-0.5 shadow-sm border border-gray-200">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Labels */}
            {ticket.labels.length > 0 && (
              <div className="ticket-sidebar__field">
                <label className="ticket-sidebar__label">Labels</label>
                <div className="ticket-sidebar__labels">
                  {ticket.labels.map(l => (
                    <span
                      key={l.id}
                      className="kanban-card__label"
                      style={{ background: l.color + '22', color: l.color, border: `1px solid ${l.color}44` }}
                    >
                      {l.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Watchers */}
            <div className="ticket-sidebar__field">
              <label className="ticket-sidebar__label">Watchers ({ticket.watchers.length})</label>
              <div className="ticket-sidebar__watcher-avatars">
                {ticket.watchers.map(w => (
                  <div
                    key={w.id}
                    className="ticket-sidebar__avatar"
                    style={{ background: getAvatarColor(w.id) }}
                    title={w.full_name || w.username}
                  >
                    {getInitials(w.full_name, w.username)}
                  </div>
                ))}
              </div>
            </div>

            {/* Links */}
            {(ticket.links_as_source.length > 0 || ticket.links_as_target.length > 0) && (
              <div className="ticket-sidebar__field">
                <label className="ticket-sidebar__label">Linked Tickets</label>
                {ticket.links_as_source.map(l => (
                  <div key={l.id} className="ticket-sidebar__link">
                    <span className="ticket-sidebar__link-type">{l.link_type.replace('_', ' ')}</span>
                    <span className="ticket-sidebar__link-key">#{l.target_ticket_id}</span>
                  </div>
                ))}
                {ticket.links_as_target.map(l => (
                  <div key={l.id} className="ticket-sidebar__link">
                    <span className="ticket-sidebar__link-type">{l.link_type.replace('_', ' ')} by</span>
                    <span className="ticket-sidebar__link-key">#{l.source_ticket_id}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Created at */}
            <div className="ticket-sidebar__field">
              <label className="ticket-sidebar__label">Created</label>
              <div className="ticket-sidebar__value ticket-sidebar__value--muted">
                {formatDate(ticket.created_at)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Comment Item ─────────────────────────────────────────────────────────────

const CommentItem: React.FC<{ comment: TicketComment }> = ({ comment }) => {
  return (
    <div className="ticket-comment">
      <div
        className="ticket-comment__avatar"
        style={{ background: getAvatarColor(comment.author.id) }}
      >
        {getInitials(comment.author.full_name, comment.author.username)}
      </div>
      <div className="ticket-comment__body">
        <div className="ticket-comment__header">
          <span className="ticket-comment__author">{comment.author.full_name || comment.author.username}</span>
          <span className="ticket-comment__time">{formatDate(comment.created_at)}</span>
        </div>
        <div className="ticket-comment__content">{comment.content}</div>
        {comment.replies?.map(r => (
          <CommentItem key={r.id} comment={r} />
        ))}
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import type { TicketProject, TicketType, TicketPriority, UserMini, TicketLabel, Sprint } from '@/types/models'
import { createTicket } from '@/api/tickets'
import type { Ticket } from '@/types/models'
import { TICKET_TYPE_META, TICKET_PRIORITY_META } from '@/utils/ticketUtils'

interface Props {
  project: TicketProject
  sprints: Sprint[]
  members: UserMini[]
  labels: TicketLabel[]
  onClose: () => void
  onCreated: (ticket: Ticket) => void
  defaultStatus?: string
}

const TYPES: TicketType[] = ['task', 'bug', 'feature', 'improvement', 'epic']
const PRIORITIES: TicketPriority[] = ['medium', 'high', 'low', 'critical']

export const CreateTicketModal: React.FC<Props> = ({
  project, sprints, members, labels, onClose, onCreated, defaultStatus,
}) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<TicketType>('task')
  const [priority, setPriority] = useState<TicketPriority>('medium')
  const [storyPoints, setStoryPoints] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assigneeIds, setAssigneeIds] = useState<number[]>([])
  const [labelIds, setLabelIds] = useState<number[]>([])
  const [sprintId, setSprintId] = useState<number | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleAssignee = (id: number) =>
    setAssigneeIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const toggleLabel = (id: number) =>
    setLabelIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError('')
    try {
      const ticket = await createTicket({
        project_id: project.id,
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        priority,
        story_points: storyPoints ? parseInt(storyPoints) : undefined,
        due_date: dueDate || undefined,
        assignee_ids: assigneeIds,
        label_ids: labelIds,
        sprint_id: sprintId !== '' ? sprintId : undefined,
      })
      onCreated(ticket)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to create ticket')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel modal-panel--wide" onClick={e => e.stopPropagation()}>
        <div className="modal-panel__header">
          <div className="modal-panel__header-left">
            <span style={{ fontSize: 20 }}>{project.icon_emoji}</span>
            <h2 className="modal-panel__title">Create Ticket — {project.key}</h2>
          </div>
          <button className="modal-panel__close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-panel__body">
          {/* Title */}
          <div className="create-ticket__field">
            <input
              className="create-ticket__title-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
              autoFocus
            />
          </div>

          {/* Type + Priority row */}
          <div className="create-ticket__row">
            <div className="create-ticket__field create-ticket__field--half">
              <label className="create-ticket__label">Type</label>
              <div className="create-ticket__toggle-group">
                {TYPES.map(t => {
                  const m = TICKET_TYPE_META[t]
                  return (
                    <button
                      key={t} type="button"
                      className={`create-ticket__toggle ${type === t ? 'active' : ''}`}
                      onClick={() => setType(t)}
                      title={m.label}
                    >
                      {m.icon} <span>{m.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="create-ticket__field create-ticket__field--half">
              <label className="create-ticket__label">Priority</label>
              <div className="create-ticket__toggle-group">
                {PRIORITIES.map(p => {
                  const m = TICKET_PRIORITY_META[p]
                  return (
                    <button
                      key={p} type="button"
                      className={`create-ticket__toggle ${priority === p ? 'active' : ''}`}
                      onClick={() => setPriority(p)}
                    >
                      {m.icon} <span>{m.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="create-ticket__field">
            <label className="create-ticket__label">Description</label>
            <textarea
              className="create-ticket__textarea"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add more details…"
              rows={4}
            />
          </div>

          {/* Story points + Due date */}
          <div className="create-ticket__row">
            <div className="create-ticket__field create-ticket__field--half">
              <label className="create-ticket__label">Story Points</label>
              <input
                className="create-ticket__input"
                type="number" min="0" max="999"
                value={storyPoints}
                onChange={e => setStoryPoints(e.target.value)}
                placeholder="e.g. 3"
              />
            </div>
            <div className="create-ticket__field create-ticket__field--half">
              <label className="create-ticket__label">Due Date</label>
              <input
                className="create-ticket__input"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Sprint */}
          {sprints.length > 0 && (
            <div className="create-ticket__field">
              <label className="create-ticket__label">Sprint</label>
              <select
                className="create-ticket__select"
                value={sprintId}
                onChange={e => setSprintId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">No sprint (backlog)</option>
                {sprints.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Assignees */}
          {members.length > 0 && (
            <div className="create-ticket__field">
              <label className="create-ticket__label">Assignees</label>
              <div className="create-ticket__tag-list">
                {members.map(m => (
                  <button
                    key={m.id} type="button"
                    className={`create-ticket__tag ${assigneeIds.includes(m.id) ? 'active' : ''}`}
                    onClick={() => toggleAssignee(m.id)}
                  >
                    {(m.full_name || m.username)[0].toUpperCase()} {m.full_name || m.username}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Labels */}
          {labels.length > 0 && (
            <div className="create-ticket__field">
              <label className="create-ticket__label">Labels</label>
              <div className="create-ticket__tag-list">
                {labels.map(l => (
                  <button
                    key={l.id} type="button"
                    className={`create-ticket__tag ${labelIds.includes(l.id) ? 'active' : ''}`}
                    style={labelIds.includes(l.id) ? { background: l.color + '33', borderColor: l.color, color: l.color } : {}}
                    onClick={() => toggleLabel(l.id)}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="create-project__error">{error}</p>}

          <div className="modal-panel__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

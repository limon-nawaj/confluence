import React, { useState } from 'react'
import type { TicketProject } from '@/types/models'
import { createTicketProject } from '@/api/ticketProjects'

const EMOJI_OPTIONS = ['🎫', '🚀', '🐛', '✅', '🏔️', '🔧', '📊', '🎯', '💡', '🛡️']
const COLOR_OPTIONS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6',
]

interface Props {
  onClose: () => void
  onCreated: (project: TicketProject) => void
}

export const CreateProjectModal: React.FC<Props> = ({ onClose, onCreated }) => {
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [description, setDescription] = useState('')
  const [iconEmoji, setIconEmoji] = useState('🎫')
  const [iconColor, setIconColor] = useState('#6366f1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleNameChange = (val: string) => {
    setName(val)
    // Auto-generate key from name words
    const autoKey = val
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .trim()
      .split(/\s+/)
      .map(w => w[0] || '')
      .join('')
      .slice(0, 6)
    setKey(autoKey)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !key.trim()) return
    setLoading(true)
    setError('')
    try {
      const project = await createTicketProject({
        name: name.trim(),
        key: key.trim().toUpperCase(),
        description: description.trim() || undefined,
        icon_emoji: iconEmoji,
        icon_color: iconColor,
      })
      onCreated(project)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-panel__header">
          <h2 className="modal-panel__title">Create Project</h2>
          <button className="modal-panel__close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-panel__body">
          {/* Icon Preview */}
          <div className="create-project__icon-preview" style={{ background: iconColor + '22', border: `2px solid ${iconColor}` }}>
            <span style={{ fontSize: 32 }}>{iconEmoji}</span>
          </div>

          {/* Emoji picker */}
          <div className="create-project__field">
            <label className="create-project__label">Icon</label>
            <div className="create-project__emoji-picker">
              {EMOJI_OPTIONS.map(e => (
                <button
                  key={e} type="button"
                  className={`create-project__emoji-btn ${iconEmoji === e ? 'active' : ''}`}
                  onClick={() => setIconEmoji(e)}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div className="create-project__field">
            <label className="create-project__label">Color</label>
            <div className="create-project__color-picker">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c} type="button"
                  className={`create-project__color-btn ${iconColor === c ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setIconColor(c)}
                />
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="create-project__field">
            <label className="create-project__label">Project Name *</label>
            <input
              className="create-project__input"
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="Engineering Tracker"
              required
            />
          </div>

          {/* Key */}
          <div className="create-project__field">
            <label className="create-project__label">Project Key *</label>
            <input
              className="create-project__input create-project__input--mono"
              value={key}
              onChange={e => setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
              placeholder="ENG"
              required
            />
            <span className="create-project__hint">Used as ticket prefix, e.g. ENG-1, ENG-2</span>
          </div>

          {/* Description */}
          <div className="create-project__field">
            <label className="create-project__label">Description</label>
            <textarea
              className="create-project__textarea"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What is this project about?"
              rows={3}
            />
          </div>

          {error && <p className="create-project__error">{error}</p>}

          <div className="modal-panel__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

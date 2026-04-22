import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TicketProject } from '@/types/models'
import { getTicketProjects } from '@/api/ticketProjects'
import { CreateProjectModal } from '@/components/tickets/CreateProjectModal'
import { formatDate } from '@/utils/ticketUtils'

export default function TicketProjectsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<TicketProject[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await getTicketProjects()
      setProjects(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.key.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="ticket-projects-page">
      {/* Page header */}
      <div className="ticket-projects-page__header">
        <div>
          <h1 className="ticket-projects-page__title">🎫 Projects</h1>
          <p className="ticket-projects-page__subtitle">
            Manage your ticketing projects and track work across your team.
          </p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowCreate(true)}>
          + New Project
        </button>
      </div>

      {/* Search */}
      <div className="ticket-projects-page__search-wrap">
        <input
          className="ticket-projects-page__search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search projects…"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="ticket-projects-page__loading">
          <div className="spinner" />
          <p>Loading projects…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="ticket-projects-page__empty">
          <div className="ticket-projects-page__empty-icon">🎫</div>
          <h3>No projects yet</h3>
          <p>Create your first project to start tracking tickets.</p>
          <button className="btn btn--primary" onClick={() => setShowCreate(true)}>
            + Create Project
          </button>
        </div>
      ) : (
        <div className="ticket-projects-grid">
          {filtered.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => navigate(`/projects/${project.key}`)}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={(p) => {
            setProjects(prev => [p, ...prev])
            setShowCreate(false)
            navigate(`/projects/${p.key}`)
          }}
        />
      )}
    </div>
  )
}

// ─── Project Card ─────────────────────────────────────────────────────────────

const ProjectCard: React.FC<{ project: TicketProject; onClick: () => void }> = ({ project, onClick }) => (
  <div className="project-card" onClick={onClick} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onClick()}>
    <div className="project-card__header">
      <div
        className="project-card__icon"
        style={{ background: project.icon_color + '22', border: `2px solid ${project.icon_color}44` }}
      >
        <span style={{ fontSize: 28 }}>{project.icon_emoji}</span>
      </div>
      <div className="project-card__key-badge" style={{ background: project.icon_color + '22', color: project.icon_color }}>
        {project.key}
      </div>
    </div>
    <h3 className="project-card__name">{project.name}</h3>
    {project.description && (
      <p className="project-card__desc">{project.description}</p>
    )}
    <div className="project-card__footer">
      <span className="project-card__stat">
        <span style={{ color: '#6366f1', fontWeight: 600 }}>{project.open_ticket_count ?? project.ticket_counter}</span> open tickets
      </span>
      <span className="project-card__date">Created {formatDate(project.created_at)}</span>
    </div>
  </div>
)

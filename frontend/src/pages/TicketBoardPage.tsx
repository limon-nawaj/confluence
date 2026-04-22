import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd'
import type { Ticket, TicketProject, Sprint, TicketStatus, TicketLabel, UserMini } from '@/types/models'
import { getTickets, patchTicketStatus } from '@/api/tickets'
import { getTicketProject } from '@/api/ticketProjects'
import { getSprints } from '@/api/sprints'
import { getLabels } from '@/api/tickets'
import { KanbanCard } from '@/components/tickets/KanbanCard'
import { CreateTicketModal } from '@/components/tickets/CreateTicketModal'
import { TicketDetailModal } from '@/components/tickets/TicketDetailModal'
import { ProjectSettingsModal } from '@/components/tickets/ProjectSettingsModal'
import { Settings } from 'lucide-react'
import { TICKET_STATUS_META, KANBAN_COLUMNS, TICKET_PRIORITY_META, TICKET_TYPE_META } from '@/utils/ticketUtils'

const COLUMN_ICONS: Record<string, string> = {
  backlog: '📋',
  todo: '📌',
  in_progress: '⚡',
  in_review: '🔍',
  done: '✅',
}

export default function TicketBoardPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const id = parseInt(projectId ?? '0')

  const [project, setProject] = useState<TicketProject | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [labels, setLabels] = useState<TicketLabel[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSprintId, setSelectedSprintId] = useState<number | ''>('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterSearch, setFilterSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'board' | 'list'>('board')
  const [showSettings, setShowSettings] = useState(false)

  const loadAll = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true)
    try {
      // Allow project resolving by Key or ID
      const proj = await getTicketProject(projectId || '0')
      
      const [ticketData, sprintData, labelData] = await Promise.all([
        getTickets({ project_id: proj.id }),
        getSprints(proj.id),
        getLabels(proj.id),
      ])
      setProject(proj)
      setTickets(ticketData)
      setSprints(sprintData)
      setLabels(labelData)
    } finally {
      if (!options?.silent) setLoading(false)
    }
  }, [id])

  useEffect(() => { loadAll() }, [loadAll])

  const getFilteredTickets = (status: TicketStatus): Ticket[] => {
    return tickets.filter(t => {
      if (t.status !== status) return false
      if (filterPriority && t.priority !== filterPriority) return false
      if (filterType && t.type !== filterType) return false
      if (filterSearch && !t.title.toLowerCase().includes(filterSearch.toLowerCase())) return false
      if (selectedSprintId !== '' && !t.sprint_ids?.includes(selectedSprintId as number)) return false
      return true
    })
  }

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    const { draggableId, destination } = result
    const ticketId = parseInt(draggableId)
    const newStatus = destination.droppableId as TicketStatus
    // Optimistic update
    setTickets(prev =>
      prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t)
    )
    try {
      await patchTicketStatus(ticketId, newStatus)
    } catch {
      // revert on failure
      loadAll({ silent: true })
    }
  }

  const activeSprint = sprints.find(s => s.status === 'active')

  if (loading) {
    return (
      <div className="board-page__loading">
        <div className="spinner" />
        <p>Loading board…</p>
      </div>
    )
  }

  if (!project) {
    return <div className="board-page__error">Project not found.</div>
  }

  return (
    <div className="board-page">
      {/* Header */}
      <div className="board-page__header">
        <div className="board-page__breadcrumb">
          <button className="board-page__back" onClick={() => navigate('/projects')}>
            ← Projects
          </button>
          <span className="board-page__sep">/</span>
          <span className="board-page__project-icon">{project.icon_emoji}</span>
          <h1 className="board-page__title">{project.name}</h1>
          <span className="board-page__key-badge" style={{ color: project.icon_color, background: project.icon_color + '18' }}>
            {project.key}
          </span>
        </div>
        <div className="board-page__header-actions">
          <div className="board-page__tabs">
            <button
              className={`board-page__tab ${activeTab === 'board' ? 'active' : ''}`}
              onClick={() => setActiveTab('board')}
            >
              🗂️ Board
            </button>
            <button
              className={`board-page__tab ${activeTab === 'list' ? 'active' : ''}`}
              onClick={() => setActiveTab('list')}
            >
              📋 List
            </button>
          </div>
          <button className="btn btn--ghost px-2" onClick={() => setShowSettings(true)} title="Project Settings">
            <Settings size={18} />
          </button>
          <button className="btn btn--primary" onClick={() => setShowCreate(true)}>
            + Ticket
          </button>
        </div>
      </div>

      {/* Sprint banner */}
      {activeSprint && (
        <div className="board-page__sprint-banner">
          <div className="sprint-banner__content">
            <span className="sprint-banner__icon">⚡</span>
            <div>
              <span className="sprint-banner__name">{activeSprint.name}</span>
              {activeSprint.goal && <span className="sprint-banner__goal"> — {activeSprint.goal}</span>}
            </div>
          </div>
          {(activeSprint.start_date || activeSprint.end_date) && (
            <span className="sprint-banner__dates">
              {activeSprint.start_date} → {activeSprint.end_date}
            </span>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="board-page__filters">
        <input
          className="board-page__filter-search"
          placeholder="🔍 Search…"
          value={filterSearch}
          onChange={e => setFilterSearch(e.target.value)}
        />
        <select
          className="board-page__filter-select"
          value={selectedSprintId}
          onChange={e => setSelectedSprintId(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">All sprints</option>
          {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select
          className="board-page__filter-select"
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
        >
          <option value="">All priorities</option>
          {(['critical', 'high', 'medium', 'low'] as const).map(p => (
            <option key={p} value={p}>{TICKET_PRIORITY_META[p].icon} {TICKET_PRIORITY_META[p].label}</option>
          ))}
        </select>
        <select
          className="board-page__filter-select"
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
        >
          <option value="">All types</option>
          {(['bug', 'feature', 'task', 'improvement', 'epic'] as const).map(t => (
            <option key={t} value={t}>{TICKET_TYPE_META[t].icon} {TICKET_TYPE_META[t].label}</option>
          ))}
        </select>
        {(filterPriority || filterType || filterSearch || selectedSprintId) && (
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => { setFilterPriority(''); setFilterType(''); setFilterSearch(''); setSelectedSprintId('') }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ──── Board View ──── */}
      {activeTab === 'board' && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="kanban-board">
            {KANBAN_COLUMNS.map(status => {
              const colTickets = getFilteredTickets(status)
              const meta = TICKET_STATUS_META[status]
              return (
                <div key={status} className="kanban-column">
                  <div className="kanban-column__header">
                    <div className="kanban-column__title-row">
                      <span className="kanban-column__icon">{COLUMN_ICONS[status]}</span>
                      <span className="kanban-column__title">{meta.label}</span>
                      <span className="kanban-column__count" style={{ background: meta.color + '22', color: meta.color }}>
                        {colTickets.length}
                      </span>
                    </div>
                    <button
                      className="kanban-column__add-btn"
                      onClick={() => setShowCreate(true)}
                      title="Add ticket"
                    >
                      +
                    </button>
                  </div>
                  <Droppable droppableId={status}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`kanban-column__cards ${snapshot.isDraggingOver ? 'kanban-column__cards--over' : ''}`}
                      >
                        {colTickets.map((ticket, index) => (
                          <KanbanCard
                            key={ticket.id}
                            ticket={ticket}
                            index={index}
                            onClick={() => setSelectedTicketId(ticket.id)}
                          />
                        ))}
                        {provided.placeholder}
                        {colTickets.length === 0 && (
                          <div className="kanban-column__empty">
                            Drop tickets here
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              )
            })}
          </div>
        </DragDropContext>
      )}

      {/* ──── List View ──── */}
      {activeTab === 'list' && (
        <div className="ticket-list-view">
          <table className="ticket-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignees</th>
                <th>Due</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(ticket => {
                const typeMeta = TICKET_TYPE_META[ticket.type]
                const statusMeta = TICKET_STATUS_META[ticket.status]
                const priorityMeta = TICKET_PRIORITY_META[ticket.priority]
                return (
                  <tr key={ticket.id} className="ticket-table__row" onClick={() => setSelectedTicketId(ticket.id)}>
                    <td className="ticket-table__key">{ticket.ticket_key}</td>
                    <td className="ticket-table__title">{ticket.title}</td>
                    <td><span title={typeMeta.label}>{typeMeta.icon}</span></td>
                    <td>
                      <span className="status-badge" style={{ background: statusMeta.bg, color: statusMeta.color }}>
                        {statusMeta.label}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: priorityMeta.color }}>{priorityMeta.icon} {priorityMeta.label}</span>
                    </td>
                    <td>
                      <div className="ticket-table__assignees">
                        {ticket.assignees.slice(0, 3).map(a => (
                          <div key={a.id} className="ticket-table__avatar" title={a.full_name || a.username}>
                            {(a.full_name || a.username)[0].toUpperCase()}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="ticket-table__due">
                      {ticket.due_date ? ticket.due_date : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {tickets.length === 0 && (
            <div className="ticket-list-view__empty">
              <p>No tickets yet. <button className="link-btn" onClick={() => setShowCreate(true)}>Create one →</button></p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreate && project && (
        <CreateTicketModal
          project={project}
          sprints={sprints}
          members={[]}
          labels={labels}
          onClose={() => setShowCreate(false)}
          onCreated={(ticket) => {
            setTickets(prev => [ticket, ...prev])
            setShowCreate(false)
          }}
        />
      )}

      {selectedTicketId && (
        <TicketDetailModal
          ticketId={selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
          onUpdated={() => loadAll({ silent: true })}
        />
      )}

      {showSettings && project && (
        <ProjectSettingsModal 
          project={project} 
          onClose={() => setShowSettings(false)} 
          onUpdated={() => loadAll({ silent: true })} 
        />
      )}
    </div>
  )
}

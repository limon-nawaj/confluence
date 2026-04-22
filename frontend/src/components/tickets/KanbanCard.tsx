import React from 'react'
import { Draggable } from '@hello-pangea/dnd'
import type { Ticket } from '@/types/models'
import {
  TICKET_TYPE_META, TICKET_PRIORITY_META,
  formatDate, isOverdue, getInitials, getAvatarColor,
} from '@/utils/ticketUtils'

interface Props {
  ticket: Ticket
  index: number
  onClick: (ticket: Ticket) => void
}

export const KanbanCard: React.FC<Props> = ({ ticket, index, onClick }) => {
  const typeMeta = TICKET_TYPE_META[ticket.type]
  const priorityMeta = TICKET_PRIORITY_META[ticket.priority]
  const overdue = isOverdue(ticket.due_date)

  return (
    <Draggable draggableId={String(ticket.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(ticket)}
          className={`kanban-card ${snapshot.isDragging ? 'kanban-card--dragging' : ''}`}
        >
          {/* Top row: type icon + priority dot + key */}
          <div className="kanban-card__header">
            <span className="kanban-card__type-icon" title={typeMeta.label}>
              {typeMeta.icon}
            </span>
            <span className="kanban-card__key">{ticket.ticket_key}</span>
            <div className="kanban-card__spacer" />
            <span
              className="kanban-card__priority-dot"
              title={priorityMeta.label}
              style={{ background: priorityMeta.color }}
            />
          </div>

          {/* Title */}
          <p className="kanban-card__title">{ticket.title}</p>

          {/* Labels */}
          {ticket.labels.length > 0 && (
            <div className="kanban-card__labels">
              {ticket.labels.slice(0, 3).map(label => (
                <span
                  key={label.id}
                  className="kanban-card__label"
                  style={{ background: label.color + '22', color: label.color, border: `1px solid ${label.color}44` }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          )}

          {/* Footer: due date + assignees + subtask count */}
          <div className="kanban-card__footer">
            <div className="kanban-card__footer-left">
              {ticket.due_date && (
                <span
                  className="kanban-card__due"
                  style={{ color: overdue ? '#ef4444' : '#6b7280' }}
                >
                  📅 {formatDate(ticket.due_date)}
                </span>
              )}
              {ticket.children_count > 0 && (
                <span className="kanban-card__subtasks">
                  ⎇ {ticket.children_count}
                </span>
              )}
            </div>
            <div className="kanban-card__assignees">
              {ticket.assignees.slice(0, 3).map(a => (
                <div
                  key={a.id}
                  className="kanban-card__avatar"
                  title={a.full_name || a.username}
                  style={{ background: getAvatarColor(a.id) }}
                >
                  {getInitials(a.full_name, a.username)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )
}

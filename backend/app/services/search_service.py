"""
Full-text search service with unified domain aggregation and security masking.
"""
from typing import Optional

from sqlalchemy import text, or_
from sqlalchemy.orm import Session

from app.models.page import Page
from app.models.user import User
from app.models.space import Space, SpaceTeamAccess
from app.models.team import TeamMember
from app.models.permission import Permission
from app.models.ticket_project import TicketProject
from app.models.ticket import Ticket
from app.models.project_permission import ProjectPermission


def get_allowed_space_ids(db: Session, user: User) -> set[int]:
    if user.role.value == "admin":
        return {r[0] for r in db.query(Space.id).all()}
    spaces = (
        db.query(Space.id)
        .outerjoin(SpaceTeamAccess, Space.id == SpaceTeamAccess.space_id)
        .outerjoin(TeamMember, SpaceTeamAccess.team_id == TeamMember.team_id)
        .outerjoin(Permission, (Permission.space_id == Space.id) & (Permission.user_id == user.id))
        .filter(
            or_(
                Space.is_public == True,
                Space.owner_id == user.id,
                TeamMember.user_id == user.id,
                Permission.id.isnot(None),
            )
        )
        .all()
    )
    return {r[0] for r in spaces}


def get_allowed_project_ids(db: Session, user: User) -> set[int]:
    if user.role.value == "admin":
        return {r[0] for r in db.query(TicketProject.id).all()}
    projects = (
        db.query(TicketProject.id)
        .outerjoin(ProjectPermission, TicketProject.id == ProjectPermission.project_id)
        .filter(
            or_(
                TicketProject.owner_id == user.id,
                ProjectPermission.user_id == user.id
            )
        )
        .all()
    )
    return {r[0] for r in projects}


def unified_search(
    db: Session,
    query: str,
    user: User,
    space_key: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
) -> list[dict]:
    """
    Search pages using SQLite FTS5 alongside TicketProjects and Tickets.
    Enforces security layers based per domain context.
    """
    safe_query = query.replace('"', "").strip()
    if not safe_query:
        return []

    allowed_space_ids = get_allowed_space_ids(db, user)
    allowed_proj_ids = get_allowed_project_ids(db, user)

    results = []

    # 1. SEARCH PAGES (Confluence equivalent)
    if allowed_space_ids:
        space_list = ",".join(map(str, allowed_space_ids))
        space_filter = f"AND p.space_id IN ({space_list})" if user.role.value != "admin" else ""
        
        if space_key:
            sql = text(f"""
                SELECT p.id, p.title, s.id as space_id, s.key, snippet(pages_fts, 1, '<mark>', '</mark>', '...', 32)
                FROM pages_fts JOIN pages p ON p.id = pages_fts.rowid JOIN spaces s ON s.id = p.space_id
                WHERE pages_fts MATCH :query AND s.key = :space_key AND p.is_published = 1 {space_filter}
                LIMIT :limit OFFSET :offset
            """)
        else:
            sql = text(f"""
                SELECT p.id, p.title, s.id as space_id, s.key, snippet(pages_fts, 1, '<mark>', '</mark>', '...', 32)
                FROM pages_fts JOIN pages p ON p.id = pages_fts.rowid JOIN spaces s ON s.id = p.space_id
                WHERE pages_fts MATCH :query AND p.is_published = 1 {space_filter}
                LIMIT :limit OFFSET :offset
            """)
        
        rows = db.execute(sql, {"query": safe_query, "space_key": space_key, "limit": limit, "offset": offset}).fetchall()
        for r in rows:
            results.append({
                "type": "page",
                "page_id": r[0],
                "title": r[1],
                "space_id": r[2],
                "space_key": r[3],
                "snippet": r[4]
            })

    # 2. SEARCH PROJECTS & TICKETS (Jira equivalent)
    if not space_key and allowed_proj_ids:
        like_q = f"%{safe_query}%"
        
        # Tickets
        tickets = (
            db.query(Ticket, TicketProject.key)
            .join(TicketProject, TicketProject.id == Ticket.project_id)
            .filter(
                Ticket.project_id.in_(allowed_proj_ids),
                or_(Ticket.title.ilike(like_q), Ticket.ticket_key.ilike(like_q))
            )
            .limit(limit)
            .offset(offset)
            .all()
        )
        
        for t, p_key in tickets:
            results.append({
                "type": "ticket",
                "page_id": t.id,
                "title": f"{t.ticket_key}: {t.title}",
                "space_id": t.project_id,
                "space_key": p_key,
                "snippet": ""
            })
            
        # Projects
        projects = (
            db.query(TicketProject)
            .filter(
                TicketProject.id.in_(allowed_proj_ids),
                or_(TicketProject.name.ilike(like_q), TicketProject.key.ilike(like_q))
            )
            .limit(limit)
            .offset(offset)
            .all()
        )
        
        for p in projects:
            results.append({
                "type": "project",
                "page_id": p.id,
                "title": f"Project: {p.name}",
                "space_id": p.id,
                "space_key": p.key,
                "snippet": f"Issue Tracker / {p.key}"
            })

    return results


def rebuild_fts_index(db: Session) -> None:
    """Rebuild the FTS index from scratch (admin utility)."""
    db.execute(text("INSERT INTO pages_fts(pages_fts) VALUES('rebuild')"))
    db.commit()

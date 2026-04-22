"""
Full-text search service.

SQLite implementation uses FTS5 via a raw SQL virtual table.
Oracle migration: replace the query inside `search_pages` with an Oracle Text
CONTAINS() query — this is the ONLY function that changes for Oracle.
"""
from typing import Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models.page import Page


def search_pages(
    db: Session,
    query: str,
    space_key: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
) -> list[dict]:
    """
    Search pages using SQLite FTS5.
    Returns a list of dicts with page_id, title, snippet.
    """
    # Sanitize query to prevent FTS syntax errors
    safe_query = query.replace('"', "").strip()
    if not safe_query:
        return []

    # Build the base FTS query
    sql = text(
        """
        SELECT
            p.id          AS page_id,
            p.title       AS title,
            p.space_id    AS space_id,
            s.key         AS space_key,
            snippet(pages_fts, 1, '<mark>', '</mark>', '...', 32) AS snippet
        FROM pages_fts
        JOIN pages p ON p.id = pages_fts.rowid
        JOIN spaces s ON s.id = p.space_id
        WHERE pages_fts MATCH :query
          AND (:space_key IS NULL OR s.key = :space_key)
          AND p.is_published = 1
        ORDER BY rank
        LIMIT :limit OFFSET :offset
        """
    )

    rows = db.execute(
        sql,
        {"query": safe_query, "space_key": space_key, "limit": limit, "offset": offset},
    ).fetchall()

    return [
        {
            "page_id": r.page_id,
            "title": r.title,
            "space_id": r.space_id,
            "space_key": r.space_key,
            "snippet": r.snippet,
        }
        for r in rows
    ]


def rebuild_fts_index(db: Session) -> None:
    """Rebuild the FTS index from scratch (admin utility)."""
    db.execute(text("INSERT INTO pages_fts(pages_fts) VALUES('rebuild')"))
    db.commit()

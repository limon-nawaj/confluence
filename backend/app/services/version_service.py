import difflib

from sqlalchemy.orm import Session

from app.models.page import Page
from app.models.page_version import PageVersion


def get_versions(db: Session, page_id: int, skip: int = 0, limit: int = 50) -> list[PageVersion]:
    return (
        db.query(PageVersion)
        .filter(PageVersion.page_id == page_id)
        .order_by(PageVersion.version_number.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_version(db: Session, version_id: int) -> PageVersion | None:
    return db.get(PageVersion, version_id)


def restore_version(db: Session, version: PageVersion, author_id: int) -> Page:
    """Restore a version by creating a new page version with the old content."""
    from app.services.page_service import _snapshot

    page = db.get(Page, version.page_id)
    if page is None:
        raise ValueError("Page not found")

    # Snapshot current state first
    _snapshot(db, page, author_id, f"Before restore to v{version.version_number}")

    page.title = version.title
    page.content = version.content
    page.content_text = version.content_text

    # Snapshot restored state
    _snapshot(db, page, author_id, f"Restored from v{version.version_number}")

    db.commit()
    db.refresh(page)
    return page


def compute_diff(version_a: PageVersion, version_b: PageVersion) -> list[str]:
    """Return unified diff lines between two version content_text strings."""
    a_lines = version_a.content_text.splitlines(keepends=True)
    b_lines = version_b.content_text.splitlines(keepends=True)
    return list(
        difflib.unified_diff(
            a_lines,
            b_lines,
            fromfile=f"v{version_a.version_number}",
            tofile=f"v{version_b.version_number}",
        )
    )

import json
from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from app.models.page import Page
from app.models.page_version import PageVersion
from app.schemas.page import PageCreate, PageDetailResponse, PageUpdate
from app.services import notification_service

def filter_page_tree(page_obj: Page, current_user_id: int) -> PageDetailResponse:
    """Convert ORM Page to Pydantic and filter out unpublished children."""
    pydantic_page = PageDetailResponse.model_validate(page_obj)

    def _filter(node: PageDetailResponse):
        node.children = [
            c for c in node.children
            if c.is_published or c.author_id == current_user_id
        ]
        for child in node.children:
            _filter(child)
            
    _filter(pydantic_page)
    return pydantic_page
def _extract_text(content_json: str | None) -> str:
    """Extract plain text from Tiptap JSON for FTS indexing."""
    if not content_json:
        return ""
    try:
        doc = json.loads(content_json)
    except (json.JSONDecodeError, TypeError):
        return content_json or ""

    parts: list[str] = []

    def walk(node: dict) -> None:
        if node.get("type") == "text":
            parts.append(node.get("text", ""))
        for child in node.get("content", []):
            walk(child)

    walk(doc)
    return " ".join(parts)


def _children_loader():
    """Build a recursive selectinload chain for up to 8 levels deep."""
    # SQLAlchemy doesn't natively support infinite recursion in selectinload,
    # so we chain it explicitly up to a reasonable depth (8 levels is plenty).
    loader = selectinload(Page.children)
    current = loader
    for _ in range(7):
        current = current.selectinload(Page.children)
    return loader


def get_page(db: Session, page_id: int) -> Page | None:
    return (
        db.query(Page)
        .options(_children_loader())
        .filter(Page.id == page_id)
        .first()
    )


def get_root_pages(db: Session, space_id: int, current_user_id: int) -> list[Page]:
    return (
        db.query(Page)
        .options(_children_loader())
        .filter(
            Page.space_id == space_id,
            Page.parent_id == None,
            or_(Page.is_published == True, Page.author_id == current_user_id),
        )
        .order_by(Page.position)
        .all()
    )


def create_page(db: Session, space_id: int, author_id: int, data: PageCreate) -> Page:
    content_text = _extract_text(data.content)
    page = Page(
        title=data.title,
        content=data.content,
        content_text=content_text,
        space_id=space_id,
        parent_id=data.parent_id,
        author_id=author_id,
        is_published=data.is_published,
        template_id=data.template_id,
    )
    db.add(page)
    db.flush()
    # Save initial version
    _snapshot(db, page, author_id, "Initial version")
    db.commit()
    db.refresh(page)
    return page


def update_page(db: Session, page: Page, editor_id: int, data: PageUpdate) -> Page:
    # Snapshot before applying changes — records this editor in version history
    _snapshot(db, page, editor_id, data.change_summary or "Updated")

    if data.title is not None:
        page.title = data.title
    if data.content is not None:
        page.content = data.content
        page.content_text = _extract_text(data.content)
    if data.is_published is not None:
        page.is_published = data.is_published

    db.commit()
    db.refresh(page)

    # Notify the original author and all prior contributors, excluding the
    # person who just made the edit (no self-notifications).
    prior_contributor_ids = {
        row.author_id
        for row in db.query(PageVersion.author_id)
        .filter(PageVersion.page_id == page.id)
        .distinct()
        .all()
    }
    # Always include the original author even if they have no version yet
    prior_contributor_ids.add(page.author_id)
    # Don't notify the editor themselves
    recipients = prior_contributor_ids - {editor_id}

    for recipient_id in recipients:
        notification_service.create_notification(
            db,
            recipient_id=recipient_id,
            actor_id=editor_id,
            page_id=page.id,
            type="page_modified",
            message=f"Page '{page.title}' was edited by another contributor.",
        )

    return page


def publish_tree(db: Session, page: Page) -> list[Page]:
    """Recursively publish a page and all its descendants."""
    affected: list[Page] = []

    def _publish_recursive(p: Page) -> None:
        p.is_published = True
        affected.append(p)
        for child in p.children:
            _publish_recursive(child)

    _publish_recursive(page)
    db.commit()
    db.refresh(page)
    return affected


def delete_page(db: Session, page: Page) -> None:
    db.delete(page)
    db.commit()


def move_page(
    db: Session, page: Page, parent_id: Optional[int], space_id: Optional[int]
) -> Page:
    if parent_id is not None:
        page.parent_id = parent_id
    if space_id is not None:
        page.space_id = space_id
    db.commit()
    db.refresh(page)
    return page


def _snapshot(db: Session, page: Page, author_id: int, summary: str) -> PageVersion:
    max_ver = (
        db.query(PageVersion)
        .filter(PageVersion.page_id == page.id)
        .count()
    )
    version = PageVersion(
        page_id=page.id,
        version_number=max_ver + 1,
        title=page.title or "",
        content=page.content or "{}",
        content_text=page.content_text or "",
        change_summary=summary,
        author_id=author_id,
    )
    db.add(version)
    return version

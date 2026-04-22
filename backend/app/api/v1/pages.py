from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.page import PageDetailResponse, PageMove, PageResponse, PageUpdate
from app.services import page_service, space_service
from app.models.space import Space

router = APIRouter()


def _get_page_or_404(db: Session, page_id: int):
    page = page_service.get_page(db, page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page


@router.get("/{page_id}", response_model=PageDetailResponse)
def get_page(
    page_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    page = _get_page_or_404(db, page_id)
    if not page.is_published and page.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="This page is a draft")
    return page_service.filter_page_tree(page, current_user.id)


@router.put("/{page_id}", response_model=PageDetailResponse)
def update_page(
    page_id: int,
    data: PageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    page = _get_page_or_404(db, page_id)
    # Any authenticated user can edit any page. Contributors are tracked via
    # page_versions and the original author + all prior contributors are notified.
    updated_page = page_service.update_page(db, page, current_user.id, data)
    return page_service.filter_page_tree(updated_page, current_user.id)


@router.delete("/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_page(
    page_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    page = _get_page_or_404(db, page_id)
    space = db.query(Space).get(page.space_id)
    is_space_owner = space.owner_id == current_user.id
    if not is_space_owner and page.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the page author or space owner can delete this page")
    page_service.delete_page(db, page)


@router.patch("/{page_id}/move", response_model=PageResponse)
def move_page(
    page_id: int,
    data: PageMove,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    page = _get_page_or_404(db, page_id)
    space = db.query(Space).get(page.space_id)
    if not space_service.has_space_write_access(db, space, current_user.id) and page.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only authors or space editors can move this page")
    return page_service.move_page(db, page, data.parent_id, data.space_id)


@router.post("/{page_id}/publish", response_model=PageResponse)
def toggle_publish(
    page_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    page = _get_page_or_404(db, page_id)
    space = db.query(Space).get(page.space_id)
    is_space_owner = space.owner_id == current_user.id
    if not is_space_owner and page.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the page author or space owner can publish this page")
    page.is_published = not page.is_published
    db.commit()
    db.refresh(page)
    return page


@router.post("/{page_id}/publish-tree", response_model=list[PageResponse])
def publish_tree(
    page_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Publish this page and all its descendants recursively."""
    page = _get_page_or_404(db, page_id)
    space = db.query(Space).get(page.space_id)
    is_space_owner = space.owner_id == current_user.id
    if not is_space_owner and page.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the page author or space owner can publish this tree")
    return page_service.publish_tree(db, page)


@router.get("/{page_id}/children", response_model=list[PageResponse])
def get_children(
    page_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    page = _get_page_or_404(db, page_id)
    return [
        child for child in page.children
        if child.is_published or child.author_id == current_user.id
    ]

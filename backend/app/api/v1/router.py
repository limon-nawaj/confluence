from fastapi import APIRouter

from app.api.v1 import (
    attachments,
    auth,
    comments,
    notifications,
    pages,
    permissions,
    search,
    spaces,
    templates,
    teams,
    users,
    versions,
    ticket_projects,
    tickets,
    sprints,
)

api_router = APIRouter()

api_router.include_router(auth.router,             prefix="/auth",            tags=["auth"])
api_router.include_router(users.router,            prefix="/users",           tags=["users"])
api_router.include_router(spaces.router,           prefix="/spaces",          tags=["spaces"])
api_router.include_router(pages.router,            prefix="/pages",           tags=["pages"])
api_router.include_router(versions.router,         prefix="/versions",        tags=["versions"])
api_router.include_router(comments.router,         prefix="/comments",        tags=["comments"])
api_router.include_router(attachments.router,      prefix="/attachments",     tags=["attachments"])
api_router.include_router(permissions.router,      prefix="/permissions",     tags=["permissions"])
api_router.include_router(search.router,           prefix="/search",          tags=["search"])
api_router.include_router(templates.router,        prefix="/templates",       tags=["templates"])
api_router.include_router(teams.router,            prefix="/teams",           tags=["teams"])
api_router.include_router(notifications.router,    prefix="/notifications",   tags=["notifications"])
api_router.include_router(ticket_projects.router,  prefix="/ticket-projects", tags=["ticket-projects"])
api_router.include_router(tickets.router,          prefix="/tickets",         tags=["tickets"])
api_router.include_router(sprints.router,          prefix="/sprints",         tags=["sprints"])

